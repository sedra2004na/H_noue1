import { db } from './index.ts';
import * as schema from './schema.ts';
import { mockPatients, mockDoctors, mockAppointments } from '../data/mockData.ts';

let isSeeded = false;

export async function seedDatabaseIfEmpty() {
  if (isSeeded) return;
  if (!process.env.SQL_HOST) {
    return;
  }

  try {
    const existingDocs = await db.select().from(schema.doctors).limit(1);
    if (existingDocs.length === 0) {
      console.log('Seeding initial hospital data into Cloud SQL...');

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
