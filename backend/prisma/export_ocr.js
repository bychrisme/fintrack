const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function run() {
  console.log('Exportation de l\'apprentissage OCR...');
  const stores = await prisma.ocrStoreMap.findMany();
  const products = await prisma.ocrProductMap.findMany();

  const data = { stores, products };
  const filePath = path.join(__dirname, 'ocr_learning.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Données d'apprentissage OCR exportées avec succès dans : ${filePath}`);
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
