import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Demo-admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@edtech.local' },
    update: {},
    create: {
      email: 'admin@edtech.local',
      name: 'Admin User',
      role: UserRole.ADMIN,
      password: {
        create: {
          passwordHash: await bcrypt.hash('admin123', 10),
        },
      },
    },
  });

  // Demo-instructor
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@edtech.local' },
    update: {},
    create: {
      email: 'instructor@edtech.local',
      name: 'Demo Instructor',
      role: UserRole.INSTRUCTOR,
      password: {
        create: {
          passwordHash: await bcrypt.hash('instructor123', 10),
        },
      },
    },
  });

  // Demo-student
  await prisma.user.upsert({
    where: { email: 'student@edtech.local' },
    update: {},
    create: {
      email: 'student@edtech.local',
      name: 'Demo Student',
      role: UserRole.STUDENT,
      password: {
        create: {
          passwordHash: await bcrypt.hash('student123', 10),
        },
      },
    },
  });

  console.log(`✅ Created users: admin, instructor, student`);

  // Demo-course
  await prisma.course.upsert({
    where: { id: 'demo-course-001' },
    update: {},
    create: {
      id: 'demo-course-001',
      title: 'Introduction to Machine Learning',
      description: 'A demo course generated from a PDF about ML fundamentals.',
      ownerId: instructor.id,
      status: 'PUBLISHED',
    },
  });

  console.log(`✅ Created demo course`);
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
