import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@moov.africa' },
    update: {},
    create: {
      nom: 'Administrateur',
      email: 'admin@moov.africa',
      mot_de_passe_hash: hash,
      role: 'ADMIN',
    },
  });

  const categories = ['Réseau', 'Facturation', 'Service Client', 'Commercial', 'Autre'];
  for (const cat of categories) {
    const exists = await prisma.category.findFirst({ where: { libelle: cat } });
    if (!exists) {
      await prisma.category.create({
        data: {
          libelle: cat,
          sla_delai_heures: 48,
        }
      });
    }
  }

  console.log('Seed completed!', { admin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
