import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing database
  await prisma.budget.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.store.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@gesfin.com',
      name: 'Admin GESFIN',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  const dad = await prisma.user.create({
    data: {
      email: 'family_dad@gesfin.com',
      name: 'Jean Tremblay',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  const mom = await prisma.user.create({
    data: {
      email: 'family_mom@gesfin.com',
      name: 'Sophie Tremblay',
      password: passwordHash,
      role: 'FAMILY',
    },
  });

  console.log('Users created successfully.');

  // 3. Create Categories
  const categoriesData = [
    { name: 'Alimentation', color: 'hsl(142, 72%, 29%)', icon: 'Utensils' },
    { name: 'Produits ménagers', color: 'hsl(199, 89%, 48%)', icon: 'Sparkles' },
    { name: 'Santé', color: 'hsl(350, 89%, 60%)', icon: 'HeartPulse' },
    { name: 'Carburant', color: 'hsl(28, 80%, 52%)', icon: 'Fuel' },
    { name: 'Éducation', color: 'hsl(271, 70%, 60%)', icon: 'GraduationCap' },
    { name: 'Loisirs', color: 'hsl(322, 81%, 53%)', icon: 'Gamepad2' },
    { name: 'Vêtements', color: 'hsl(47, 95%, 43%)', icon: 'Shirt' },
    { name: 'Transport', color: 'hsl(200, 60%, 40%)', icon: 'Car' },
    { name: 'Animaux', color: 'hsl(15, 60%, 40%)', icon: 'Dog' },
    { name: 'Électronique', color: 'hsl(220, 70%, 50%)', icon: 'Laptop' },
    { name: 'Construction', color: 'hsl(35, 60%, 45%)', icon: 'Hammer' },
    { name: 'Autres', color: 'hsl(0, 0%, 50%)', icon: 'MoreHorizontal' },
  ];

  const categoriesMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categoriesMap[cat.name] = created.id;
  }

  // Create Subcategories
  const subCategoriesData = [
    { name: 'Laitiers', parentId: categoriesMap['Alimentation'], color: 'hsl(142, 72%, 40%)', icon: 'Egg' },
    { name: 'Céréales & Grains', parentId: categoriesMap['Alimentation'], color: 'hsl(142, 72%, 50%)', icon: 'Wheat' },
    { name: 'Fruits & Légumes', parentId: categoriesMap['Alimentation'], color: 'hsl(142, 72%, 60%)', icon: 'Apple' },
    { name: 'Pharmacie Médicaments', parentId: categoriesMap['Santé'], color: 'hsl(350, 89%, 70%)', icon: 'Pills' },
    { name: 'Outillage', parentId: categoriesMap['Construction'], color: 'hsl(35, 60%, 55%)', icon: 'Wrench' },
  ];

  for (const sub of subCategoriesData) {
    await prisma.category.create({ data: sub });
  }

  console.log('Categories and subcategories created.');

  // 4. Create Stores
  const baseStores = [
    { name: 'Walmart', city: 'Montréal', province: 'QC', country: 'Canada', address: '5400 Rue Jean-Talon O', phone: '514-737-1234', website: 'walmart.ca', type: 'SUPERMARKET' },
    { name: 'Costco', city: 'Brossard', province: 'QC', country: 'Canada', address: '9430 Boul de Rome', phone: '450-444-1234', website: 'costco.ca', type: 'SUPERMARKET' },
    { name: 'No Frills', city: 'Toronto', province: 'ON', country: 'Canada', address: '372 Pacific Ave', phone: '416-535-1234', website: 'nofrills.ca', type: 'SUPERMARKET' },
    { name: 'Pharmaprix', city: 'Montréal', province: 'QC', country: 'Canada', address: '5122 Côte-des-Neiges Rd', phone: '514-342-1234', website: 'shoppersdrugmart.ca', type: 'PHARMACY' },
    { name: 'Canadian Tire', city: 'Laval', province: 'QC', country: 'Canada', address: '1450 Boul Le Corbusier', phone: '450-681-1234', website: 'canadiantire.ca', type: 'HARDWARE' },
    { name: 'Shell', city: 'Montréal', province: 'QC', country: 'Canada', address: '4800 Boul Décarie', phone: '514-482-1234', website: 'shell.ca', type: 'GAS_STATION' },
  ];

  const storesMap: Record<string, string> = {};
  
  // Seed stores for admin
  // Seed stores for admin
  for (const store of baseStores) {
    await prisma.store.create({
      data: { ...store, userId: admin.id }
    });
  }

  // Seed stores for dad & mom (give both all stores to prevent any comparative gaps)
  const dadStoresMap: Record<string, string> = {};
  const momStoresMap: Record<string, string> = {};

  for (const store of baseStores) {
    const dadStore = await prisma.store.create({
      data: { ...store, userId: dad.id }
    });
    dadStoresMap[store.name] = dadStore.id;

    const momStore = await prisma.store.create({
      data: { ...store, userId: mom.id }
    });
    momStoresMap[store.name] = momStore.id;
  }

  console.log('Stores created.');

  // 5. Invoices & Invoice Items (Simulating historical purchases over 12 months)
  const months = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]; // 11 months ago to this month
  const currentDate = new Date();

  interface SeedProduct {
    name: string;
    category: string;
    basePrice: number;
    unit: string;
    brandOptions: string[];
    isTaxed: boolean;
  }

  const seedProducts: SeedProduct[] = [
    // Alimentation
    { name: 'Lait 2L', category: 'Alimentation', basePrice: 4.80, unit: 'LITRE', brandOptions: ['Québon', 'Beatrice', 'Lactantia'], isTaxed: false },
    { name: 'Riz 5kg', category: 'Alimentation', basePrice: 13.50, unit: 'KG', brandOptions: ['Uncle Ben\'s', 'Dano', 'Selection'], isTaxed: false },
    { name: 'Œufs 12', category: 'Alimentation', basePrice: 3.99, unit: 'UNIT', brandOptions: ['Gray Ridge', 'Selection', 'Burnbrae'], isTaxed: false },
    { name: 'Pain de Blé 675g', category: 'Alimentation', basePrice: 3.20, unit: 'UNIT', brandOptions: ['Dempster\'s', 'Wonder', 'Bon Matin'], isTaxed: false },
    { name: 'Beurre 454g', category: 'Alimentation', basePrice: 6.50, unit: 'UNIT', brandOptions: ['Lactantia', 'Gay Lea', 'Selection'], isTaxed: false },
    { name: 'Poitrines de Poulet 1kg', category: 'Alimentation', basePrice: 14.99, unit: 'KG', brandOptions: ['Maple Leaf', 'Exceldor'], isTaxed: false },
    { name: 'Pommes Gala 3lb', category: 'Alimentation', basePrice: 4.99, unit: 'UNIT', brandOptions: ['Del Monte', 'Selection'], isTaxed: false },
    { name: 'Bananes 1kg', category: 'Alimentation', basePrice: 1.69, unit: 'KG', brandOptions: ['Chiquita', 'Dole'], isTaxed: false },
    { name: 'Café en Grains 1kg', category: 'Alimentation', basePrice: 16.99, unit: 'PACK', brandOptions: ['Starbucks', 'Nabob', 'Van Houtte'], isTaxed: false },

    // Produits ménagers
    { name: 'Savon à vaisselle 800ml', category: 'Produits ménagers', basePrice: 3.49, unit: 'UNIT', brandOptions: ['Palmolive', 'Dawn'], isTaxed: true },
    { name: 'Détergent à lessive 4.43L', category: 'Produits ménagers', basePrice: 14.99, unit: 'UNIT', brandOptions: ['Tide', 'Sunlight', 'Gain'], isTaxed: true },
    { name: 'Papier hygiénique 30 rlx', category: 'Produits ménagers', basePrice: 17.99, unit: 'PACK', brandOptions: ['Royale', 'Cashmere', 'Charmin'], isTaxed: true },
    { name: 'Nettoyant tout usage 1L', category: 'Produits ménagers', basePrice: 4.29, unit: 'UNIT', brandOptions: ['Lysol', 'Mr. Clean', 'Hertel'], isTaxed: true },

    // Santé
    { name: 'Tylenol Extra-Fort', category: 'Santé', basePrice: 11.49, unit: 'BOX', brandOptions: ['Tylenol'], isTaxed: true },
    { name: 'Advil 100 Liqui-Gels', category: 'Santé', basePrice: 13.99, unit: 'BOX', brandOptions: ['Advil'], isTaxed: true },
    { name: 'Multivitamines Homme', category: 'Santé', basePrice: 16.50, unit: 'BOX', brandOptions: ['Centrum', 'Jamieson'], isTaxed: true },
    { name: 'Dentifrice Menthe 120ml', category: 'Santé', basePrice: 3.29, unit: 'UNIT', brandOptions: ['Colgate', 'Crest', 'Sensodyne'], isTaxed: true },

    // Carburant
    { name: 'Essence Ordinaire 1L', category: 'Carburant', basePrice: 1.55, unit: 'LITRE', brandOptions: ['Shell', 'Petro-Canada', 'Esso'], isTaxed: true },
    { name: 'Essence Super 1L', category: 'Carburant', basePrice: 1.79, unit: 'LITRE', brandOptions: ['Shell', 'Petro-Canada', 'Esso'], isTaxed: true },
    { name: 'Lave-glace -40C 4L', category: 'Carburant', basePrice: 4.99, unit: 'LITRE', brandOptions: ['Shell', 'Rain-X'], isTaxed: true },

    // Éducation
    { name: 'Cahier d\'exercices A4', category: 'Éducation', basePrice: 2.49, unit: 'UNIT', brandOptions: ['Hilroy'], isTaxed: true },
    { name: 'Sac à dos scolaire', category: 'Éducation', basePrice: 39.99, unit: 'UNIT', brandOptions: ['Jansport', 'High Sierra'], isTaxed: true },
    { name: 'Stylos à bille 10x', category: 'Éducation', basePrice: 2.49, unit: 'PACK', brandOptions: ['Bic', 'Paper Mate'], isTaxed: true },

    // Loisirs
    { name: 'Jeu de société Monopoly', category: 'Loisirs', basePrice: 29.99, unit: 'UNIT', brandOptions: ['Hasbro'], isTaxed: true },
    { name: 'Manette sans fil PS5', category: 'Loisirs', basePrice: 79.99, unit: 'UNIT', brandOptions: ['Sony'], isTaxed: true },
    { name: 'Livre Best-Seller', category: 'Loisirs', basePrice: 18.99, unit: 'UNIT', brandOptions: ['Québec Amérique', 'Pocket'], isTaxed: true },
    { name: 'Casque audio Bluetooth', category: 'Loisirs', basePrice: 79.99, unit: 'UNIT', brandOptions: ['Sony', 'JBL'], isTaxed: true },

    // Vêtements
    { name: 'T-Shirt Coton Noir', category: 'Vêtements', basePrice: 12.99, unit: 'UNIT', brandOptions: ['Hanes', 'Gildan'], isTaxed: true },
    { name: 'Paires de Chaussettes 6x', category: 'Vêtements', basePrice: 9.99, unit: 'PACK', brandOptions: ['Under Armour', 'Puma'], isTaxed: true },
    { name: 'Jeans Coupe Droite', category: 'Vêtements', basePrice: 59.99, unit: 'UNIT', brandOptions: ['Levi\'s', 'Wrangler'], isTaxed: true },
    { name: 'Sweat à capuche zippé', category: 'Vêtements', basePrice: 34.99, unit: 'UNIT', brandOptions: ['Adidas', 'Nike'], isTaxed: true },

    // Animaux
    { name: 'Nourriture Sèche Chien 15kg', category: 'Animaux', basePrice: 42.99, unit: 'PACK', brandOptions: ['Purina', 'Iams'], isTaxed: true },
    { name: 'Jouet à mâcher pour chien', category: 'Animaux', basePrice: 9.99, unit: 'UNIT', brandOptions: ['Kong'], isTaxed: true },
    { name: 'Litière agglomérante 10kg', category: 'Animaux', basePrice: 14.99, unit: 'PACK', brandOptions: ['Purina', 'Cats Pride'], isTaxed: true },

    // Électronique
    { name: 'Câble de recharge USB-C 2m', category: 'Électronique', basePrice: 14.99, unit: 'UNIT', brandOptions: ['Anker', 'Belkin'], isTaxed: true },
    { name: 'Carte mémoire MicroSD 128Go', category: 'Électronique', basePrice: 24.99, unit: 'UNIT', brandOptions: ['SanDisk', 'Samsung'], isTaxed: true },
    { name: 'Ampoule intelligente LED', category: 'Électronique', basePrice: 24.99, unit: 'UNIT', brandOptions: ['Philips Hue', 'Noma'], isTaxed: true },

    // Construction
    { name: 'Jeu de Tournevis', category: 'Construction', basePrice: 34.99, unit: 'PACK', brandOptions: ['Mastercraft', 'Stanley'], isTaxed: true },
    { name: 'Filtre de Fournaise', category: 'Construction', basePrice: 16.99, unit: 'UNIT', brandOptions: ['Garrison', '3M Filtrete'], isTaxed: true },
    { name: 'Ruban à mesurer 8m', category: 'Construction', basePrice: 12.99, unit: 'UNIT', brandOptions: ['Stanley', 'Dewalt'], isTaxed: true },
    { name: 'Marteau de menuisier', category: 'Construction', basePrice: 15.99, unit: 'UNIT', brandOptions: ['Stanley', 'Dewalt'], isTaxed: true },
  ];

  // Helper to generate a batch of invoices for a specific user
  const generateUserInvoices = async (userId: string, storesMap: Record<string, string>, invoiceVolume: number) => {
    let invoiceCounter = 1;

    for (const m of months) {
      // Determine number of invoices for this month
      const count = invoiceVolume === 1 ? 2 : Math.floor(Math.random() * 5) + 12; // ~12 to 16 invoices per month for dad, 2 for mom

      for (let i = 0; i < count; i++) {
        // Select random store
        const storeNames = Object.keys(storesMap);
        const storeName = storeNames[Math.floor(Math.random() * storeNames.length)];
        const storeId = storesMap[storeName];

        // Select realistic day distributed over the month
        const day = Math.min(28, i * 2 + Math.floor(Math.random() * 2) + 1);
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - m, day);

        // Payment mode distribution
        const paymentModes = ['DEBIT_CARD', 'CREDIT_CARD', 'CASH'];
        const paymentMode = paymentModes[Math.floor(Math.random() * paymentModes.length)];

        // Filter products compatible with store to make it realistic
        let filteredProducts = seedProducts;
        if (storeName === 'Shell') {
          filteredProducts = seedProducts.filter(p => p.category === 'Carburant' || p.category === 'Alimentation');
        } else if (storeName === 'Canadian Tire') {
          filteredProducts = seedProducts.filter(p => p.category === 'Construction' || p.category === 'Loisirs' || p.category === 'Électronique');
        } else if (storeName === 'Pharmaprix') {
          filteredProducts = seedProducts.filter(p => p.category === 'Santé' || p.category === 'Produits ménagers' || p.category === 'Alimentation');
        }

        // Pick between 2 and 5 items
        const numItems = Math.floor(Math.random() * 4) + 2;
        const shuffled = [...filteredProducts].sort(() => 0.5 - Math.random());
        const selectedProducts = shuffled.slice(0, Math.min(numItems, shuffled.length));

        // Invoice totals
        let totalSubtotal = 0;
        let totalTaxes = 0;

        const itemsToCreate: any[] = [];

        for (const prod of selectedProducts) {
          // Adjust base price based on store profile
          let storeMultiplier = 1.0;
          if (storeName === 'Costco') storeMultiplier = 0.88;
          else if (storeName === 'No Frills') storeMultiplier = 0.93;
          else if (storeName === 'Walmart') storeMultiplier = 0.95;
          else if (storeName === 'Pharmaprix') storeMultiplier = 1.07;
          else if (storeName === 'Shell') storeMultiplier = 1.03;

          // Inflation multiplier: price gets cheaper as we go backward in time
          const inflationRate = 0.005; // 0.5% per month
          const timeMultiplier = 1 - (m * inflationRate);

          // Calculate unit price with multiplier & minor jitter
          const rawPrice = prod.basePrice * storeMultiplier * timeMultiplier + (Math.random() * 0.04 - 0.02);
          const unitPrice = parseFloat(Math.max(0.5, rawPrice).toFixed(2));

          // Quantity settings
          let quantity = 1;
          if (prod.category === 'Carburant' && prod.name.includes('Essence')) {
            quantity = Math.floor(Math.random() * 21) + 35; // 35 to 55 liters
          } else if (storeName === 'Costco') {
            quantity = Math.floor(Math.random() * 3) + 2; // bulk quantity (2 to 4)
          } else {
            // 30% chance of multiple items
            quantity = Math.random() < 0.3 ? Math.floor(Math.random() * 2) + 2 : 1;
          }

          // Calculate discounts
          let discount = 0;
          if (Math.random() < 0.15 && prod.category !== 'Carburant') {
            discount = parseFloat((Math.min(quantity * unitPrice * 0.2, Math.floor(Math.random() * 3) + 0.5)).toFixed(2));
          }

          const totalPrice = parseFloat((quantity * unitPrice).toFixed(2));
          const itemSubtotal = parseFloat((totalPrice - discount).toFixed(2));
          const taxRate = prod.isTaxed ? 14.975 : 0; // Combined QC tax rate or similar
          const itemTax = parseFloat((itemSubtotal * (taxRate / 100)).toFixed(2));

          totalSubtotal += itemSubtotal;
          totalTaxes += itemTax;

          const brand = prod.brandOptions[Math.floor(Math.random() * prod.brandOptions.length)] || '';

          itemsToCreate.push({
            productName: prod.name,
            categoryId: categoriesMap[prod.category] || categoriesMap['Autres'],
            quantity,
            unit: prod.unit,
            unitPrice,
            totalPrice,
            taxRate,
            discount,
            netPrice: itemSubtotal,
            brand,
          });
        }

        // Global discount / loyalty
        let globalDiscounts = 0;
        if (Math.random() < 0.08) {
          globalDiscounts = parseFloat((Math.min(totalSubtotal * 0.1, Math.floor(Math.random() * 5) + 1)).toFixed(2));
        }

        const totalAmount = parseFloat((totalSubtotal + totalTaxes - globalDiscounts).toFixed(2));
        const storeCode = storeName.toUpperCase().slice(0, 3);
        const invoiceNumber = `${storeCode}-${currentDate.getFullYear()}${(currentDate.getMonth() - m + 1).toString().padStart(2, '0')}-${invoiceCounter.toString().padStart(4, '0')}`;
        invoiceCounter++;

        const inv = await prisma.invoice.create({
          data: {
            invoiceNumber,
            date,
            paymentMode,
            totalAmount,
            totalTaxes: parseFloat(totalTaxes.toFixed(2)),
            globalDiscounts,
            comments: `Achat régulier chez ${storeName}`,
            storeId,
            userId,
          }
        });

        for (const item of itemsToCreate) {
          await prisma.invoiceItem.create({
            data: {
              ...item,
              invoiceId: inv.id,
            }
          });
        }
      }
    }
  };

  // Generate Invoices for dad (high volume - approx 170-180 invoices total)
  console.log('Generating dad invoices...');
  await generateUserInvoices(dad.id, dadStoresMap, 15);

  // Generate Invoices for mom (low volume - approx 24 invoices total)
  console.log('Generating mom invoices...');
  await generateUserInvoices(mom.id, momStoresMap, 1);

  console.log('Invoices and items created.');

  // 6. Set Budgets for dad and mom
  // Budgets for dad over the last 12 months
  const thisYear = currentDate.getFullYear();
  const thisMonth = currentDate.getMonth() + 1; // 1-12

  // Create budgets for dad for the current month and the past 2 months
  const budgetMonths = [thisMonth, thisMonth - 1 <= 0 ? 12 : thisMonth - 1, thisMonth - 2 <= 0 ? 11 : thisMonth - 2];
  
  for (const bm of budgetMonths) {
    const by = bm > thisMonth ? thisYear - 1 : thisYear;

    await prisma.budget.create({
      data: {
        amount: 500.0,
        month: bm,
        year: by,
        categoryId: categoriesMap['Alimentation'],
        userId: dad.id,
      }
    });

    await prisma.budget.create({
      data: {
        amount: 200.0,
        month: bm,
        year: by,
        categoryId: categoriesMap['Carburant'],
        userId: dad.id,
      }
    });

    await prisma.budget.create({
      data: {
        amount: 100.0,
        month: bm,
        year: by,
        categoryId: categoriesMap['Loisirs'],
        userId: dad.id,
      }
    });

    await prisma.budget.create({
      data: {
        amount: 80.0,
        month: bm,
        year: by,
        categoryId: categoriesMap['Produits ménagers'],
        userId: dad.id,
      }
    });
  }

  console.log('Budgets created.');

  // 7. Seed unique products from invoice items
  const items = await prisma.invoiceItem.findMany({
    select: {
      productName: true,
      categoryId: true,
      invoice: {
        select: {
          userId: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const added = new Set<string>();
  for (const item of items) {
    const name = item.productName.trim();
    const userId = item.invoice.userId;
    const key = `${userId}:${name.toLowerCase()}`;
    if (!added.has(key)) {
      added.add(key);
      await prisma.product.upsert({
        where: {
          userId_name: {
            userId,
            name,
          },
        },
        update: { categoryId: item.categoryId },
        create: {
          userId,
          name,
          categoryId: item.categoryId,
        },
      });
    }
  }
  console.log('Products table populated.');

  // 8. Seed OCR Mappings from exported JSON file if it exists
  const fs = require('fs');
  const path = require('path');
  const ocrJsonPath = path.join(__dirname, 'ocr_learning.json');
  if (fs.existsSync(ocrJsonPath)) {
    console.log('Found exported OCR learning data. Seeding mappings...');
    const ocrData = JSON.parse(fs.readFileSync(ocrJsonPath, 'utf-8'));
    
    for (const storeMap of ocrData.stores || []) {
      const storeExists = await prisma.store.findUnique({ where: { id: storeMap.storeId } });
      if (storeExists) {
        await prisma.ocrStoreMap.upsert({
          where: { rawName: storeMap.rawName },
          update: { storeId: storeMap.storeId },
          create: { rawName: storeMap.rawName, storeId: storeMap.storeId },
        });
      }
    }
    
    for (const prodMap of ocrData.products || []) {
      await prisma.ocrProductMap.upsert({
        where: { rawName: prodMap.rawName },
        update: { mappedName: prodMap.mappedName },
        create: { rawName: prodMap.rawName, mappedName: prodMap.mappedName },
      });
    }
    console.log('OCR mappings seeded successfully.');
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
