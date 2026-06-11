import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInvoiceDto, userId: string) {
    let invoiceTotal = 0;
    let invoiceTaxes = 0;
    const globalDiscounts = dto.globalDiscounts ?? 0;

    const itemsData = dto.items.map(item => {
      const quantity = item.quantity ?? 1;
      const taxRate = item.taxRate ?? 0;
      const discount = item.discount ?? 0;
      
      const totalPrice = quantity * item.unitPrice;
      const taxableAmount = totalPrice - discount;
      const itemTax = taxableAmount * (taxRate / 100);
      const netPrice = taxableAmount + itemTax;

      invoiceTotal += netPrice;
      invoiceTaxes += itemTax;

      return {
        productName: item.productName,
        rawName: item.rawName,
        categoryId: item.categoryId,
        quantity,
        unit: item.unit ?? 'UNIT',
        unitPrice: item.unitPrice,
        totalPrice,
        taxRate,
        discount,
        netPrice: parseFloat(netPrice.toFixed(2)),
        brand: item.brand || null,
        barcode: item.barcode || null,
      };
    });

    const totalAmount = parseFloat((invoiceTotal - globalDiscounts).toFixed(2));

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: dto.invoiceNumber,
          date: new Date(dto.date),
          paymentMode: dto.paymentMode,
          comments: dto.comments,
          attachmentUrl: dto.attachmentUrl,
          totalAmount,
          totalTaxes: parseFloat(invoiceTaxes.toFixed(2)),
          globalDiscounts,
          storeId: dto.storeId,
          userId,
        },
      });

      // Learn store alias if rawStoreName was provided and maps to the selected storeId
      if (dto.rawStoreName && dto.storeId) {
        await tx.ocrStoreMap.upsert({
          where: { rawName: dto.rawStoreName.trim() },
          update: { storeId: dto.storeId },
          create: { rawName: dto.rawStoreName.trim(), storeId: dto.storeId },
        });
      }

      for (const item of itemsData) {
        await tx.product.upsert({
          where: {
            userId_name: {
              userId,
              name: item.productName.trim(),
            },
          },
          update: { categoryId: item.categoryId },
          create: {
            userId,
            name: item.productName.trim(),
            categoryId: item.categoryId,
          },
        });

        // Learn product abbreviation mapping
        if (item.rawName && item.rawName.trim().toLowerCase() !== item.productName.trim().toLowerCase()) {
          await tx.ocrProductMap.upsert({
            where: { rawName: item.rawName.trim() },
            update: { mappedName: item.productName.trim() },
            create: { rawName: item.rawName.trim(), mappedName: item.productName.trim() },
          });
        }

        const { rawName, ...dbItem } = item;
        await tx.invoiceItem.create({
          data: {
            ...dbItem,
            invoiceId: invoice.id,
          },
        });
      }

      return tx.invoice.findUnique({
        where: { id: invoice.id },
        include: { items: true, store: true },
      });
    });
  }

  async findAll(query: {
    search?: string;
    storeId?: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    paymentMode?: string;
  }) {
    const where: any = {};

    if (query.storeId) {
      where.storeId = query.storeId;
    }

    if (query.paymentMode) {
      where.paymentMode = query.paymentMode;
    }

    if (query.categoryId) {
      where.items = {
        some: {
          categoryId: query.categoryId,
        },
      };
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.date.lte = new Date(query.endDate);
      }
    }

    if (query.search) {
      where.OR = [
        { invoiceNumber: { contains: query.search, mode: 'insensitive' } },
        { comments: { contains: query.search, mode: 'insensitive' } },
        {
          items: {
            some: {
              productName: { contains: query.search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    return this.prisma.invoice.findMany({
      where,
      include: {
        store: true,
        items: {
          include: { category: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        store: true,
        items: {
          include: { category: true },
        },
      },
    });
    if (!invoice) {
      throw new NotFoundException('Facture introuvable');
    }
    return invoice;
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    const currentInvoice = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const globalDiscounts = dto.globalDiscounts ?? currentInvoice.globalDiscounts;

      // If items are provided, delete them and replace them.
      if (dto.items) {
        // Delete current items
        await tx.invoiceItem.deleteMany({
          where: { invoiceId: id },
        });

        // Compute new totals
        let invoiceTotal = 0;
        let invoiceTaxes = 0;

        const itemsData = dto.items.map(item => {
          const quantity = item.quantity ?? 1;
          const taxRate = item.taxRate ?? 0;
          const discount = item.discount ?? 0;
          
          const totalPrice = quantity * item.unitPrice;
          const taxableAmount = totalPrice - discount;
          const itemTax = taxableAmount * (taxRate / 100);
          const netPrice = taxableAmount + itemTax;

          invoiceTotal += netPrice;
          invoiceTaxes += itemTax;

          return {
            productName: item.productName,
            rawName: item.rawName,
            categoryId: item.categoryId,
            quantity,
            unit: item.unit ?? 'UNIT',
            unitPrice: item.unitPrice,
            totalPrice,
            taxRate,
            discount,
            netPrice: parseFloat(netPrice.toFixed(2)),
            brand: item.brand || null,
            barcode: item.barcode || null,
            invoiceId: id,
          };
        });

        // Learn store alias if rawStoreName was provided and maps to the selected storeId
        if (dto.rawStoreName && dto.storeId) {
          await tx.ocrStoreMap.upsert({
            where: { rawName: dto.rawStoreName.trim() },
            update: { storeId: dto.storeId },
            create: { rawName: dto.rawStoreName.trim(), storeId: dto.storeId },
          });
        }

        // Insert new items
        for (const item of itemsData) {
          await tx.product.upsert({
            where: {
              userId_name: {
                userId: currentInvoice.userId,
                name: item.productName.trim(),
              },
            },
            update: { categoryId: item.categoryId },
            create: {
              userId: currentInvoice.userId,
              name: item.productName.trim(),
              categoryId: item.categoryId,
            },
          });

          // Learn product abbreviation mapping
          if (item.rawName && item.rawName.trim().toLowerCase() !== item.productName.trim().toLowerCase()) {
            await tx.ocrProductMap.upsert({
              where: { rawName: item.rawName.trim() },
              update: { mappedName: item.productName.trim() },
              create: { rawName: item.rawName.trim(), mappedName: item.productName.trim() },
            });
          }

          const { rawName, ...dbItem } = item;
          await tx.invoiceItem.create({ data: dbItem });
        }

        // Update basic invoice details
        const totalAmount = parseFloat((invoiceTotal - globalDiscounts).toFixed(2));

        await tx.invoice.update({
          where: { id },
          data: {
            invoiceNumber: dto.invoiceNumber ?? currentInvoice.invoiceNumber,
            date: dto.date ? new Date(dto.date) : currentInvoice.date,
            paymentMode: dto.paymentMode ?? currentInvoice.paymentMode,
            comments: dto.comments ?? currentInvoice.comments,
            attachmentUrl: dto.attachmentUrl ?? currentInvoice.attachmentUrl,
            storeId: dto.storeId ?? currentInvoice.storeId,
            totalAmount,
            totalTaxes: parseFloat(invoiceTaxes.toFixed(2)),
            globalDiscounts,
          },
        });
      } else {
        // Simply update fields
        const itemSum = currentInvoice.items.reduce((sum, item) => sum + item.netPrice, 0);
        const totalAmount = parseFloat((itemSum - globalDiscounts).toFixed(2));

        await tx.invoice.update({
          where: { id },
          data: {
            invoiceNumber: dto.invoiceNumber ?? currentInvoice.invoiceNumber,
            date: dto.date ? new Date(dto.date) : currentInvoice.date,
            paymentMode: dto.paymentMode ?? currentInvoice.paymentMode,
            comments: dto.comments ?? currentInvoice.comments,
            attachmentUrl: dto.attachmentUrl ?? currentInvoice.attachmentUrl,
            storeId: dto.storeId ?? currentInvoice.storeId,
            globalDiscounts,
            totalAmount,
          },
        });
      }

      return tx.invoice.findUnique({
        where: { id },
        include: { items: true, store: true },
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.invoice.delete({
      where: { id },
    });
  }

  // Simulated OCR endpoint
  async simulateOCR(filename: string) {
    console.log(`Parsing receipt mock for file: ${filename}`);
    
    // Fetch default categories & stores to link properly
    const categories = await this.prisma.category.findMany();
    const stores = await this.prisma.store.findMany();

    const alimentation = categories.find(c => c.name === 'Alimentation') || categories[0];
    const menagers = categories.find(c => c.name === 'Produits ménagers') || categories[0];
    const carburant = categories.find(c => c.name === 'Carburant') || categories[0];
    
    const costco = stores.find(s => s.name === 'Costco') || stores[0];
    const walmart = stores.find(s => s.name === 'Walmart') || stores[0];
    const shell = stores.find(s => s.name === 'Shell') || stores[0];

    const lowerName = filename.toLowerCase();

    if (lowerName.includes('costco')) {
      return {
        storeId: costco.id,
        storeName: costco.name,
        invoiceNumber: `OCR-CST-${Math.floor(Math.random() * 90000 + 10000)}`,
        date: new Date().toISOString().split('T')[0],
        paymentMode: 'CREDIT_CARD',
        items: [
          { productName: 'Lait 2L', categoryId: alimentation.id, quantity: 4, unit: 'LITRE', unitPrice: 4.69, taxRate: 0, discount: 0, brand: 'Québon' },
          { productName: 'Riz 5kg', categoryId: alimentation.id, quantity: 1, unit: 'KG', unitPrice: 11.99, taxRate: 0, discount: 1.50, brand: 'Uncle Ben\'s' },
        ],
        comments: 'Extrait via OCR (Costco)',
      };
    } else if (lowerName.includes('shell')) {
      return {
        storeId: shell.id,
        storeName: shell.name,
        invoiceNumber: `OCR-SHL-${Math.floor(Math.random() * 90000 + 10000)}`,
        date: new Date().toISOString().split('T')[0],
        paymentMode: 'CREDIT_CARD',
        items: [
          { productName: 'Essence Ordinaire 1L', categoryId: carburant.id, quantity: 50, unit: 'LITRE', unitPrice: 1.68, taxRate: 15.0, discount: 0, brand: 'Shell' },
        ],
        comments: 'Extrait via OCR (Shell)',
      };
    } else {
      // Walmart / Generic default
      return {
        storeId: walmart.id,
        storeName: walmart.name,
        invoiceNumber: `OCR-WMT-${Math.floor(Math.random() * 90000 + 10000)}`,
        date: new Date().toISOString().split('T')[0],
        paymentMode: 'DEBIT_CARD',
        items: [
          { productName: 'Lait 2L', categoryId: alimentation.id, quantity: 2, unit: 'LITRE', unitPrice: 4.99, taxRate: 0, discount: 0, brand: 'Beatrice' },
          { productName: 'Œufs 12', categoryId: alimentation.id, quantity: 1, unit: 'UNIT', unitPrice: 4.29, taxRate: 0, discount: 0, brand: 'Selection' },
          { productName: 'Savon liquide mains', categoryId: menagers.id, quantity: 2, unit: 'UNIT', unitPrice: 3.99, taxRate: 15.0, discount: 1.00, brand: 'Softsoap' },
        ],
        comments: 'Extrait via OCR (Walmart)',
      };
    }
  }

  async processOCR(imageBase64: string, userId?: string) {
    // 1. Convert base64 payload to Buffer (handling any data URI prefixes)
    const base64Data = imageBase64.includes(';base64,') 
      ? imageBase64.split(';base64,')[1] 
      : imageBase64;
    const buffer = Buffer.from(base64Data, 'base64');


    // 3. Run Tesseract OCR on the image buffer
    const { createWorker } = require('tesseract.js');
    const worker = await createWorker('fra'); // French training data
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();

    console.log('--- OCR EXTRACTED TEXT ---');
    console.log(text);
    console.log('--------------------------');

    // 4. Process/parse the text
    return this.parseOCRText(text, userId);
  }

  async parseOCRText(text: string, userId?: string) {
    const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const lowerText = text.toLowerCase();

    // Preprocess lines: Split merged lines having multiple prices, but NOT rate lines containing '@'
    const lines: string[] = [];
    for (const rawLine of rawLines) {
      const priceRegex = /(-?\d+[\.,]\d{2}-?)(?:\s+([A-Za-z0-9]))?/g;
      const lineMatches = [...rawLine.matchAll(priceRegex)];
      if (lineMatches.length > 1 && !rawLine.includes('@')) {
        let lastIdx = 0;
        for (const match of lineMatches) {
          const matchEnd = match.index + match[0].length;
          const part = rawLine.substring(lastIdx, matchEnd).trim();
          if (part) {
            lines.push(part);
          }
          lastIdx = matchEnd;
        }
        const remaining = rawLine.substring(lastIdx).trim();
        if (remaining) {
          lines.push(remaining);
        }
      } else {
        lines.push(rawLine);
      }
    }

    // 1. Detect Store
    let detectedStoreName = '';
    let storeId = '';

    // Check OcrStoreMap in database
    const cleanTextNoSpaces = lowerText.replace(/\s+/g, '');
    const ocrStoreMaps = await this.prisma.ocrStoreMap.findMany({
      where: userId ? { store: { userId } } : undefined,
      include: { store: true }
    });
    for (const map of ocrStoreMaps) {
      const cleanMapName = map.rawName.toLowerCase().replace(/\s+/g, '');
      if (cleanTextNoSpaces.includes(cleanMapName)) {
        detectedStoreName = map.rawName;
        storeId = map.storeId;
        break;
      }
    }

    // If not found in maps, check default stores in database
    if (!storeId) {
      const stores = await this.prisma.store.findMany({
        where: userId ? { userId } : undefined,
      });
      for (const store of stores) {
        const cleanStoreName = store.name.toLowerCase().replace(/\s+/g, '');
        if (cleanTextNoSpaces.includes(cleanStoreName)) {
          detectedStoreName = store.name;
          storeId = store.id;
          break;
        }
      }
    }

    // Direct match for Nero -> No Frills (common OCR misread of No Frills)
    if (!storeId && cleanTextNoSpaces.includes('nero')) {
      const noFrills = await this.prisma.store.findFirst({
        where: {
          name: { contains: 'No Frills', mode: 'insensitive' },
          userId: userId || undefined,
        }
      });
      if (noFrills) {
        storeId = noFrills.id;
        detectedStoreName = noFrills.name;
      }
    }

    // Default to first store if none detected
    if (!storeId) {
      const firstStore = await this.prisma.store.findFirst({
        where: userId ? { userId } : undefined,
      });
      storeId = firstStore?.id || '';
      detectedStoreName = firstStore?.name || 'Inconnu';
    }

    // 2. Detect Date
    // Find format like DD/MM/YYYY or YYYY-MM-DD or DD-MM-YY
    let dateStr = new Date().toISOString().split('T')[0];
    const dateRegexes = [
      /(\d{4})[-/.](\d{2})[-/.](\d{2})/, // YYYY-MM-DD
      /(\d{2})[-/.](\d{2})[-/.](\d{4})/, // DD-MM-YYYY
      /(\d{2})[-/.](\d{2})[-/.](\d{2})/  // DD-MM-YY
    ];

    for (const regex of dateRegexes) {
      const match = text.match(regex);
      if (match) {
        try {
          if (regex === dateRegexes[0]) {
            dateStr = `${match[1]}-${match[2]}-${match[3]}`;
          } else if (regex === dateRegexes[1]) {
            dateStr = `${match[3]}-${match[2]}-${match[1]}`;
          } else if (regex === dateRegexes[2]) {
            const year = parseInt(match[3]) > 50 ? `19${match[3]}` : `20${match[3]}`;
            dateStr = `${year}-${match[2]}-${match[1]}`;
          }
          if (!isNaN(Date.parse(dateStr))) {
            break;
          }
        } catch (e) {
          // ignore
        }
      }
    }

    // 3. Detect Payment Mode
    let paymentMode = 'DEBIT_CARD';
    if (/cash|espece|liquide|argent/i.test(lowerText)) {
      paymentMode = 'CASH';
    } else if (/credit|visa|mastercard|amex|mc|credit_card/i.test(lowerText)) {
      paymentMode = 'CREDIT_CARD';
    } else if (/wire|virement|interac/i.test(lowerText)) {
      paymentMode = 'WIRE_TRANSFER';
    }

    // 4. Extract Items
    const items: any[] = [];
    
    // Fetch all mapped product names
    const ocrProductMaps = await this.prisma.ocrProductMap.findMany();
    const productMap = new Map<string, string>();
    ocrProductMaps.forEach(m => productMap.set(m.rawName.toLowerCase(), m.mappedName));

    // Also fetch categories to auto-assign
    const categories = await this.prisma.category.findMany();
    const alimentation = categories.find(c => c.name.toLowerCase() === 'alimentation') || categories[0];

    // Find all products to match their latest category
    const knownProducts = await this.prisma.product.findMany();
    const productCategoryMap = new Map<string, string>();
    knownProducts.forEach(p => productCategoryMap.set(p.name.toLowerCase(), p.categoryId));

    const itemRegex = /^(.+?)\s+(-?\s*\d+[\.,]\d{1,2}\s*-?)\s*([A-Za-z0-9])?$/;
    let pendingNamePrefix = '';
    let lastNonMatchLine = '';
    let inFooter = false;

    for (const line of lines) {
      const parts = line.split(/\s+/);
      const firstToken = parts[0] || '';
      
      // Strict barcode match: replace old check with regex on pure digits
      const isBarcode = /^\d{6,14}$/.test(firstToken.replace(/[^0-9]/g, ''));

      const cleanLine = line.trim();
      const isDateOrTime = /\d{2}[-/.]\d{2}[-/.]\d{2,4}/.test(cleanLine) || /\d{2}:\d{2}/.test(cleanLine);
      
      // Check if we hit the footer / totals section
      if (/total|subtotal|sous-total|solde|balance|approved|changement|payment|payer|credit\s+card|debit\s+card/i.test(cleanLine)) {
        inFooter = true;
      }

      if (inFooter) {
        continue;
      }

      // Department headers and other noises to ignore
      const shouldIgnore = isDateOrTime || 
        /tax|tps|tvq|tva|hst|gst|tvh|provincial|federal|merci|banque|facture|date|changement|remplir|points|optimum|visa|mastercard|approved|purchase|merchant|author/i.test(cleanLine) ||
        /grocery|produce|dairy|meat|bakery|deli|frozen|seafood|epicerie|fruits|legumes|surgeles|boucherie|boulangerie|cremerie|charcuterie|poissonnerie/i.test(cleanLine);

      if (shouldIgnore && !isBarcode) {
        pendingNamePrefix = '';
        lastNonMatchLine = '';
        continue;
      }

      const match = line.match(itemRegex);
      if (match) {
        let rawProductName = match[1].trim();

        // Combine with pendingNamePrefix if exists, otherwise try look-back line if it has previous description
        if (pendingNamePrefix) {
          rawProductName = (pendingNamePrefix + ' ' + rawProductName).trim();
          pendingNamePrefix = '';
        } else if (lastNonMatchLine) {
          rawProductName = (lastNonMatchLine + ' ' + rawProductName).trim();
          lastNonMatchLine = '';
        }

        // Clean internal details (barcodes, rates, units)
        rawProductName = rawProductName.replace(/\b\d{7,13}\b/g, ''); // strip 7-13 digit barcodes
        rawProductName = rawProductName.replace(/\(\d+\s*@\s*\d+[\.,]\d{2}\)/g, ''); // strip rate (1 @ 13.15)
        rawProductName = rawProductName.replace(/\b\d+(?:ML|L|G|KG|ea|DEP)\b/ig, ''); // strip volumes and units
        rawProductName = rawProductName.replace(/DEP\s*\d+/ig, ''); // strip DEP 60
        rawProductName = rawProductName.replace(/^[\d\.\-\s]+/, '').trim();
        rawProductName = rawProductName.replace(/^(ve|ot|to|ao)\s+/i, '').trim();

        if (/^\d+$/.test(rawProductName) || rawProductName.length < 2) {
          continue;
        }

        let priceStr = match[2].replace(',', '.').replace(/\s+/g, '');
        
        if (/^\d+\.\d$/.test(priceStr)) {
          priceStr += '9';
        } else if (/^\d+\.\d[238]$/.test(priceStr)) {
          priceStr = priceStr.slice(0, -1) + '9';
        }

        const isNegative = priceStr.startsWith('-') || priceStr.endsWith('-');
        const cleanPriceStr = priceStr.replace('-', '');
        let unitPrice = parseFloat(cleanPriceStr);
        if (isNaN(unitPrice) || unitPrice === 0) {
          continue;
        }
        if (isNegative) {
          unitPrice = -unitPrice;
        }

        // Clean trailing tax codes without deleting general valid words (e.g. keeping BGS, POUDER)
        rawProductName = rawProductName.replace(/\s+(À\s+)?(HMRJ|HMRU|MRJ|MR|HMR|HR|RJ|HRJ|Y|H|M|Ma[”"″]?)$/i, '').trim();
        rawProductName = rawProductName.replace(/\s+[^A-Za-z0-9]+$/, '').trim();

        const isDiscount = /pricing|member|discount|rabais|epargne|reduction|pricing|nenber/i.test(rawProductName) || unitPrice < 0;

        if (isDiscount) {
          const discountVal = Math.abs(unitPrice);
          if (items.length > 0) {
            items[items.length - 1].discount += discountVal;
          }
          continue;
        }

        let quantity = 1;
        let unit = 'UNIT';
        let customUnitPrice = unitPrice;

        // Extract weighed items quantity, unit and unit price (e.g. 1.070 kg @ $1.52/kg)
        const weightMatch = rawProductName.match(/\b(\d+(?:[\.,]\d+)?)\s*(KG|LBS|LB|G)\s*@\s*\$?(\d+(?:[\.,]\d+)?)/i);
        if (weightMatch) {
          quantity = parseFloat(weightMatch[1].replace(',', '.'));
          unit = weightMatch[2].toUpperCase();
          customUnitPrice = parseFloat(weightMatch[3].replace(',', '.'));
          rawProductName = rawProductName.replace(/\b(\d+(?:[\.,]\d+)?)\s*(KG|LBS|LB|G)\s*@\s*\$?(\d+(?:[\.,]\d+)?)(?:\/(?:kg|lbs|lb|g))?/i, '').replace(/\s+/g, ' ').trim();
        } else {
          // Regular volumes and units
          const mlMatch = rawProductName.match(/\b(\d+)\s*(ML|HL)\b/i);
          const lMatch = rawProductName.match(/\b(\d+(?:[\.,]\d+)?)\s*(L|LITRE|LITRES)\b/i);
          const qtyUnitMatch = rawProductName.match(/\b(\d+)\s*(LB|LBS|LABS)\b/i);

          if (mlMatch) {
            const mlVal = parseInt(mlMatch[1]);
            quantity = mlVal / 1000;
            unit = 'LITRE';
            if (quantity > 0) {
              customUnitPrice = unitPrice / quantity;
            }
            rawProductName = rawProductName.replace(/\b\d+\s*(ML|HL)\b/i, '').replace(/\s+/g, ' ').trim();
          } else if (lMatch) {
            const lVal = parseFloat(lMatch[1].replace(',', '.'));
            quantity = lVal;
            unit = 'LITRE';
            if (quantity > 0) {
              customUnitPrice = unitPrice / quantity;
            }
            rawProductName = rawProductName.replace(/\b\d+(?:[\.,]\d+)?\s*(L|LITRE|LITRES)\b/i, '').replace(/\s+/g, ' ').trim();
          } else if (qtyUnitMatch) {
            quantity = parseInt(qtyUnitMatch[1]);
            unit = 'LABS';
            if (quantity > 0) {
              customUnitPrice = unitPrice / quantity;
            }
            rawProductName = rawProductName.replace(/\b\d+\s*(LB|LBS|LABS)\b/i, '').replace(/\s+/g, ' ').trim();
          }
        }

        if (rawProductName.length < 2) {
          continue;
        }

        let taxCode = match[3] || undefined;
        let taxRate = 0.0;
        if (taxCode && /HMRJ|HMRU|HRJ|HR|Y|H/i.test(taxCode)) {
          taxRate = 13.0;
        } else if (taxCode && /2|1/i.test(taxCode)) {
          taxRate = 5.0;
        } else if (/HMRJ|HMRU|HRJ|HR|\bms\b|\bHas\b/i.test(line) || /\b(H|Y)\b/i.test(line) || /(H|Y)\s*$/i.test(line)) {
          taxRate = 13.0;
        }

        let productName = rawProductName;
        const lowerRaw = rawProductName.toLowerCase();
        const mappedName = productMap.get(lowerRaw);
        if (mappedName) {
          productName = mappedName;
        }

        let categoryId = alimentation.id;
        const lowerProdName = productName.toLowerCase();
        const mappedCatId = productCategoryMap.get(lowerProdName);
        if (mappedCatId) {
          categoryId = mappedCatId;
        }

        items.push({
          productName,
          rawName: rawProductName,
          categoryId,
          quantity,
          unit,
          unitPrice: customUnitPrice,
          taxRate,
          discount: 0,
        });
      } else {
        if (isBarcode && parts.length >= 2) {
          let nameParts = parts.slice(1);
          if (nameParts.length > 1) {
            const lastPart = nameParts[nameParts.length - 1];
            if (lastPart.length <= 4 || /^[A-Z]+$/i.test(lastPart)) {
              nameParts = nameParts.slice(0, -1);
            }
          }
          let rawProductName = nameParts.join(' ').trim();
          
          rawProductName = rawProductName.replace(/^[\d\.\-\s]+/, '').trim();
          rawProductName = rawProductName.replace(/^(ve|ot|to|ao)\s+/i, '').trim();
          
          if (rawProductName.length >= 2 && !/total|subtotal|sous-total|tax|tps/i.test(rawProductName)) {
            const unitPrice = 0.0;
            
            rawProductName = rawProductName.replace(/\s+(À\s+)?(HMRJ|HMRU|MRJ|MR|HMR|HR|RJ|HRJ|Y|H|M|Ma[”"″]?)$/i, '').trim();
            rawProductName = rawProductName.replace(/\s+[^A-Za-z0-9]+$/, '').trim();
            
            let quantity = 1;
            let unit = 'UNIT';
            let customUnitPrice = unitPrice;
            
            const mlMatch = rawProductName.match(/\b(\d+)\s*(ML|HL)\b/i);
            const lMatch = rawProductName.match(/\b(\d+(?:[\.,]\d+)?)\s*(L|LITRE|LITRES)\b/i);
            const qtyUnitMatch = rawProductName.match(/\b(\d+)\s*(LB|LBS|LABS)\b/i);

            if (mlMatch) {
              const mlVal = parseInt(mlMatch[1]);
              quantity = mlVal / 1000;
              unit = 'LITRE';
              if (quantity > 0) {
                customUnitPrice = unitPrice / quantity;
              }
              rawProductName = rawProductName.replace(/\b\d+\s*(ML|HL)\b/i, '').replace(/\s+/g, ' ').trim();
            } else if (lMatch) {
              const lVal = parseFloat(lMatch[1].replace(',', '.'));
              quantity = lVal;
              unit = 'LITRE';
              if (quantity > 0) {
                customUnitPrice = unitPrice / quantity;
              }
              rawProductName = rawProductName.replace(/\b\d+(?:[\.,]\d+)?\s*(L|LITRE|LITRES)\b/i, '').replace(/\s+/g, ' ').trim();
            } else if (qtyUnitMatch) {
              quantity = parseInt(qtyUnitMatch[1]);
              unit = 'LABS';
              if (quantity > 0) {
                customUnitPrice = unitPrice / quantity;
              }
              rawProductName = rawProductName.replace(/\b\d+\s*(LB|LBS|LABS)\b/i, '').replace(/\s+/g, ' ').trim();
            }
            
            let productName = rawProductName;
            const lowerRaw = rawProductName.toLowerCase();
            const mappedName = productMap.get(lowerRaw);
            if (mappedName) {
              productName = mappedName;
            }

            if (customUnitPrice === 0) {
              const lastPurchase = await this.prisma.invoiceItem.findFirst({
                where: {
                  productName: {
                    contains: productName.trim(),
                    mode: 'insensitive',
                  },
                  invoice: userId ? { userId } : undefined,
                },
                orderBy: {
                  createdAt: 'desc',
                },
              });
              if (lastPurchase) {
                if (quantity > 0 && lastPurchase.quantity !== quantity) {
                  const packagePrice = lastPurchase.unitPrice * lastPurchase.quantity;
                  customUnitPrice = packagePrice / quantity;
                } else {
                  customUnitPrice = lastPurchase.unitPrice;
                }
              }
            }

            let taxRate = 0.0;
            if (/HMRJ|HMRU|HRJ|HR|\bms\b|\bHas\b/i.test(line) || /\b(H|Y)\b/i.test(line) || /(H|Y)\s*$/i.test(line)) {
              taxRate = 13.0;
            }
            
            let categoryId = alimentation.id;
            const lowerProdName = productName.toLowerCase();
            const mappedCatId = productCategoryMap.get(lowerProdName);
            if (mappedCatId) {
              categoryId = mappedCatId;
            }
            
            items.push({
              productName,
              rawName: rawProductName,
              categoryId,
              quantity,
              unit,
              unitPrice: customUnitPrice,
              taxRate,
              discount: 0,
            });
          }
        } else {
          // Look-back line tracking
          if (cleanLine.length < 50) {
            const startsWithItemNumber = /^\d{5,8}\b/.test(cleanLine);
            if (startsWithItemNumber) {
              pendingNamePrefix = (lastNonMatchLine ? lastNonMatchLine + ' ' : '') + cleanLine;
              lastNonMatchLine = '';
            } else {
              lastNonMatchLine = cleanLine;
            }
          }
        }
      }
    }

    // Get first 3 lines of receipt as raw store header for learning maps
    const rawStoreHeader = lines.slice(0, 3).join(' ').trim();
    let globalDiscounts = 0.0;
    const loyaltyMatch = text.match(/loyalt[y]?\s*(\d+(?:[\.,]\d{1,2})?)/i);
    if (loyaltyMatch) {
      globalDiscounts = parseFloat(loyaltyMatch[1].replace(',', '.'));
    }

    return {
      storeId,
      storeName: detectedStoreName,
      invoiceNumber: `OCR-${Math.floor(Math.random() * 90000 + 10000)}`,
      date: dateStr,
      paymentMode,
      items,
      comments: 'Importé automatiquement via OCR',
      rawStoreName: rawStoreHeader,
      globalDiscounts,
    };
  }

  async getUniqueProducts(userId: string) {
    const products = await this.prisma.product.findMany({
      where: { userId },
      select: {
        name: true,
        categoryId: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return products.map(p => ({
      productName: p.name,
      categoryId: p.categoryId,
    }));
  }

  async bulkDelete(ids: string[]) {
    return this.prisma.invoice.deleteMany({
      where: {
        id: { in: ids },
      },
    });
  }
}
