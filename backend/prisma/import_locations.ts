import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const prisma = new PrismaClient();

// Helper to parse CSV line keeping quoted fields intact
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const specialRegions: Record<string, string[]> = {
  // Canada
  'a244ed04-1a12-4f37-8b99-bfa63e694f27': [
    'Alberta', 'Colombie-Britannique', 'Île-du-Prince-Édouard', 'Manitoba',
    'Nouveau-Brunswick', 'Nouvelle-Écosse', 'Ontario', 'Québec',
    'Saskatchewan', 'Terre-Neuve-et-Labrador', 'Territoires du Nord-Ouest',
    'Nunavut', 'Yukon'
  ],
  // USA
  '57e25dcd-9b90-4efe-8e3d-50ce994a33a5': [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'Californie', 'Caroline du Nord',
    'Caroline du Sud', 'Colorado', 'Connecticut', 'Dakota du Nord', 'Dakota du Sud',
    'Delaware', 'Floride', 'Géorgie', 'Hawaï', 'Idaho', 'Illinois', 'Indiana',
    'Iowa', 'Kansas', 'Kentucky', 'Louisiane', 'Maine', 'Maryland', 'Massachusetts',
    'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska',
    'Nevada', 'New Hampshire', 'New Jersey', 'New York', 'Nouveau-Mexique', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvanie', 'Rhode Island', 'Tennessee', 'Texas',
    'Utah', 'Vermont', 'Virginie', 'Virginie-Occidentale', 'Washington', 'Wisconsin', 'Wyoming'
  ],
  // France
  'd9b715c0-b8b8-457b-a730-94b8cfa29841': [
    'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Bretagne', 'Centre-Val de Loire',
    'Corse', 'Grand Est', 'Hauts-de-France', 'Île-de-France', 'Normandie',
    'Nouvelle-Aquitaine', 'Occitanie', 'Pays de la Loire', 'Provence-Alpes-Côte d\'Azur',
    'Guadeloupe', 'Guyane', 'Martinique', 'Mayotte', 'La Réunion'
  ],
  // Belgique
  'eb3ffa66-b3d2-42c6-b9d8-b42776811b89': [
    'Région Flamande', 'Région Wallonne', 'Région de Bruxelles-Capitale'
  ],
  // Cameroun
  'aa90728d-c1bf-43f7-aef2-311b7312fae3': [
    'Adamaoua', 'Centre', 'Est', 'Extrême-Nord', 'Littoral',
    'Nord', 'Nord-Ouest', 'Ouest', 'Sud', 'Sud-Ouest'
  ],
  // Côte D'Ivoire
  '9348e3fd-5558-4f4d-8a3c-1151a302eb90': [
    'Abidjan', 'Yamoussoukro', 'Agnéby-Tiassa', 'Bafing', 'Bagoué', 'Bélier',
    'Bounkani', 'Cavally', 'Folon', 'Gbêkê', 'Gboklè', 'Gôh', 'Gontougo',
    'Grands-Ponts', 'Guémon', 'Hambol', 'Haut-Sassandra', 'Iffou',
    'Indénié-Djuablin', 'Kabadougou', 'Lôh-Djiboua', 'Marahoué', 'Mé',
    'Moronou', 'N\'Zi', 'Nawa', 'Poro', 'San-Pedro', 'Sud-Comoé', 'Tchologo',
    'Tonkpi', 'Worodougou'
  ]
};

async function main() {
  console.log('Starting locations import...');

  const countriesCsvPath = path.join(__dirname, '../../courntries.csv');
  const citiesCsvPath = path.join(__dirname, '../../cities.csv');

  if (!fs.existsSync(countriesCsvPath) || !fs.existsSync(citiesCsvPath)) {
    console.error('Error: cities.csv or courntries.csv missing from project root.');
    process.exit(1);
  }

  // 1. Clean existing locations
  console.log('Cleaning old location data...');
  await prisma.city.deleteMany({});
  await prisma.region.deleteMany({});
  await prisma.country.deleteMany({});

  // 2. Import Countries
  console.log('Importing countries...');
  const countriesContent = fs.readFileSync(countriesCsvPath, 'utf-8');
  const countryLines = countriesContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const countryDefaultRegionMap: Record<string, string> = {}; // Maps country ID to default Region ID

  for (const line of countryLines) {
    const parts = parseCsvLine(line);
    if (parts.length < 5) continue;

    const englishName = parts[0];
    const frenchName = parts[1] || englishName;
    const phoneCode = parts[2];
    const isoCode = parts[3];
    const countryId = parts[4]; // UUID

    // Upsert Country
    await prisma.country.upsert({
      where: { id: countryId },
      update: { name: frenchName },
      create: {
        id: countryId,
        name: frenchName,
      }
    });

    // Create default region for this country to link cities to
    const defaultRegion = await prisma.region.create({
      data: {
        name: `${frenchName} (Général)`,
        countryId: countryId
      }
    });
    countryDefaultRegionMap[countryId] = defaultRegion.id;

    // If it's a special country, also seed its real regions/provinces
    if (specialRegions[countryId]) {
      const regionsList = specialRegions[countryId];
      for (const regName of regionsList) {
        await prisma.region.upsert({
          where: {
            countryId_name: {
              countryId: countryId,
              name: regName
            }
          },
          update: {},
          create: {
            name: regName,
            countryId: countryId
          }
        });
      }
    }
  }
  console.log('Countries and regions populated.');

  // 3. Import Cities
  console.log('Importing cities (batch mode)...');
  const fileStream = fs.createReadStream(citiesCsvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let citiesBuffer: any[] = [];
  const BATCH_SIZE = 5000;
  let totalImported = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    const parts = parseCsvLine(line);
    if (parts.length < 5) continue;

    const cityName = parts[0];
    const cityId = parts[3];
    const countryId = parts[4];

    const defaultRegionId = countryDefaultRegionMap[countryId];
    if (!defaultRegionId) {
      // Country not registered, skip
      continue;
    }

    citiesBuffer.push({
      id: cityId,
      name: cityName,
      regionId: defaultRegionId
    });

    if (citiesBuffer.length >= BATCH_SIZE) {
      await prisma.city.createMany({
        data: citiesBuffer,
        skipDuplicates: true
      });
      totalImported += citiesBuffer.length;
      console.log(`Imported ${totalImported} cities...`);
      citiesBuffer = [];
    }
  }

  // Insert remaining buffer
  if (citiesBuffer.length > 0) {
    await prisma.city.createMany({
      data: citiesBuffer,
      skipDuplicates: true
    });
    totalImported += citiesBuffer.length;
  }

  console.log(`Import completed! Total countries: ${countryLines.length}, Total cities: ${totalImported}`);
}

main()
  .catch((e) => {
    console.error('Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
