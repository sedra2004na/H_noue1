import { pgTable, text, integer, timestamp, serial, boolean, numeric, jsonb } from "drizzle-orm/pg-core";

// 1. Accounts & Users (RBAC)
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("PATIENT"), // ADMIN, DOCTOR, STAFF, PATIENT
  phone: text("phone"),
  refreshToken: text("refresh_token"),
  isActive: boolean("is_active").default(true),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 2. Patients Official Record
export const patients = pgTable("patients", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  fileNumber: text("file_number").unique(),
  fullName: text("full_name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(), // MALE, FEMALE
  phone: text("phone").notNull(),
  bloodType: text("blood_type"),
  nationalId: text("national_id").unique(),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  roomNumber: text("room_number"),
  status: text("status").notNull().default("مستقر"),
  assignedDoctor: text("assigned_doctor"),
  notes: text("notes"),
  medicalHistory: jsonb("medical_history").$type<string[]>(),
  allergies: jsonb("allergies").$type<string[]>(),
  admissionDate: text("admission_date").notNull(),
  isVerifiedByReception: boolean("is_verified_by_reception").default(false),
  verifiedBy: text("verified_by"),
  verifiedAt: text("verified_at"),
  verificationStatus: text("verification_status").default("بانتظار التحقق والمطابقة بالاستقبال"),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 3. Doctors & Clinical Staff
export const doctors = pgTable("doctors", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  department: text("department").notNull(),
  licenseNumber: text("license_number"),
  experienceYears: integer("experience_years").default(5),
  consultingFee: integer("consulting_fee").default(25000),
  phone: text("phone"),
  roomNumber: text("room_number"),
  shift: text("shift").default("صباحي"),
  status: text("status").default("active"),
  rating: numeric("rating").default("5.0"),
  isActive: boolean("is_active").default(true),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 4. Doctor Schedules
export const doctorSchedules = pgTable("doctor_schedules", {
  id: text("id").primaryKey(),
  doctorId: text("doctor_id").notNull(),
  dayOfWeek: text("day_of_week").notNull(), // السبت، الأحد...
  startTime: text("start_time").notNull(), // HH:MM
  endTime: text("end_time").notNull(),     // HH:MM
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 5. Appointments & Clinics
export const appointments = pgTable("appointments", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  doctorId: text("doctor_id").notNull(),
  doctorName: text("doctor_name").notNull(),
  specialty: text("specialty").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  dateTime: timestamp("date_time"),
  type: text("type").notNull().default("كشف"),
  status: text("status").notNull().default("CONFIRMED"), // SCHEDULED, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW
  fee: integer("fee").default(25000),
  notes: text("notes"),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 6. Inpatient Wards & Bed Management
export const beds = pgTable("beds", {
  id: text("id").primaryKey(),
  wardName: text("ward_name").notNull(),
  bedNumber: text("bed_number").notNull().unique(),
  roomNumber: text("room_number").notNull(),
  status: text("status").notNull().default("AVAILABLE"), // AVAILABLE, OCCUPIED, MAINTENANCE, RESERVED
  patientId: text("patient_id"),
  patientName: text("patient_name"),
  attendingDoctorName: text("attending_doctor_name"),
  diagnosis: text("diagnosis"),
  priority: text("priority").default("stable"),
  admissionDate: text("admission_date"),
  oxygenEquipped: boolean("oxygen_equipped").default(true),
  notes: text("notes"),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 7. Bed Assignments History
export const bedAssignments = pgTable("bed_assignments", {
  id: text("id").primaryKey(),
  bedId: text("bed_id").notNull(),
  patientId: text("patient_id").notNull(),
  admissionDate: timestamp("admission_date").defaultNow(),
  dischargeDate: timestamp("discharge_date"),
  diagnosis: text("diagnosis"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 8. Billing & Invoices
export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  patientId: text("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  date: text("date").notNull(),
  amount: numeric("amount").notNull().default("0"),
  tax: numeric("tax").default("0"),
  insuranceCovered: numeric("insurance_covered").default("0"),
  netAmount: numeric("net_amount").default("0"),
  totalAmount: integer("total_amount").notNull().default(0),
  paidAmount: integer("paid_amount").notNull().default(0),
  remainingAmount: integer("remaining_amount").notNull().default(0),
  status: text("status").notNull().default("PENDING"), // PENDING, PAID, PARTIALLY_PAID, CANCELLED
  paymentMethod: text("payment_method"),
  items: jsonb("items").$type<Array<{ description: string; amount: number; category: string }>>(),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 9. Electronic Prescriptions
export const prescriptions = pgTable("prescriptions", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  doctorName: text("doctor_name").notNull(),
  date: text("date").notNull(),
  status: text("status").notNull().default("فعالة"),
  diagnosis: text("diagnosis").notNull(),
  medications: jsonb("medications").$type<Array<{ name: string; dosage: string; frequency: string; duration: string }>>(),
  notes: text("notes"),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 10. Lab Results
export const labRequests = pgTable("lab_requests", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  doctorId: text("doctor_id"),
  doctorName: text("doctor_name").notNull(),
  testName: text("test_name").notNull(),
  category: text("category").notNull(),
  date: text("date").notNull(),
  status: text("status").notNull().default("قيد التحليل"),
  result: text("result"),
  referenceRange: text("reference_range"),
  resultValue: text("result_value"),
  normalRange: text("normal_range"),
  unit: text("unit"),
  isAbnormal: boolean("is_abnormal").default(false),
  notes: text("notes"),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 11. Lab Historical Points (لقراءات السكر والضغط والتحاليل المتكررة عبر الزمن)
export const labHistoricalPoints = pgTable("lab_historical_points", {
  id: text("id").primaryKey(),
  labResultId: text("lab_result_id").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow(),
  value: numeric("value").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 12. Pharmacy & Inventory
export const inventory = pgTable("inventory", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull().default(0),
  minThreshold: integer("min_threshold").notNull().default(10),
  unit: text("unit").notNull().default("علبة"),
  price: integer("price").notNull().default(0),
  unitPrice: numeric("unit_price").default("0"),
  expiryDate: text("expiry_date"),
  batchNumber: text("batch_number"),
  location: text("location"),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 13. Notifications
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").default("info"), // danger, warning, info
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 14. HIPAA & ISO-27001 Audit Logs Table
export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  userName: text("user_name").notNull(),
  userRole: text("user_role").notNull(),
  action: text("action").notNull(),
  targetResource: text("target_resource").notNull(),
  details: text("details").notNull(),
  status: text("status").notNull(),
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
});
