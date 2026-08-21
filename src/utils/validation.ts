/**
 * Care Hospital Management System - Data Validation & Human Error Prevention Engine
 * محرك التحقق من صحة المدخلات ومنع الأخطاء البشرية والطبية
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}

// 1. Patient Form Validation
export interface PatientFormInput {
  fullName: string;
  nationalId: string;
  age: number | string;
  gender: string;
  phone: string;
  bloodType: string;
  insuranceNumber?: string;
  activeAllergies?: string[];
  allergiesInput?: string;
}

export function validatePatientForm(
  data: PatientFormInput,
  existingPatients: Array<{ id: string; nationalId?: string; phone?: string }>,
  currentPatientId?: string
): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Full Name validation
  const trimmedName = (data.fullName || '').trim();
  if (!trimmedName) {
    errors.fullName = 'الاسم الرباعي للمريض حقل إلزامي لا يمكن تركه فارغاً';
  } else if (trimmedName.split(/\s+/).length < 2) {
    errors.fullName = 'يرجى إدخال الاسم الثنائي أو الثلاثي على الأقل (مثال: أحمد محمد علي)';
  } else if (trimmedName.length < 5) {
    errors.fullName = 'الاسم المدخل قصير جداً، يرجى كتابة الاسم بشكل واضح';
  }

  // National ID validation & Duplicate Check
  const trimmedNID = (data.nationalId || '').trim();
  if (!trimmedNID) {
    errors.nationalId = 'الرقم الوطني / رقم الهوية إلزامي لتوثيق الملف الطبي';
  } else if (!/^\d+$/.test(trimmedNID)) {
    errors.nationalId = 'الرقم الوطني يجب أن يتكون من أرقام فقط بدون أحرف أو رموز خاصة';
  } else if (trimmedNID.length < 8 || trimmedNID.length > 15) {
    errors.nationalId = 'الرقم الوطني يجب أن يكون بين 8 و 14 رقماً';
  } else {
    // Check duplicates
    const duplicate = existingPatients.find(
      (p) => p.nationalId === trimmedNID && p.id !== currentPatientId
    );
    if (duplicate) {
      errors.nationalId = `خطأ تكرار: الرقم الوطني (${trimmedNID}) مسجل مسبقاً لمريض آخر في قاعدة البيانات!`;
    }
  }

  // Phone Validation
  const trimmedPhone = (data.phone || '').trim();
  if (!trimmedPhone) {
    errors.phone = 'رقم هاتف التواصل إلزامي للتنبيهات والمواعيد الطارئة';
  } else if (!/^[\d+\-\s]{8,16}$/.test(trimmedPhone)) {
    errors.phone = 'صيغة رقم الهاتف غير صحيحة (مثال صحيح: 0944123456 أو +963944123456)';
  }

  // Age Validation
  const numericAge = Number(data.age);
  if (isNaN(numericAge) || data.age === '') {
    errors.age = 'يرجى إدخال عمر صحيح بالأرقام';
  } else if (numericAge < 0 || numericAge > 125) {
    errors.age = 'العمر المدخل غير منطقي (يجب أن يكون بين 0 و 125 عاماً)';
  }

  // Blood Type Validation
  const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  if (!data.bloodType || !validBloodTypes.includes(data.bloodType)) {
    errors.bloodType = 'يرجى تحديد فصيلة دم صحيحة من القائمة';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

// 2. Appointment Booking & Collision Validation
export interface AppointmentFormInput {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  type: string;
  fee?: number | string;
}

export function validateAppointmentForm(
  data: AppointmentFormInput,
  existingAppointments: Array<{
    id: string;
    doctorName: string;
    patientName: string;
    date: string;
    time: string;
    status: string;
  }>,
  currentAppointmentId?: string
): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  if (!data.patientName || !data.patientName.trim()) {
    errors.patientName = 'يرجى اختيار أو كتابة اسم المريض';
  }

  if (!data.doctorName || !data.doctorName.trim()) {
    errors.doctorName = 'يرجى اختيار الطبيب المعالج أو العيادة';
  }

  if (!data.date) {
    errors.date = 'يرجى تحديد تاريخ الموعد الطبي';
  } else {
    // Check if appointment is in the past (only warn or block based on date)
    const today = new Date().toISOString().split('T')[0];
    if (data.date < today) {
      warnings.date = 'تنبيه: لقد اخترت تاريخاً سابقاً لتاريخ اليوم!';
    }
  }

  if (!data.time) {
    errors.time = 'يرجى تحديد توقيت الموعد';
  }

  // Exact collision check (Same doctor at same date & time OR same patient at same date & time)
  if (data.date && data.time && data.doctorName) {
    const trimmedDoc = data.doctorName.trim().toLowerCase();
    const trimmedPat = (data.patientName || '').trim().toLowerCase();

    const doctorCollision = existingAppointments.find(
      (a) =>
        a.id !== currentAppointmentId &&
        a.status !== 'ملغى' &&
        a.status !== 'ملغية' &&
        a.date === data.date &&
        a.time === data.time &&
        a.doctorName.trim().toLowerCase() === trimmedDoc
    );

    if (doctorCollision) {
      errors.time = `تعارض في المواعيد: الطبيب (${doctorCollision.doctorName}) لديه موعد محجوز مسبقاً في نفس الوقت (${data.time} بتاريخ ${data.date}) مع المريض (${doctorCollision.patientName}).`;
    }

    if (trimmedPat) {
      const patientCollision = existingAppointments.find(
        (a) =>
          a.id !== currentAppointmentId &&
          a.status !== 'ملغى' &&
          a.status !== 'ملغية' &&
          a.date === data.date &&
          a.time === data.time &&
          a.patientName.trim().toLowerCase() === trimmedPat
      );

      if (patientCollision && !doctorCollision) {
        errors.time = `تعارض للمريض: المريض (${patientCollision.patientName}) لديه موعد آخر مسجل في نفس التوقيت (${data.time}) مع (${patientCollision.doctorName}).`;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

// 3. Clinical & Prescription Allergy & Safety Check
export interface PrescriptionCheckInput {
  medicineName: string;
  patientAllergies: string[];
  dosage?: string;
  frequency?: string;
}

export function checkDrugAllergyConflict(
  medicineName: string,
  patientAllergies: string[]
): { hasConflict: boolean; message?: string } {
  if (!medicineName || !patientAllergies || patientAllergies.length === 0) {
    return { hasConflict: false };
  }

  const medLower = medicineName.toLowerCase();
  const knownAllergies = patientAllergies.map((a) => a.toLowerCase().trim());

  // Known medical cross-sensitivities
  const allergyInteractions: Record<string, string[]> = {
    بنسلين: ['amoxicillin', 'amoxicil', 'augmentin', 'penicillin', 'أوجمنتين', 'أموكسيسيلين', 'بنسلين'],
    penicillin: ['amoxicillin', 'amoxicil', 'augmentin', 'penicillin', 'أوجمنتين', 'أموكسيسيلين', 'بنسلين'],
    سلفا: ['sulfa', 'bactrim', 'septra', 'سلفا', 'باكتريم'],
    sulfa: ['sulfa', 'bactrim', 'septra', 'سلفا', 'باكتريم'],
    أسبرين: ['aspirin', 'nsaid', 'ibuprofen', 'voltaren', 'diclofenac', 'أسبرين', 'فولتارين', 'بروفين'],
    aspirin: ['aspirin', 'nsaid', 'ibuprofen', 'voltaren', 'diclofenac', 'أسبرين', 'فولتارين', 'بروفين'],
  };

  for (const allergy of knownAllergies) {
    if (allergy === 'لا يوجد حساسية معروفة' || allergy === 'لا يوجد') continue;

    // Direct name match
    if (medLower.includes(allergy) || allergy.includes(medLower)) {
      return {
        hasConflict: true,
        message: `⚠️ تحذير سريري خطير: المريض يعاني من حساسية مسجلة تجاه (${allergy})، وهذا الدواء قد يسبب صدمة حساسية مفرطة!`,
      };
    }

    // Cross reference in cross-sensitivity dictionary
    for (const [key, relatedMeds] of Object.entries(allergyInteractions)) {
      if (allergy.includes(key)) {
        for (const related of relatedMeds) {
          if (medLower.includes(related)) {
            return {
              hasConflict: true,
              message: `⚠️ تحذير تداخل سريري: المريض لديه حساسية من (${allergy}) والتي تتعارض دوائياً مع مركب (${medicineName})!`,
            };
          }
        }
      }
    }
  }

  return { hasConflict: false };
}

// 4. Financial & Invoice Validation
export interface InvoiceFormInput {
  patientName: string;
  subtotal: number | string;
  insuranceCovered?: number | string;
  paymentMethod?: string;
  description?: string;
  status?: string;
}

export function validateInvoiceForm(data: InvoiceFormInput): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  if (!data.patientName || !data.patientName.trim()) {
    errors.patientName = 'يرجى اختيار أو إدخال اسم المريض لإصدار الفاتورة';
  }

  const sub = Number(data.subtotal);
  if (isNaN(sub) || sub < 0) {
    errors.subtotal = 'قيمة الفاتورة الأساسية يجب أن تكون رقماً موجباً ولا يمكن أن تكون سالبة';
  } else if (sub === 0) {
    warnings.subtotal = 'تنبيه: قيمة الفاتورة 0 ل.س (كشف مجاني أو معفى)';
  }

  const ins = Number(data.insuranceCovered || 0);
  if (isNaN(ins) || ins < 0) {
    errors.insuranceCovered = 'مبلغ التغطية التأمينية لا يمكن أن يكون سالباً';
  } else if (ins > sub * 1.15) {
    errors.insuranceCovered = 'خطأ مالي: مبلغ التغطية التأمينية لا يمكن أن يتجاوز إجمالي الفاتورة مع الضريبة!';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

// 5. Inventory Stock & Quantity Validation
export interface InventoryFormInput {
  itemName: string;
  category: string;
  quantity: number | string;
  unitPrice: number | string;
  minStockAlert?: number | string;
  expiryDate?: string;
}

export function validateInventoryForm(data: InventoryFormInput): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  if (!data.itemName || !data.itemName.trim()) {
    errors.itemName = 'اسم الصنف الطبي / الدواء إلزامي';
  }

  const qty = Number(data.quantity);
  if (isNaN(qty) || qty < 0) {
    errors.quantity = 'الكمية المتوفرة يجب أن تكون رقماً صحيحاً وموجباً';
  }

  const price = Number(data.unitPrice);
  if (isNaN(price) || price < 0) {
    errors.unitPrice = 'سعر الوحدة لا يمكن أن يكون رقماً سالباً';
  }

  const minAlert = Number(data.minStockAlert || 10);
  if (qty > 0 && qty <= minAlert) {
    warnings.quantity = `تنبيه: الكمية المدخلة (${qty}) أقل من أو تساوي حد الأمان الأدنى (${minAlert})!`;
  }

  if (data.expiryDate) {
    const today = new Date().toISOString().split('T')[0];
    if (data.expiryDate <= today) {
      errors.expiryDate = 'خطأ صيدلاني جسيم: تاريخ انتهاء الصلاحية منتهي ولا يمكن إضافة دواء منتهي الصلاحية!';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

// 6. Bed Allocation Validation
export function validateBedAllocation(
  bed: { id: string; bedNumber: string; status: string; wardName: string },
  patientId: string,
  existingBeds: Array<{ id: string; patientId?: string; bedNumber: string }>
): { isValid: boolean; error?: string } {
  if (bed.status === 'occupied') {
    return {
      isValid: false,
      error: `السرير رقم (${bed.bedNumber}) في جناح (${bed.wardName}) مشغول حالياً بمريض آخر ولا يمكن التسكين عليه.`,
    };
  }

  if (bed.status === 'cleaning' || bed.status === 'maintenance') {
    return {
      isValid: false,
      error: `السرير (${bed.bedNumber}) قيد التعقيم أو الصيانة الدورية. يرجى تجهيزه وتغيير حالته إلى "متاح" أولاً.`,
    };
  }

  const alreadyAssigned = existingBeds.find(
    (b) => b.patientId === patientId && b.id !== bed.id
  );
  if (alreadyAssigned) {
    return {
      isValid: false,
      error: `المريض مسكن مسبقاً على السرير (${alreadyAssigned.bedNumber})، يرجى إخلاء سريره السابق أولاً.`,
    };
  }

  return { isValid: true };
}
