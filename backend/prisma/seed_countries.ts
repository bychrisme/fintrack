import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const locationData = [
  {
    country: 'Canada',
    regions: [
      {
        name: 'Québec',
        cities: ['Montréal', 'Québec', 'Laval', 'Sherbrooke', 'Gatineau', 'Longueuil', 'Trois-Rivières', 'Chicoutimi', 'Terrebonne']
      },
      {
        name: 'Ontario',
        cities: ['Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton', 'London', 'Markham', 'Vaughan', 'Windsor']
      },
      {
        name: 'Alberta',
        cities: ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge', 'Fort McMurray']
      },
      {
        name: 'Colombie-Britannique',
        cities: ['Vancouver', 'Victoria', 'Surrey', 'Burnaby', 'Richmond', 'Kelowna']
      },
      {
        name: 'Nouvelle-Écosse',
        cities: ['Halifax', 'Sydney', 'Dartmouth']
      }
    ]
  },
  {
    country: 'France',
    regions: [
      {
        name: 'Île-de-France',
        cities: ['Paris', 'Boulogne-Billancourt', 'Saint-Denis', 'Versailles', 'Nanterre', 'Créteil']
      },
      {
        name: 'Provence-Alpes-Côte d\'Azur',
        cities: ['Marseille', 'Nice', 'Toulon', 'Aix-en-Provence', 'Avignon', 'Cannes']
      },
      {
        name: 'Auvergne-Rhône-Alpes',
        cities: ['Lyon', 'Grenoble', 'Saint-Étienne', 'Villeurbanne', 'Annecy', 'Clermont-Ferrand']
      },
      {
        name: 'Nouvelle-Aquitaine',
        cities: ['Bordeaux', 'Limoges', 'Poitiers', 'La Rochelle', 'Pau']
      },
      {
        name: 'Occitanie',
        cities: ['Toulouse', 'Montpellier', 'Nîmes', 'Perpignan', 'Béziers']
      }
    ]
  },
  {
    country: 'Sénégal',
    regions: [
      {
        name: 'Dakar',
        cities: ['Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Diamniadio']
      },
      {
        name: 'Thiès',
        cities: ['Thiès', 'Mbour', 'Tivaouane', 'Kayar']
      },
      {
        name: 'Saint-Louis',
        cities: ['Saint-Louis', 'Richard-Toll', 'Dagana']
      },
      {
        name: 'Ziguinchor',
        cities: ['Ziguinchor', 'Bignona', 'Oussouye']
      }
    ]
  },
  {
    country: 'Côte d\'Ivoire',
    regions: [
      {
        name: 'Lagunes',
        cities: ['Abidjan', 'Grand-Bassam', 'Dabou', 'Bingerville']
      },
      {
        name: 'Yamoussoukro',
        cities: ['Yamoussoukro', 'Toumodi']
      },
      {
        name: 'Vallée du Bandama',
        cities: ['Bouaké', 'Katiola']
      },
      {
        name: 'Bas-Sassandra',
        cities: ['San-Pédro', 'Sassandra']
      }
    ]
  }
];

async function main() {
  console.log('Début du peuplement des tables de localisation...');

  // Optional: clear existing data to make the seed idempotent
  await prisma.city.deleteMany({});
  await prisma.region.deleteMany({});
  await prisma.country.deleteMany({});

  for (const cData of locationData) {
    console.log(`Création du pays : ${cData.country}`);
    const country = await prisma.country.create({
      data: {
        name: cData.country
      }
    });

    for (const rData of cData.regions) {
      console.log(`  Création de la région : ${rData.name} (${cData.country})`);
      const region = await prisma.region.create({
        data: {
          name: rData.name,
          countryId: country.id
        }
      });

      for (const cityName of rData.cities) {
        await prisma.city.create({
          data: {
            name: cityName,
            regionId: region.id
          }
        });
      }
    }
  }

  console.log('Peuplement des localisations terminé avec succès !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
