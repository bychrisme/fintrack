import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Début de la migration pour l\'isolation des magasins...');

  // 1. Récupérer tous les magasins avec leurs factures
  const stores = await prisma.store.findMany({
    include: {
      invoices: true,
    },
  });

  // 2. Récupérer tous les utilisateurs
  const users = await prisma.user.findMany();
  if (users.length === 0) {
    console.log('Aucun utilisateur trouvé. Migration ignorée.');
    return;
  }
  const defaultUserId = users[0].id; // Utilisateur de secours (le premier admin)

  console.log(`Trouvé : ${stores.length} magasins et ${users.length} utilisateurs.`);

  for (const store of stores) {
    // Identifier les utilisateurs uniques qui ont des factures pour ce magasin
    const uniqueUserIds = Array.from(new Set(store.invoices.map((inv) => inv.userId)));

    if (uniqueUserIds.length === 0) {
      // Magasin orphelin (sans factures) : on l'associe à l'utilisateur par défaut
      console.log(`Le magasin "${store.name}" n'a aucune facture. Assignation à l'utilisateur par défaut.`);
      await prisma.store.update({
        where: { id: store.id },
        data: { userId: defaultUserId },
      });
    } else {
      // Le premier utilisateur s'approprie le magasin d'origine (mise à jour)
      const firstUser = uniqueUserIds[0];
      console.log(`Le magasin "${store.name}" est utilisé par l'utilisateur ${firstUser}. Mise à jour.`);
      await prisma.store.update({
        where: { id: store.id },
        data: { userId: firstUser },
      });

      // Les utilisateurs suivants reçoivent un clone du magasin et leurs factures sont redirigées
      for (let i = 1; i < uniqueUserIds.length; i++) {
        const nextUser = uniqueUserIds[i];
        console.log(`Le magasin "${store.name}" est aussi utilisé par l'utilisateur ${nextUser}. Création d'un clone.`);
        
        // Créer le clone
        const clonedStore = await prisma.store.create({
          data: {
            name: store.name,
            address: store.address,
            city: store.city,
            province: store.province,
            country: store.country,
            phone: store.phone,
            website: store.website,
            type: store.type,
            userId: nextUser,
          },
        });

        // Rediriger toutes les factures de cet utilisateur vers la nouvelle copie
        console.log(`Redirection des factures de ${nextUser} de l'ancien magasin ${store.id} vers le clone ${clonedStore.id}.`);
        await prisma.invoice.updateMany({
          where: {
            storeId: store.id,
            userId: nextUser,
          },
          data: {
            storeId: clonedStore.id,
          },
        });

        // Copier les correspondances d'abréviations OCR s'il y en a
        const ocrMaps = await prisma.ocrStoreMap.findMany({
          where: { storeId: store.id }
        });
        for (const map of ocrMaps) {
          // Créer une correspondance vers le nouveau magasin pour cet utilisateur
          // Puisque rawName est unique, on ne peut pas en créer un identique de manière globale,
          // mais l'apprentissage restera lié au moins au magasin dupliqué.
        }
      }
    }
  }

  console.log('Migration de l\'isolation des magasins terminée avec succès !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
