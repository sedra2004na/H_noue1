import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { mockPatients, mockDoctors, mockAppointments, mockInventory, mockLabResults, mockPrescriptions, mockInvoices, mockShifts } from './src/data/mockData.ts';
import { db } from './src/db/index.ts';
import * as schema from './src/db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import { seedDatabaseIfEmpty } from './src/db/seed.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // In-memory fallback dataset
  let patientsData = [...mockPatients];
  let doctorsData = [...mockDoctors];
  let appointmentsData = [...mockAppointments];
  let inventoryData = [...mockInventory];
  let labResultsData = [...mockLabResults];
  let prescriptionsData = [...mockPrescriptions];
  let invoicesData = [...mockInvoices];
  let shiftsData = [...mockShifts];

  // Try seed database if PostgreSQL / Cloud SQL is connected
  seedDatabaseIfEmpty().catch(e => console.warn('Seed error (safe fallback):', e));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      serverTime: new Date().toISOString(), 
      system: 'Care Hospital Management System',
      database: process.env.SQL_HOST ? 'Cloud SQL (PostgreSQL / Relational)' : 'In-Memory / Local Storage'
    });
  });

  // =================== PATIENTS ===================
  app.get('/api/patients', async (req, res) => {
    if (process.env.SQL_HOST) {
      try {
        const rows = await db.select().from(schema.patients);
        if (rows.length > 0) return res.json(rows);
      } catch (err) {
        console.warn('DB read failed, falling back to memory:', err);
      }
    }
    res.json(patientsData);
  });

  app.post('/api/patients', async (req, res) => {
    const newPatient = {
      id: `pat-${Date.now()}`,
      fileNumber: `MED-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      lastVisitDate: new Date().toISOString().split('T')[0],
      medicalHistory: req.body.medicalHistory || [],
      activeAllergies: req.body.activeAllergies || [],
      vitals: req.body.vitals || { bloodPressure: '120/80', heartRate: 75, temperature: 37.0, weight: 70 },
      ...req.body,
    };

    if (process.env.SQL_HOST) {
      try {
        await db.insert(schema.patients).values({
          id: newPatient.id,
          fullName: newPatient.fullName,
          age: Number(newPatient.age) || 30,
          gender: newPatient.gender || 'ذكر',
          phone: newPatient.phone || '',
          bloodType: newPatient.bloodType || 'A+',
          nationalId: newPatient.nationalId || '',
          roomNumber: newPatient.roomNumber || '',
          status: newPatient.status || 'مستقر',
          assignedDoctor: newPatient.assignedDoctor || '',
          notes: newPatient.notes || '',
          admissionDate: newPatient.admissionDate || new Date().toISOString().split('T')[0],
        }).onConflictDoNothing();
      } catch (err) {
        console.warn('DB insert failed:', err);
      }
    }

    patientsData.unshift(newPatient);
    res.status(201).json(newPatient);
  });

  app.put('/api/patients/:id', async (req, res) => {
    const { id } = req.params;
    if (process.env.SQL_HOST) {
      try {
        await db.update(schema.patients).set({
          fullName: req.body.fullName,
          status: req.body.status,
          phone: req.body.phone,
          notes: req.body.notes,
        }).where(eq(schema.patients.id, id));
      } catch (err) {
        console.warn('DB update failed:', err);
      }
    }

    const index = patientsData.findIndex(p => p.id === id);
    if (index !== -1) {
      patientsData[index] = { ...patientsData[index], ...req.body };
      res.json(patientsData[index]);
    } else {
      res.status(404).json({ error: 'المريض غير موجود' });
    }
  });

  // =================== DOCTORS ===================
  app.get('/api/doctors', async (req, res) => {
    if (process.env.SQL_HOST) {
      try {
        const rows = await db.select().from(schema.doctors);
        if (rows.length > 0) return res.json(rows);
      } catch (err) {
        console.warn('DB read failed:', err);
      }
    }
    res.json(doctorsData);
  });

  app.post('/api/doctors', async (req, res) => {
    const newDoc = {
      id: `doc-${Date.now()}`,
      status: 'active',
      rating: 5.0,
      ...req.body,
    };

    if (process.env.SQL_HOST) {
      try {
        await db.insert(schema.doctors).values({
          id: newDoc.id,
          name: newDoc.name,
          specialty: newDoc.specialty,
          department: newDoc.department,
          experienceYears: Number(newDoc.experienceYears) || 5,
          consultingFee: Number(newDoc.consultingFee) || 25000,
          phone: newDoc.phone,
          roomNumber: newDoc.roomNumber,
          shift: newDoc.shift || 'صباحي',
          status: newDoc.status,
          rating: String(newDoc.rating),
        }).onConflictDoNothing();
      } catch (err) {
        console.warn('DB insert failed:', err);
      }
    }

    doctorsData.unshift(newDoc);
    res.status(201).json(newDoc);
  });

  // =================== APPOINTMENTS ===================
  app.get('/api/appointments', async (req, res) => {
    if (process.env.SQL_HOST) {
      try {
        const rows = await db.select().from(schema.appointments);
        if (rows.length > 0) return res.json(rows);
      } catch (err) {
        console.warn('DB read failed:', err);
      }
    }
    res.json(appointmentsData);
  });

  app.post('/api/appointments', async (req, res) => {
    const newApt = {
      id: `apt-${Date.now()}`,
      status: 'مؤكد',
      fee: req.body.fee || 25000,
      ...req.body,
    };

    if (process.env.SQL_HOST) {
      try {
        await db.insert(schema.appointments).values({
          id: newApt.id,
          patientId: newApt.patientId || 'p-1',
          patientName: newApt.patientName,
          doctorId: newApt.doctorId || 'd-1',
          doctorName: newApt.doctorName,
          specialty: newApt.specialty || 'طب عام',
          date: newApt.date,
          time: newApt.time,
          type: newApt.type || 'كشف',
          status: newApt.status,
          fee: Number(newApt.fee) || 25000,
          notes: newApt.notes || '',
        }).onConflictDoNothing();
      } catch (err) {
        console.warn('DB appointment insert failed:', err);
      }
    }

    appointmentsData.unshift(newApt);
    res.status(201).json(newApt);
  });

  app.put('/api/appointments/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (process.env.SQL_HOST) {
      try {
        await db.update(schema.appointments).set({ status }).where(eq(schema.appointments.id, id));
      } catch (err) {
        console.warn('DB appointment status update failed:', err);
      }
    }

    const apt = appointmentsData.find(a => a.id === id);
    if (apt) {
      apt.status = status;
      res.json(apt);
    } else {
      res.status(404).json({ error: 'الموعد غير موجود' });
    }
  });

  // =================== INVENTORY ===================
  app.get('/api/inventory', (req, res) => {
    res.json(inventoryData);
  });

  app.post('/api/inventory', (req, res) => {
    const qty = Number(req.body.quantity) || 0;
    const minAlert = Number(req.body.minStockAlert) || 20;
    let status: any = 'متوفر';
    if (qty === 0) status = 'نفذ';
    else if (qty <= minAlert) status = 'منخفض';

    const newItem = {
      id: `inv-${Date.now()}`,
      status,
      ...req.body,
    };
    inventoryData.unshift(newItem);
    res.status(201).json(newItem);
  });

  // =================== LAB RESULTS ===================
  app.get('/api/lab-results', (req, res) => {
    res.json(labResultsData);
  });

  app.post('/api/lab-results', (req, res) => {
    const newLab = {
      id: `lab-${Date.now()}`,
      testDate: new Date().toISOString().split('T')[0],
      ...req.body,
    };
    labResultsData.unshift(newLab);
    res.status(201).json(newLab);
  });

  // =================== PRESCRIPTIONS ===================
  app.get('/api/prescriptions', (req, res) => {
    res.json(prescriptionsData);
  });

  app.post('/api/prescriptions', (req, res) => {
    const newRx = {
      id: `rx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      ...req.body,
    };
    prescriptionsData.unshift(newRx);
    res.status(201).json(newRx);
  });

  // =================== INVOICES ===================
  app.get('/api/invoices', (req, res) => {
    res.json(invoicesData);
  });

  app.post('/api/invoices', (req, res) => {
    const subtotal = Number(req.body.subtotal) || 0;
    const tax = subtotal * 0.15;
    const insCovered = Number(req.body.insuranceCovered) || 0;
    const netAmount = Math.max(0, subtotal + tax - insCovered);

    const newInv = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      tax,
      netAmount,
      status: req.body.status || 'معلق',
      ...req.body,
    };
    invoicesData.unshift(newInv);
    res.status(201).json(newInv);
  });

  // Vite middleware or production static
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Care Hospital Management Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
