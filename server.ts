import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { mockPatients, mockDoctors, mockAppointments, mockInventory, mockLabResults, mockPrescriptions, mockInvoices, mockShifts } from './src/data/mockData.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // In-memory data store initialized with mock data
  let patientsData = [...mockPatients];
  let doctorsData = [...mockDoctors];
  let appointmentsData = [...mockAppointments];
  let inventoryData = [...mockInventory];
  let labResultsData = [...mockLabResults];
  let prescriptionsData = [...mockPrescriptions];
  let invoicesData = [...mockInvoices];
  let shiftsData = [...mockShifts];

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString(), system: 'Care Hospital Management System' });
  });

  // Patients
  app.get('/api/patients', (req, res) => {
    res.json(patientsData);
  });

  app.post('/api/patients', (req, res) => {
    const newPatient = {
      id: `pat-${Date.now()}`,
      fileNumber: `MED-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      lastVisitDate: new Date().toISOString().split('T')[0],
      medicalHistory: req.body.medicalHistory || [],
      activeAllergies: req.body.activeAllergies || [],
      vitals: req.body.vitals || { bloodPressure: '120/80', heartRate: 75, temperature: 37.0, weight: 70 },
      ...req.body,
    };
    patientsData.unshift(newPatient);
    res.status(201).json(newPatient);
  });

  app.put('/api/patients/:id', (req, res) => {
    const { id } = req.params;
    const index = patientsData.findIndex(p => p.id === id);
    if (index !== -1) {
      patientsData[index] = { ...patientsData[index], ...req.body };
      res.json(patientsData[index]);
    } else {
      res.status(404).json({ error: 'المريض غير موجود' });
    }
  });

  // Doctors
  app.get('/api/doctors', (req, res) => {
    res.json(doctorsData);
  });

  app.put('/api/doctors/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const doc = doctorsData.find(d => d.id === id);
    if (doc) {
      doc.status = status;
      res.json(doc);
    } else {
      res.status(404).json({ error: 'الطبيب غير موجود' });
    }
  });

  // Appointments
  app.get('/api/appointments', (req, res) => {
    res.json(appointmentsData);
  });

  app.post('/api/appointments', (req, res) => {
    const newApt = {
      id: `apt-${Date.now()}`,
      status: 'مؤكد',
      fee: req.body.fee || 350,
      ...req.body,
    };
    appointmentsData.unshift(newApt);
    res.status(201).json(newApt);
  });

  app.put('/api/appointments/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const apt = appointmentsData.find(a => a.id === id);
    if (apt) {
      apt.status = status;
      res.json(apt);
    } else {
      res.status(404).json({ error: 'الموعد غير موجود' });
    }
  });

  // Inventory
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

  // Lab Results
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

  // Prescriptions
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

  // Invoices
  app.get('/api/invoices', (req, res) => {
    res.json(invoicesData);
  });

  app.post('/api/invoices', (req, res) => {
    const subtotal = Number(req.body.subtotal) || 0;
    const tax = subtotal * 0.15; // 15% VAT
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
