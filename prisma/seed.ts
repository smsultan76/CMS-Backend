import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  });

  // Create sample categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'technology' },
      update: {},
      create: {
        name: 'Technology',
        slug: 'technology',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'lifestyle' },
      update: {},
      create: {
        name: 'Lifestyle',
        slug: 'lifestyle',
      },
    }),
  ]);

  // Create sample post
  const samplePost = await prisma.post.upsert({
    where: { slug: 'welcome-to-our-cms' },
    update: {},
    create: {
      title: 'Welcome to Our CMS',
      slug: 'welcome-to-our-cms',
      content: 'This is a sample post content. Welcome to our new CMS built with NestJS and Prisma!',
      status: 'PUBLISHED',
      authorId: adminUser.id,
      categoryId: categories[0].id,
      publishedAt: new Date(),
    },
  });

  // Create sample page
  const samplePage = await prisma.page.upsert({
    where: { slug: 'about-us' },
    update: {},
    create: {
      title: 'About Us',
      slug: 'about-us',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'This is a sample about us page content.',
              },
            ],
          },
        ],
      },
      published: true,
    },
  });

  console.log('Seed data created:');
  console.log('- Admin user:', adminUser.email);
  console.log('- Categories:', categories.map(c => c.name));
  console.log('- Sample post:', samplePost.title);
  console.log('- Sample page:', samplePage.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });