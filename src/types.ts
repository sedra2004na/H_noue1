export type UserRole = 'admin' | 'doctor' | 'staff' | 'patient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatar?: string;
}

export type DoctorStatus = 'active' | 'on_leave' | 'busy' | 'off_duty';

export interface Doctor {
  id: string;
  userId?: string;
  name: string;
  specialty: string;
  experienceYears: number;
  email: string;
  phone: string;
  status: DoctorStatus;
  shift: 'صباحي' | 'مسائي' | 'ليلي';
  department: string;
  roomNumber: string;
  consultingFee: number;
  rating: number;
}

export interface Patient {
  id: string;
  fileNumber: string; // رقم الملف الطبي
  nationalId: string; // رقم الهوية
  fullName: string;
  age: number;
  gender: 'ذكر' | 'أنثى';
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  phone: string;
  address: string;
  emergencyContact: string;
  insuranceProvider: string;
  insuranceNumber: string;
  medicalHistory: string[];
  activeAllergies: string[];
  allergies?: string[];
  chronicConditions?: string[];
  lastVisitDate: string;
  vitals?: {
    bloodPressure: string; // e.g. 120/80
    heartRate: number; // bpm
    temperature: number; // °C
    weight: number; // kg
    oxygenSat?: string;
  };
}

export type AppointmentType = 'كشف' | 'استشارة' | 'متابعة' | 'طوارئ';
export type AppointmentStatus = 'مؤكد' | 'معلق' | 'مكتمل' | 'ملغى';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
  fee: number;
}

export interface Shift {
  id: string;
  doctorId: string;
  doctorName: string;
  shiftType: 'صباحي' | 'مسائي' | 'ليلي';
  timeRange: string;
  department: string;
  days: string[]; // e.g. ['الأحد', 'الإثنين']
}

export type InventoryCategory = 'أدوية' | 'مستلزمات طبية' | 'معدات' | 'محلول وقائي';
export type StockStatus = 'متوفر' | 'منخفض' | 'نفذ' | 'منتهي الصلاحية';

export interface InventoryItem {
  id: string;
  itemName: string;
  category: InventoryCategory;
  quantity: number;
  minStockAlert: number;
  price: number;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  unit: string; // علبة, شريط, زجاجة, طرد
  status: StockStatus;
  manufacturer: string;
}

export type LabStatus = 'طبيعي' | 'تحذير' | 'حرج' | 'قيد المعالجة';

export interface LabResult {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  testName: string;
  testDate: string;
  status: LabStatus;
  resultValue: string;
  normalRange: string;
  unit: string;
  notes?: string;
}

export interface PrescriptionMedicine {
  medicineName: string;
  dosage: string; // e.g. 500mg
  frequency: string; // e.g. 3 مرات يومياً
  duration: string; // e.g. 7 أيام
}

export interface Prescription {
  id: string;
  appointmentId?: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  diagnosis: string;
  medicines: PrescriptionMedicine[];
  doctorInstructions: string;
}

export type InvoiceStatus = 'مدفوع' | 'معلق' | 'جزئي' | 'ملغى';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  insuranceCovered: number;
  netAmount: number;
  status: InvoiceStatus;
  paymentMethod?: 'نقدي' | 'بطاقة ائتمان' | 'تأمين طبي' | 'تحويل بنكي' | 'شام كاش (Sham Cash)';
}

export interface SystemStats {
  totalPatients: number;
  todayAppointments: number;
  pendingInvoicesCount: number;
  activeDoctorsCount: number;
  monthlyRevenue: number;
  lowStockItemsCount: number;
}

export interface DischargeMedication {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface DischargeSummary {
  id: string;
  reportNumber: string;
  patientId: string;
  patientName: string;
  fileNumber: string;
  nationalId: string;
  age: number;
  gender: 'ذكر' | 'أنثى';
  admissionDate: string;
  dischargeDate: string;
  department: string;
  roomBedNumber: string;
  attendingDoctor: string;
  specialty: string;
  admissionDiagnosis: string;
  dischargeDiagnosis: string;
  hospitalCourse: string;
  surgicalProcedures?: string;
  dischargeCondition: 'شفاء تام' | 'تحسن سريري ممتاز' | 'استقرار مع متابعة منزلية' | 'نقل لمشفى آخر' | 'خروج على مسؤولية المريض';
  medications: DischargeMedication[];
  dietAndActivityInstructions: string;
  dangerSigns: string;
  followUpDate: string;
  followUpClinic: string;
  doctorNotes?: string;
  createdAt: string;
}
