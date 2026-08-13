export interface TableColumn {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
  references?: string;
  nullable?: boolean;
  description: string;
}

export interface DatabaseTable {
  tableName: string;
  arabicName: string;
  description: string;
  columns: TableColumn[];
}

export const hospitalDatabaseTables: DatabaseTable[] = [
  {
    tableName: 'users',
    arabicName: 'جدول المستخدمين والصلاحيات',
    description: 'يخزن بيانات الدخول وتحديد الأدوار والصلاحيات (RBAC: مدير النظام، إداري، طبيب، مريض)',
    columns: [
      { name: 'id', type: 'UUID / INT AUTO_INCREMENT', isPk: true, nullable: false, description: 'المعرف الفريد للمستخدم' },
      { name: 'name', type: 'VARCHAR(255)', nullable: false, description: 'الاسم الكامل للمستخدم' },
      { name: 'email', type: 'VARCHAR(255) UNIQUE', nullable: false, description: 'البريد الإلكتروني للوجين' },
      { name: 'password_hash', type: 'VARCHAR(255)', nullable: false, description: 'كلمة المرور المشفرة (Bcrypt/Argon2)' },
      { name: 'role', type: "ENUM('admin', 'doctor', 'staff', 'patient')", nullable: false, description: 'دور المستخدم ونطاق صلاحياته' },
      { name: 'phone', type: 'VARCHAR(50)', nullable: true, description: 'رقم الهاتف للتحقق والخدمات' },
      { name: 'avatar_url', type: 'TEXT', nullable: true, description: 'رابط الصورة الشخصية' },
      { name: 'created_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP', nullable: false, description: 'تاريخ إنشاء الحساب' },
      { name: 'updated_at', type: 'TIMESTAMP', nullable: true, description: 'تاريخ آخر تحديث' },
    ],
  },
  {
    tableName: 'doctors',
    arabicName: 'جدول الأطباء والكادر الطبي',
    description: 'يحتوي على بيانات الكادر الطبي والتخصصات والمناوبات وتكاليف الاستشارة',
    columns: [
      { name: 'id', type: 'UUID / INT AUTO_INCREMENT', isPk: true, nullable: false, description: 'المعرف الفريد الطبيب' },
      { name: 'user_id', type: 'UUID', isFk: true, references: 'users(id)', nullable: false, description: 'ربط بحساب المستخدم' },
      { name: 'specialty', type: 'VARCHAR(150)', nullable: false, description: 'التخصص الطبي (قلب، عظام، أطفال...)' },
      { name: 'experience_years', type: 'INT', nullable: false, description: 'سنوات الخبرة العملية' },
      { name: 'department', type: 'VARCHAR(100)', nullable: false, description: 'القسم المستشفي التابع له' },
      { name: 'room_number', type: 'VARCHAR(50)', nullable: false, description: 'رقم العيادة أو الغرفة' },
      { name: 'consulting_fee', type: 'DECIMAL(10,2)', nullable: false, description: 'قيمة الكشفية بالريال/العملة' },
      { name: 'status', type: "ENUM('active', 'on_leave', 'busy', 'off_duty')", nullable: false, description: 'حالة الدوام الحالية' },
      { name: 'rating', type: 'DECIMAL(3,2)', nullable: true, description: 'تقييم المرضى للأداء' },
      { name: 'created_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP', nullable: false, description: 'تاريخ الإضافة' },
    ],
  },
  {
    tableName: 'patients',
    arabicName: 'جدول المرضى والملفات الطبية',
    description: 'يضم الملفات الطبية الشاملة والتاريخ المريض وفصيلة الدم والتأمين والطوارئ',
    columns: [
      { name: 'id', type: 'UUID / INT AUTO_INCREMENT', isPk: true, nullable: false, description: 'المعرف الفريد للمريض' },
      { name: 'user_id', type: 'UUID', isFk: true, references: 'users(id)', nullable: true, description: 'ربط بحساب المريض الإلكتروني' },
      { name: 'file_number', type: 'VARCHAR(50) UNIQUE', nullable: false, description: 'رقم الملف الطبي الفريد' },
      { name: 'national_id', type: 'VARCHAR(50) UNIQUE', nullable: false, description: 'رقم الهوية الوطنية أو الإقامة' },
      { name: 'full_name', type: 'VARCHAR(255)', nullable: false, description: 'اسم المريض الرباعي' },
      { name: 'age', type: 'INT', nullable: false, description: 'العمر بالسنين' },
      { name: 'gender', type: "ENUM('ذكر', 'أنثى')", nullable: false, description: 'الجنس' },
      { name: 'blood_type', type: "ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')", nullable: false, description: 'فصيلة الدم' },
      { name: 'phone', type: 'VARCHAR(50)', nullable: false, description: 'رقم التواصل الرئيسي' },
      { name: 'address', type: 'TEXT', nullable: true, description: 'العنوان الوطني' },
      { name: 'emergency_contact', type: 'VARCHAR(255)', nullable: true, description: 'جهة الاتصال عند الطوارئ' },
      { name: 'insurance_provider', type: 'VARCHAR(150)', nullable: true, description: 'شركة التأمين الطبي' },
      { name: 'insurance_number', type: 'VARCHAR(100)', nullable: true, description: 'رقم بوليصة التأمين' },
      { name: 'medical_history', type: 'JSONB / TEXT', nullable: true, description: 'الأمراض السابقة والعمليات' },
      { name: 'active_allergies', type: 'JSONB / TEXT', nullable: true, description: 'قائمة الحساسيات الدوائية والغذائية' },
      { name: 'last_visit_date', type: 'DATE', nullable: true, description: 'تاريخ آخر زيارة للمستشفى' },
    ],
  },
  {
    tableName: 'appointments',
    arabicName: 'جدول المواعيد والحجوزات',
    description: 'جدولة الحجوزات وحالاتها (مؤكد، معلق، مكتمل، ملغى) والأنواع (كشف، استشارة، متابعة، طوارئ)',
    columns: [
      { name: 'id', type: 'UUID / INT AUTO_INCREMENT', isPk: true, nullable: false, description: 'معرف الموعد' },
      { name: 'patient_id', type: 'UUID', isFk: true, references: 'patients(id)', nullable: false, description: 'المريض المراجع' },
      { name: 'doctor_id', type: 'UUID', isFk: true, references: 'doctors(id)', nullable: false, description: 'الطبيب المعالج' },
      { name: 'appointment_date', type: 'DATE', nullable: false, description: 'تاريخ الحجز' },
      { name: 'appointment_time', type: 'TIME', nullable: false, description: 'توقيت الحجز' },
      { name: 'type', type: "ENUM('كشف', 'استشارة', 'متابعة', 'طوارئ')", nullable: false, description: 'نوع الزيارة' },
      { name: 'status', type: "ENUM('مؤكد', 'معلق', 'مكتمل', 'ملغى')", nullable: false, description: 'حالة الحجز' },
      { name: 'notes', type: 'TEXT', nullable: true, description: 'ملاحظات الكشف المبدئية' },
      { name: 'fee', type: 'DECIMAL(10,2)', nullable: false, description: 'التكلفة الإجمالية للموعد' },
      { name: 'created_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP', nullable: false, description: 'وقت إنشاء الموعد' },
    ],
  },
  {
    tableName: 'shifts',
    arabicName: 'جدول المناوبات والدوام',
    description: 'تنظيم شفتات الأطباء (صباحي، مسائي، ليلي) وتخصيص الأيام والتخصصات',
    columns: [
      { name: 'id', type: 'UUID / INT AUTO_INCREMENT', isPk: true, nullable: false, description: 'معرف المناوبة' },
      { name: 'doctor_id', type: 'UUID', isFk: true, references: 'doctors(id)', nullable: false, description: 'الطبيب المناوب' },
      { name: 'shift_type', type: "ENUM('صباحي', 'مسائي', 'ليلي')", nullable: false, description: 'فترة الشفت' },
      { name: 'time_range', type: 'VARCHAR(100)', nullable: false, description: 'نطاق الساعات (مثال: 08:00ص - 04:00م)' },
      { name: 'department', type: 'VARCHAR(100)', nullable: false, description: 'القسم المناوب به' },
      { name: 'assigned_days', type: 'JSONB / VARCHAR(255)', nullable: false, description: 'أيام الدوام الأسبوعية' },
    ],
  },
  {
    tableName: 'inventory',
    arabicName: 'جدول المستودع والأدوية والمستلزمات',
    description: 'متابعة كميات الصيدلية، حدود النقص التلقائية، تواريخ الصلاحية، وأرقام التشغيلات',
    columns: [
      { name: 'id', type: 'UUID / INT AUTO_INCREMENT', isPk: true, nullable: false, description: 'معرف الصنف' },
      { name: 'item_name', type: 'VARCHAR(255)', nullable: false, description: 'اسم الدواء أو المستلزم الطبي' },
      { name: 'category', type: "ENUM('أدوية', 'مستلزمات طبية', 'معدات', 'محلول وقائي')", nullable: false, description: 'فئة المنتج' },
      { name: 'quantity', type: 'INT', nullable: false, description: 'الكمية المتوفرة حالياً' },
      { name: 'min_stock_alert', type: 'INT', nullable: false, description: 'الحد الأدنى للتنبيه بالنقص' },
      { name: 'price', type: 'DECIMAL(10,2)', nullable: false, description: 'سعر الوحدة' },
      { name: 'batch_number', type: 'VARCHAR(100)', nullable: false, description: 'رقم التشغيلة (Batch/Lot No)' },
      { name: 'expiry_date', type: 'DATE', nullable: false, description: 'تاريخ انتهاء الصلاحية' },
      { name: 'unit', type: 'VARCHAR(50)', nullable: false, description: 'الوحدة (علبة، شريط، عبوة)' },
      { name: 'status', type: "ENUM('متوفر', 'منخفض', 'نفذ', 'منتهي الصلاحية')", nullable: false, description: 'حالة المخزون' },
      { name: 'manufacturer', type: 'VARCHAR(200)', nullable: true, description: 'الشركة المصنعة' },
    ],
  },
  {
    tableName: 'lab_results',
    arabicName: 'جدول التحاليل والمختبرات',
    description: 'تتبع نتائج الفحوصات الطبية ومؤشرات الخطورة (طبيعي، تحذير، حرج) والنطاقات الطبيعية',
    columns: [
      { name: 'id', type: 'UUID / INT AUTO_INCREMENT', isPk: true, nullable: false, description: 'معرف الفحص' },
      { name: 'patient_id', type: 'UUID', isFk: true, references: 'patients(id)', nullable: false, description: 'المريض' },
      { name: 'doctor_id', type: 'UUID', isFk: true, references: 'doctors(id)', nullable: false, description: 'الطبيب المطلوب منه الفحص' },
      { name: 'test_name', type: 'VARCHAR(255)', nullable: false, description: 'اسم التحليل المخبري' },
      { name: 'test_date', type: 'DATE', nullable: false, description: 'تاريخ إجراء الفحص' },
      { name: 'status', type: "ENUM('طبيعي', 'تحذير', 'حرج', 'قيد المعالجة')", nullable: false, description: 'مؤشر نتيجة الفحص' },
      { name: 'result_value', type: 'VARCHAR(255)', nullable: false, description: 'القيمة الناتجة' },
      { name: 'normal_range', type: 'VARCHAR(100)', nullable: false, description: 'المعدل الطبيعي المقارن' },
      { name: 'unit', type: 'VARCHAR(50)', nullable: true, description: 'وحدة القياس' },
      { name: 'notes', type: 'TEXT', nullable: true, description: 'توصيات أخصائي المختبر' },
    ],
  },
  {
    tableName: 'prescriptions',
    arabicName: 'جدول الوصفات الطبية الإلكترونية',
    description: 'الوصفات الصادرة من الأطباء وتشمل التشخيص والجرعات ومدة العلاج والتعليمات',
    columns: [
      { name: 'id', type: 'UUID / INT AUTO_INCREMENT', isPk: true, nullable: false, description: 'معرف الوصفة' },
      { name: 'appointment_id', type: 'UUID', isFk: true, references: 'appointments(id)', nullable: true, description: 'الموعد المرتبط' },
      { name: 'patient_id', type: 'UUID', isFk: true, references: 'patients(id)', nullable: false, description: 'المريض' },
      { name: 'doctor_id', type: 'UUID', isFk: true, references: 'doctors(id)', nullable: false, description: 'الطبيب المعالج' },
      { name: 'date', type: 'DATE', nullable: false, description: 'تاريخ الصدور' },
      { name: 'diagnosis', type: 'TEXT', nullable: false, description: 'التشخيص الطبي الأولي' },
      { name: 'medicines_json', type: 'JSONB / TEXT', nullable: false, description: 'تفاصيل الأدوية والجرعات والتكرار' },
      { name: 'doctor_instructions', type: 'TEXT', nullable: true, description: 'ارشاد وتوصيات الطبيب للمريض' },
    ],
  },
  {
    tableName: 'invoices',
    arabicName: 'جدول الفواتير والمالية',
    description: 'سجلات الفواتير والضرائب، تغطية الشركات التأمينية، والمبالغ المستحقة وطرق الدفع',
    columns: [
      { name: 'id', type: 'UUID / INT AUTO_INCREMENT', isPk: true, nullable: false, description: 'معرف الفاتورة' },
      { name: 'invoice_number', type: 'VARCHAR(100) UNIQUE', nullable: false, description: 'رقم الفاتورة الإلكترونية' },
      { name: 'patient_id', type: 'UUID', isFk: true, references: 'patients(id)', nullable: false, description: 'المريض المعني' },
      { name: 'date', type: 'DATE', nullable: false, description: 'تاريخ الاصدار' },
      { name: 'subtotal', type: 'DECIMAL(10,2)', nullable: false, description: 'المبلغ قبل الضريبة والتأمين' },
      { name: 'tax', type: 'DECIMAL(10,2)', nullable: false, description: 'قيمة ضريبة القيمة المضافة VAT (15%)' },
      { name: 'insurance_covered', type: 'DECIMAL(10,2)', nullable: false, description: 'المبلغ المغطى بواسطة شركة التأمين' },
      { name: 'net_amount', type: 'DECIMAL(10,2)', nullable: false, description: 'المبلغ النهائي المستحق على المريض' },
      { name: 'status', type: "ENUM('مدفوع', 'معلق', 'جزئي', 'ملغى')", nullable: false, description: 'حالة السداد' },
      { name: 'payment_method', type: "ENUM('نقدي', 'بطاقة ائتمان', 'تأمين طبي', 'تحويل بنكي')", nullable: true, description: 'طريقة الدفع المستخدمة' },
    ],
  },
];

