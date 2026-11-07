import { db } from './index.ts';
import * as schema from './schema.ts';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { mockPatients, mockDoctors, mockAppointments } from '../data/mockData.ts';

let isSeeded = false;

// Default System Official Accounts with known demo credentials
export const DEFAULT_ACCOUNTS_SEED_LIST = [
  { 
    email: 'admin@hospital.com', 
    plainPass: 'admin123', 
    fullName: 'د. خالد العمري (المدير العام)', 
    role: 'ADMIN',
    phone: '+966501112233'
  },
  { 
    email: 'admin@carehospital.com', 
    plainPass: 'admin123', 
    fullName: 'د. خالد العمري (المدير)', 
    role: 'ADMIN',
    phone: '+966501112233'
  },
  { 
    email: 'doctor@hospital.com', 
    plainPass: 'doctor123', 
    fullName: 'د. سارة السعيد (استشارية القلب)', 
    role: 'DOCTOR',
    phone: '+966504445566'
  },
  { 
    email: 'sara.s@carehospital.com', 
    plainPass: 'doctor123', 
    fullName: 'د. سارة السعيد', 
    role: 'DOCTOR',
    phone: '+966504445566'
  },
  { 
    email: 'staff@hospital.com', 
    plainPass: 'staff123', 
    fullName: 'أحمد البقمي (موظف الاستقبال)', 
    role: 'STAFF',
    phone: '+966507778899'
  },
  { 
    email: 'reception@carehospital.com', 
    plainPass: 'staff123', 
    fullName: 'أحمد البقمي (استقبال)', 
    role: 'STAFF',
    phone: '+966507778899'
  },
  { 
    email: 'm.otaibi@gmail.com', 
    plainPass: '1234', 
    fullName: 'محمد عبد الله العتيبي', 
    role: 'PATIENT',
    phone: '+966555123456'
  },
];

export async function seedDatabaseIfEmpty() {
  if (isSeeded) return;
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    return;
  }

  try {
    // 1. Seed & Validate Accounts (Ensure bcrypt hashing and account availability)
    try {
      for (const acc of DEFAULT_ACCOUNTS_SEED_LIST) {
        const cleanEmail = acc.email.trim().toLowerCase();
        const existing = await db
          .select()
          .from(schema.accounts)
          .where(eq(schema.accounts.email, cleanEmail))
          .limit(1);

        if (existing.length === 0) {
          // Hash password with bcrypt
          const hashedPassword = await bcrypt.hash(acc.plainPass, 10);
          await db.insert(schema.accounts).values({
            email: cleanEmail,
            password: hashedPassword,
            fullName: acc.fullName,
            role: acc.role,
            phone: acc.phone,
            isActive: true,
          }).onConflictDoNothing();
          console.log(`[Database Seed] Created official account: ${cleanEmail} (Role: ${acc.role})`);
        } else {
          // Verify existing account password; if plain or outdated, upgrade to bcrypt hash
          const curr = existing[0];
          let isPassValid = false;
          if (curr.password === acc.plainPass) {
            isPassValid = true;
          } else if (curr.password && (curr.password.startsWith('$2a$') || curr.password.startsWith('$2b$'))) {
            try {
              isPassValid = await bcrypt.compare(acc.plainPass, curr.password);
            } catch {
              isPassValid = false;
            }
          }

          // If password was broken or mismatched, update to verified bcrypt hash
          if (!isPassValid) {
            const rehashedPassword = await bcrypt.hash(acc.plainPass, 10);
            await db
              .update(schema.accounts)
              .set({ password: rehashedPassword, isActive: true })
              .where(eq(schema.accounts.email, cleanEmail));
            console.log(`[Database Seed] Synchronized password hash for: ${cleanEmail}`);
          }
        }
      }
    } catch (accErr) {
      console.warn('[Database Seed] Accounts check note (safe fallback):', accErr);
    }

    // 2. Seed Doctors, Patients, Appointments if empty
    const existingDocs = await db.select().from(schema.doctors).limit(1);
    if (existingDocs.length === 0) {
      console.log('[Database Seed] Seeding initial hospital data into PostgreSQL...');

      // Seed Doctors
      for (const d of mockDoctors) {
        await db.insert(schema.doctors).values({
          id: d.id,
          name: d.name,
          specialty: d.specialty,
          department: d.department,
          experienceYears: d.experienceYears,
          consultingFee: d.consultingFee,
          phone: d.phone,
          roomNumber: d.roomNumber,
          shift: d.shift,
          status: d.status,
          rating: d.rating ? String(d.rating) : '5.0',
        }).onConflictDoNothing();
      }

      // Seed Patients
      for (const p of mockPatients) {
        await db.insert(schema.patients).values({
          id: p.id,
          fullName: p.fullName,
          age: p.age,
          gender: p.gender,
          phone: p.phone,
          bloodType: p.bloodType,
          nationalId: p.nationalId,
          roomNumber: 'A-101',
          status: 'مستقر',
          assignedDoctor: 'د. سارة السعيد',
          notes: 'مريض مسجل بالنظام',
          admissionDate: p.lastVisitDate || new Date().toISOString().split('T')[0],
        }).onConflictDoNothing();
      }

      // Seed Appointments
      for (const a of mockAppointments) {
        await db.insert(schema.appointments).values({
          id: a.id,
          patientId: a.patientId,
          patientName: a.patientName,
          doctorId: a.doctorId,
          doctorName: a.doctorName,
          specialty: a.specialty,
          date: a.date,
          time: a.time,
          type: a.type,
          status: a.status,
          fee: a.fee,
          notes: a.notes || '',
        }).onConflictDoNothing();
      }

      console.log('[Database Seed] Initial hospital data seeded successfully.');
    }

    isSeeded = true;
  } catch (error) {
    console.warn('[Database Seed] Database seed deferred (safe fallback):', error);
  }
}
