import { db } from './index.ts';
import * as schema from './schema.ts';
import { mockPatients, mockDoctors, mockAppointments } from '../data/mockData.ts';

let isSeeded = false;

export async function seedDatabaseIfEmpty() {
  if (isSeeded) return;
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    return;
  }

  try {
    // 1. Seed Accounts if empty
    try {
      const existingAccounts = await db.select().from(schema.accounts).limit(1);
      if (existingAccounts.length === 0) {
        const defaultAccounts = [
          { email: 'admin@hospital.com', password: 'admin123', fullName: 'د. خالد العمري (المدير العام)', role: 'ADMIN' },
          { email: 'admin@carehospital.com', password: 'admin123', fullName: 'د. خالد العمري (المدير)', role: 'ADMIN' },
          { email: 'doctor@hospital.com', password: 'doctor123', fullName: 'د. سارة السعيد (استشارية القلب)', role: 'DOCTOR' },
          { email: 'sara.s@carehospital.com', password: 'doctor123', fullName: 'د. سارة السعيد', role: 'DOCTOR' },
          { email: 'staff@hospital.com', password: 'staff123', fullName: 'أحمد البقمي (موظف الاستقبال)', role: 'STAFF' },
          { email: 'reception@carehospital.com', password: 'staff123', fullName: 'أحمد البقمي (استقبال)', role: 'STAFF' },
          { email: 'm.otaibi@gmail.com', password: '1234', fullName: 'محمد عبد الله العتيبي', role: 'PATIENT' },
        ];
        for (const acc of defaultAccounts) {
          await db.insert(schema.accounts).values(acc).onConflictDoNothing();
        }
      }
    } catch (accErr) {
      console.warn('Accounts table check note:', accErr);
    }

    const existingDocs = await db.select().from(schema.doctors).limit(1);
    if (existingDocs.length === 0) {
      console.log('Seeding initial hospital data into PostgreSQL...');

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

      console.log('Initial hospital database seed completed successfully.');
    }
    isSeeded = true;
  } catch (error) {
    console.warn('Database seed check deferred/failed (will proceed safely):', error);
  }
}
