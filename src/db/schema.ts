import { pgTable, text, integer, timestamp, serial, boolean, numeric, jsonb } from "drizzle-orm/pg-core";

// Accounts & Users
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("patient"), // admin, doctor, staff, patient
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Patients
export const patients = pgTable("patients", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(), // ذكر, أنثى
  phone: text("phone").notNull(),
  bloodType: text("blood_type"),
  nationalId: text("national_id"),
  roomNumber: text("room_number"),
  status: text("status").notNull().default("مستقر"), // مستقر, حرج, تحت الملاحظة, خرج
  assignedDoctor: text("assigned_doctor"),
  notes: text("notes"),
  medicalHistory: jsonb("medical_history").$type<string[]>(),
  allergies: jsonb("allergies").$type<string[]>(),
  admissionDate: text("admission_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Doctors
export const doctors = pgTable("doctors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  department: text("department").notNull(),
  experienceYears: integer("experience_years").default(5),
  consultingFee: integer("consulting_fee").default(25000),
  phone: text("phone"),
  roomNumber: text("room_number"),
  shift: text("shift").default("صباحي"), // صباحي, مسائي, مناوب ليلي
  status: text("status").default("active"), // active, on-leave
  rating: numeric("rating").default("5.0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Appointments
export const appointments = pgTable("appointments", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  doctorId: text("doctor_id").notNull(),
  doctorName: text("doctor_name").notNull(),
  specialty: text("specialty").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  type: text("type").notNull().default("كشف"), // كشف, استشارة, متابعة, طارئ
  status: text("status").notNull().default("مؤكد"), // مؤكد, بالانتظار, مكتمل, ملغى
  fee: integer("fee").default(25000),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Billing & Invoices
export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  date: text("date").notNull(),
  totalAmount: integer("total_amount").notNull(),
  paidAmount: integer("paid_amount").notNull().default(0),
  remainingAmount: integer("remaining_amount").notNull().default(0),
  status: text("status").notNull().default("غير مسدد"), // مسدد بالكامل, مدفوع جزئياً, غير مسدد
  items: jsonb("items").$type<Array<{ description: string; amount: number; category: string }>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Prescriptions
export const prescriptions = pgTable("prescriptions", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  doctorName: text("doctor_name").notNull(),
  date: text("date").notNull(),
  status: text("status").notNull().default("فعالة"), // فعالة, مكتملة, ملغاة
  diagnosis: text("diagnosis").notNull(),
  medications: jsonb("medications").$type<Array<{ name: string; dosage: string; frequency: string; duration: string }>>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lab Requests
export const labRequests = pgTable("lab_requests", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  doctorName: text("doctor_name").notNull(),
  testName: text("test_name").notNull(),
  category: text("category").notNull(),
  date: text("date").notNull(),
  status: text("status").notNull().default("قيد التحليل"), // جاهز, قيد التحليل, ملغى
  result: text("result"),
  referenceRange: text("reference_range"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory
export const inventory = pgTable("inventory", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // دواء, مستلزم طبي, جهاز
  quantity: integer("quantity").notNull().default(0),
  minThreshold: integer("min_threshold").notNull().default(10),
  unit: text("unit").notNull().default("علبة"),
  price: integer("price").notNull().default(0),
  expiryDate: text("expiry_date"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
});