export const postgresqlDDL = `-- =========================================================
-- PostgreSQL Database Schema for Care Hospital Management System
-- نظام إدارة المستشفيات الشامل - مستشفى الرعاية
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'staff', 'patient');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'patient',
    phone VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Doctors Table
CREATE TYPE doctor_status AS ENUM ('active', 'on_leave', 'busy', 'off_duty');

CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    specialty VARCHAR(150) NOT NULL,
    experience_years INT NOT NULL DEFAULT 0,
    department VARCHAR(100) NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    consulting_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status doctor_status NOT NULL DEFAULT 'active',
    rating DECIMAL(3,2) DEFAULT 5.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Patients Table
CREATE TYPE gender_type AS ENUM ('ذكر', 'أنثى');
CREATE TYPE blood_group AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    file_number VARCHAR(50) UNIQUE NOT NULL,
    national_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    gender gender_type NOT NULL,
    blood_type blood_group NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT,
    emergency_contact VARCHAR(255),
    insurance_provider VARCHAR(150),
    insurance_number VARCHAR(100),
    medical_history JSONB DEFAULT '[]'::jsonb,
    active_allergies JSONB DEFAULT '[]'::jsonb,
    last_visit_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Appointments Table
CREATE TYPE appointment_type AS ENUM ('كشف', 'استشارة', 'متابعة', 'طوارئ');
CREATE TYPE appointment_status AS ENUM ('مؤكد', 'معلق', 'مكتمل', 'ملغى');

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    type appointment_type NOT NULL DEFAULT 'كشف',
    status appointment_status NOT NULL DEFAULT 'معلق',
    notes TEXT,
    fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Shifts Table
CREATE TYPE shift_type_enum AS ENUM ('صباحي', 'مسائي', 'ليلي');

CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    shift_type shift_type_enum NOT NULL,
    time_range VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    assigned_days JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Inventory & Medicines Table
CREATE TYPE inventory_category AS ENUM ('أدوية', 'مستلزمات طبية', 'معدات', 'محلول وقائي');
CREATE TYPE stock_status_enum AS ENUM ('متوفر', 'منخفض', 'نفذ', 'منتهي الصلاحية');

CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name VARCHAR(255) NOT NULL,
    category inventory_category NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    min_stock_alert INT NOT NULL DEFAULT 10,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    unit VARCHAR(50) NOT NULL,
    status stock_status_enum NOT NULL DEFAULT 'متوفر',
    manufacturer VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Lab Results Table
CREATE TYPE lab_status_enum AS ENUM ('طبيعي', 'تحذير', 'حرج', 'قيد المعالجة');

CREATE TABLE lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    test_name VARCHAR(255) NOT NULL,
    test_date DATE NOT NULL,
    status lab_status_enum NOT NULL DEFAULT 'قيد المعالجة',
    result_value VARCHAR(255) NOT NULL,
    normal_range VARCHAR(100) NOT NULL,
    unit VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Prescriptions Table
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,
    diagnosis TEXT NOT NULL,
    medicines_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    doctor_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Invoices Table
CREATE TYPE invoice_status_enum AS ENUM ('مدفوع', 'معلق', 'جزئي', 'ملغى');
CREATE TYPE payment_method_enum AS ENUM ('نقدي', 'بطاقة ائتمان', 'تأمين طبي', 'تحويل بنكي');

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) NOT NULL,
    insurance_covered DECIMAL(10,2) DEFAULT 0.00,
    net_amount DECIMAL(10,2) NOT NULL,
    status invoice_status_enum NOT NULL DEFAULT 'معلق',
    payment_method payment_method_enum,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX idx_patients_file_number ON patients(file_number);
CREATE INDEX idx_patients_national_id ON patients(national_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_inventory_expiry ON inventory(expiry_date);
CREATE INDEX idx_lab_status ON lab_results(status);
`;
