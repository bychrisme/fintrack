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
  for (const store of baseStores) {
    await prisma.store.create({
      data: { ...store, userId: admin.id }
    });
  }

  // Seed stores for dad & mom as needed for invoices
  const dadStores = ['Walmart', 'Costco', 'Canadian Tire', 'Shell'];
  const momStores = ['No Frills', 'Pharmaprix'];

  for (const store of baseStores) {
    if (dadStores.includes(store.name)) {
      const created = await prisma.store.create({
        data: { ...store, userId: dad.id }
      });
      storesMap[store.name] = created.id;
    } else if (momStores.includes(store.name)) {
      const created = await prisma.store.create({
        data: { ...store, userId: mom.id }
      });
      storesMap[store.name] = created.id;
    }
  }

  console.log('Stores created.');

  // 5. Invoices & Invoice Items (Simulating historical purchases over 12 months)
  // Let's create transactions for the past 6 months to demonstrate inflation, price variation, and user consumption.
  const months = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]; // 11 months ago to this month
  const currentDate = new Date();

  // We will populate data specifically for "Lait 2L" (Milk) and "Riz 5kg" (Rice) to show price comparison.
  // Milk prices: No Frills ($5.10) > Walmart ($4.99) > Costco ($4.69)
  // Milk inflation: Rose from $4.10 (Costco) to $4.69 in 12 months
  // Rice prices: No Frills ($14.25) > Walmart ($13.50) > Costco ($11.99)
  
  for (const m of months) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - m, 15);
    
    // Monthly Milk purchases
    // Costco purchase (Usually cheaper)
    if (m % 2 === 0) {
      const milkCostcoPrice = parseFloat((4.10 + (m * -0.05)).toFixed(2)); // price rose over time
      const riceCostcoPrice = parseFloat((10.99 + (m * -0.10)).toFixed(2));
      
      const invTotal = parseFloat((milkCostcoPrice * 4 + riceCostcoPrice + 1.20).toFixed(2));
      const inv = await prisma.invoice.create({
        data: {
          invoiceNumber: `CST-2026-${12 - m}`,
          date,
          paymentMode: 'CREDIT_CARD',
          totalAmount: invTotal,
          totalTaxes: parseFloat((invTotal * 0.05).toFixed(2)),
          globalDiscounts: 0,
          comments: 'Monthly Costco haul',
          storeId: storesMap['Costco'],
          userId: dad.id,
        }
      });
      
      await prisma.invoiceItem.create({
        data: {
          productName: 'Lait 2L',
          categoryId: categoriesMap['Alimentation'],
          quantity: 4,
          unit: 'LITRE',
          unitPrice: milkCostcoPrice,
          totalPrice: milkCostcoPrice * 4,
          taxRate: 0,
          discount: 0,
          netPrice: milkCostcoPrice * 4,
          brand: 'Québon',
          invoiceId: inv.id
        }
      });

      await prisma.invoiceItem.create({
        data: {
          productName: 'Riz 5kg',
          categoryId: categoriesMap['Alimentation'],
          quantity: 1,
          unit: 'KG',
          unitPrice: riceCostcoPrice,
          totalPrice: riceCostcoPrice,
          taxRate: 0,
          discount: 0,
          netPrice: riceCostcoPrice,
          brand: 'Uncle Ben\'s',
          invoiceId: inv.id
        }
      });
    }

    // Walmart purchase
    if (m % 3 === 0) {
      const milkWalmartPrice = parseFloat((4.40 + (m * -0.05)).toFixed(2));
      const eggWalmartPrice = parseFloat((3.80 + (m * -0.04)).toFixed(2));
      
      const invTotal = parseFloat((milkWalmartPrice * 2 + eggWalmartPrice * 2).toFixed(2));
      
      const inv = await prisma.invoice.create({
        data: {
          invoiceNumber: `WMT-2026-${12 - m}`,
          date,
          paymentMode: 'DEBIT_CARD',
          totalAmount: invTotal,
          totalTaxes: 0,
          storeId: storesMap['Walmart'],
          userId: dad.id,
        }
      });

      await prisma.invoiceItem.create({
        data: {
          productName: 'Lait 2L',
          categoryId: categoriesMap['Alimentation'],
          quantity: 2,
          unit: 'LITRE',
          unitPrice: milkWalmartPrice,
          totalPrice: milkWalmartPrice * 2,
          taxRate: 0,
          netPrice: milkWalmartPrice * 2,
          brand: 'Beatrice',
          invoiceId: inv.id
        }
      });

      await prisma.invoiceItem.create({
        data: {
          productName: 'Œufs 12',
          categoryId: categoriesMap['Alimentation'],
          quantity: 2,
          unit: 'UNIT',
          unitPrice: eggWalmartPrice,
          totalPrice: eggWalmartPrice * 2,
          taxRate: 0,
          netPrice: eggWalmartPrice * 2,
          brand: 'Selection',
          invoiceId: inv.id
        }
      });
    }

    // No Frills purchase (Simulating where they might pay more)
    if (m % 4 === 0) {
      const milkNoFrillsPrice = parseFloat((4.50 + (m * -0.05)).toFixed(2));
      const riceNoFrillsPrice = parseFloat((12.90 + (m * -0.11)).toFixed(2));
      const invTotal = parseFloat((milkNoFrillsPrice * 2 + riceNoFrillsPrice).toFixed(2));
      
      const inv = await prisma.invoice.create({
        data: {
          invoiceNumber: `NF-2026-${12 - m}`,
          date,
          paymentMode: 'CASH',
          totalAmount: invTotal,
          totalTaxes: 0,
          storeId: storesMap['No Frills'],
          userId: mom.id,
        }
      });

      await prisma.invoiceItem.create({
        data: {
          productName: 'Lait 2L',
          categoryId: categoriesMap['Alimentation'],
          quantity: 2,
          unit: 'LITRE',
          unitPrice: milkNoFrillsPrice,
          totalPrice: milkNoFrillsPrice * 2,
          taxRate: 0,
          netPrice: milkNoFrillsPrice * 2,
          brand: 'Lactantia',
          invoiceId: inv.id
        }
      });

      await prisma.invoiceItem.create({
        data: {
          productName: 'Riz 5kg',
          categoryId: categoriesMap['Alimentation'],
          quantity: 1,
          unit: 'KG',
          unitPrice: riceNoFrillsPrice,
          totalPrice: riceNoFrillsPrice,
          taxRate: 0,
          netPrice: riceNoFrillsPrice,
          brand: 'Dano',
          invoiceId: inv.id
        }
      });
    }

    // Gas station purchase (Shell)
    const fuelPrice = parseFloat((1.45 + (m * 0.02) + (Math.sin(m) * 0.05)).toFixed(2)); // fluctuating
    const fuelTotal = parseFloat((fuelPrice * 45).toFixed(2));
    const gasInv = await prisma.invoice.create({
      data: {
        invoiceNumber: `SHL-2026-${12 - m}`,
        date,
        paymentMode: 'CREDIT_CARD',
        totalAmount: fuelTotal,
        totalTaxes: parseFloat((fuelTotal * 0.15).toFixed(2)),
        storeId: storesMap['Shell'],
        userId: dad.id,
      }
    });

    await prisma.invoiceItem.create({
      data: {
        productName: 'Essence Ordinaire 1L',
        categoryId: categoriesMap['Carburant'],
        quantity: 45,
        unit: 'LITRE',
        unitPrice: fuelPrice,
        totalPrice: fuelTotal,
        taxRate: 15.0,
        netPrice: fuelTotal,
        invoiceId: gasInv.id
      }
    });

    // Pharmacy purchase (Pharmaprix)
    if (m % 3 === 1) {
      const phTotal = 32.50;
      const phInv = await prisma.invoice.create({
        data: {
          invoiceNumber: `PHM-2026-${12 - m}`,
          date,
          paymentMode: 'DEBIT_CARD',
          totalAmount: phTotal,
          totalTaxes: 4.88,
          storeId: storesMap['Pharmaprix'],
          userId: mom.id,
        }
      });

      await prisma.invoiceItem.create({
        data: {
          productName: 'Tylenol Extra-Fort',
          categoryId: categoriesMap['Santé'],
          quantity: 1,
          unit: 'BOX',
          unitPrice: 12.99,
          totalPrice: 12.99,
          taxRate: 15.0,
          netPrice: 14.94,
          brand: 'Tylenol',
          invoiceId: phInv.id
        }
      });

      await prisma.invoiceItem.create({
        data: {
          productName: 'Savon liquide mains',
          categoryId: categoriesMap['Produits ménagers'],
          quantity: 3,
          unit: 'UNIT',
          unitPrice: 4.50,
          totalPrice: 13.50,
          taxRate: 15.0,
          netPrice: 15.53,
          brand: 'Softsoap',
          invoiceId: phInv.id
        }
      });
    }

    // Hardware purchase (Canadian Tire)
    if (m === 2 || m === 6) {
      const ctTotal = 85.00;
      const ctInv = await prisma.invoice.create({
        data: {
          invoiceNumber: `CT-2026-${12 - m}`,
          date,
          paymentMode: 'CREDIT_CARD',
          totalAmount: ctTotal,
          totalTaxes: 12.75,
          storeId: storesMap['Canadian Tire'],
          userId: dad.id,
        }
      });

      await prisma.invoiceItem.create({
        data: {
          productName: 'Jeu de Tournevis',
          categoryId: categoriesMap['Construction'],
          quantity: 1,
          unit: 'UNIT',
          unitPrice: 39.99,
          totalPrice: 39.99,
          taxRate: 15.0,
          netPrice: 45.99,
          brand: 'Mastercraft',
          invoiceId: ctInv.id
        }
      });

      await prisma.invoiceItem.create({
        data: {
          productName: 'Filtre de Fournaise',
          categoryId: categoriesMap['Construction'],
          quantity: 2,
          unit: 'UNIT',
          unitPrice: 17.50,
          totalPrice: 35.00,
          taxRate: 15.0,
          netPrice: 40.25,
          brand: 'Garrison',
          invoiceId: ctInv.id
        }
      });
    }
  }

  console.log('Invoices and items created.');

  // 6. Set Budgets for dad
  // Budget for Alimentation: $400 / month
  // Budget for Carburant: $150 / month
  // Let's create budgets for the current year, and a specific budget for the current month.
  const thisYear = currentDate.getFullYear();
  const thisMonth = currentDate.getMonth() + 1; // 1-12
  
  await prisma.budget.create({
    data: {
      amount: 400.0,
      month: thisMonth,
      year: thisYear,
      categoryId: categoriesMap['Alimentation'],
      userId: dad.id,
    }
  });

  await prisma.budget.create({
    data: {
      amount: 150.0,
      month: thisMonth,
      year: thisYear,
      categoryId: categoriesMap['Carburant'],
      userId: dad.id,
    }
  });

  await prisma.budget.create({
    data: {
      amount: 50.0,
      month: thisMonth,
      year: thisYear,
      categoryId: categoriesMap['Loisirs'],
      userId: dad.id,
    }
  });

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
