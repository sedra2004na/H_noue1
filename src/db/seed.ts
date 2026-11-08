import { db, pool } from './index.ts';
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

/**
 * Automatically creates all required database tables if they do not exist in PostgreSQL.
 * This guarantees that new cloud instances (Render, Supabase, Neon) function immediately
 * without requiring manual migration commands.
 */
export async function ensureDatabaseTablesExist() {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    return;
  }
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS accounts (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          full_name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'PATIENT',
          phone TEXT,
          refresh_token TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          is_deleted BOOLEAN DEFAULT FALSE,
          deleted_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS patients (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          file_number TEXT UNIQUE,
          full_name TEXT NOT NULL,
          age INTEGER NOT NULL,
          gender TEXT NOT NULL,
          phone TEXT NOT NULL,
          blood_type TEXT,
          national_id TEXT UNIQUE,
          address TEXT,
          emergency_contact TEXT,
          room_number TEXT,
          status TEXT NOT NULL DEFAULT 'مستقر',
          assigned_doctor TEXT,
          notes TEXT,
          medical_history JSONB,
          allergies JSONB,
          admission_date TEXT NOT NULL,
          is_verified_by_reception BOOLEAN DEFAULT FALSE,
          verified_by TEXT,
          verified_at TEXT,
          verification_status TEXT DEFAULT 'بانتظار التحقق والمطابقة بالاستقبال',
          is_deleted BOOLEAN DEFAULT FALSE,
          deleted_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS doctors (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          name TEXT NOT NULL,
          specialty TEXT NOT NULL,
          department TEXT NOT NULL,
          license_number TEXT,
          experience_years INTEGER DEFAULT 5,
          consulting_fee INTEGER DEFAULT 25000,
          phone TEXT,
          room_number TEXT,
          shift TEXT,
          status TEXT NOT NULL DEFAULT 'متاح',
          rating TEXT DEFAULT '5.0',
          is_deleted BOOLEAN DEFAULT FALSE,
          deleted_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS appointments (
          id TEXT PRIMARY KEY,
          patient_id TEXT NOT NULL,
          patient_name TEXT NOT NULL,
          doctor_id TEXT NOT NULL,
          doctor_name TEXT NOT NULL,
          specialty TEXT NOT NULL,
          date TEXT NOT NULL,
          time TEXT NOT NULL,
          type TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'معلق',
          fee TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          timestamp TEXT NOT NULL,
          user_id TEXT NOT NULL,
          user_name TEXT NOT NULL,
          user_role TEXT NOT NULL,
          action TEXT NOT NULL,
          target_resource TEXT NOT NULL,
          details TEXT NOT NULL,
          status TEXT NOT NULL,
          ip_address TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS beds (
          id TEXT PRIMARY KEY,
          ward_name TEXT NOT NULL,
          bed_number TEXT NOT NULL UNIQUE,
          room_number TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'AVAILABLE',
          patient_id TEXT,
          patient_name TEXT,
          attending_doctor_name TEXT,
          diagnosis TEXT,
          priority TEXT DEFAULT 'stable',
          admission_date TEXT,
          oxygen_equipped BOOLEAN DEFAULT TRUE,
          notes TEXT,
          is_deleted BOOLEAN DEFAULT FALSE,
          deleted_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY,
          invoice_number TEXT NOT NULL UNIQUE,
          patient_id TEXT NOT NULL,
          patient_name TEXT NOT NULL,
          date TEXT NOT NULL,
          amount NUMERIC DEFAULT 0,
          tax NUMERIC DEFAULT 0,
          insurance_covered NUMERIC DEFAULT 0,
          net_amount NUMERIC DEFAULT 0,
          total_amount INTEGER DEFAULT 0,
          paid_amount INTEGER DEFAULT 0,
          remaining_amount INTEGER DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'PENDING',
          payment_method TEXT,
          items JSONB,
          is_deleted BOOLEAN DEFAULT FALSE,
          deleted_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS prescriptions (
          id TEXT PRIMARY KEY,
          patient_id TEXT NOT NULL,
          patient_name TEXT NOT NULL,
          doctor_name TEXT NOT NULL,
          date TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'فعالة',
          diagnosis TEXT NOT NULL,
          medications JSONB,
          notes TEXT,
          is_deleted BOOLEAN DEFAULT FALSE,
          deleted_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS lab_requests (
          id TEXT PRIMARY KEY,
          patient_id TEXT NOT NULL,
          patient_name TEXT NOT NULL,
          doctor_id TEXT,
          doctor_name TEXT NOT NULL,
          test_name TEXT NOT NULL,
          category TEXT NOT NULL,
          date TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'قيد التحليل',
          result TEXT,
          reference_range TEXT,
          result_value TEXT,
          normal_range TEXT,
          unit TEXT,
          is_abnormal BOOLEAN DEFAULT FALSE,
          notes TEXT,
          is_deleted BOOLEAN DEFAULT FALSE,
          deleted_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS inventory (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 0,
          min_threshold INTEGER NOT NULL DEFAULT 10,
          unit TEXT NOT NULL DEFAULT 'علبة',
          price INTEGER NOT NULL DEFAULT 0,
          unit_price NUMERIC DEFAULT 0,
          expiry_date TEXT,
          batch_number TEXT,
          location TEXT,
          is_deleted BOOLEAN DEFAULT FALSE,
          deleted_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT DEFAULT 'info',
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('[Database Schema] Verified/Created all PostgreSQL tables successfully.');
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('[Database Schema] DDL table creation note (safe fallback):', err);
  }
}

export async function seedDatabaseIfEmpty() {
  if (isSeeded) return;
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    return;
  }

  try {
    // 0. Ensure tables exist in PostgreSQL
    await ensureDatabaseTablesExist();

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
