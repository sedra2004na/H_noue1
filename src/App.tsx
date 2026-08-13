import React, { useState, useEffect } from 'react';
import { UserRole } from './types';
import { 
  mockPatients, 
  mockDoctors, 
  mockAppointments, 
  mockInventory, 
  mockLabResults, 
  mockPrescriptions, 
  mockInvoices, 
  mockShifts 
} from './data/mockData';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { PatientsSection } from './components/PatientsSection';
import { DoctorsSection } from './components/DoctorsSection';
import { AppointmentsSection } from './components/AppointmentsSection';
import { InventorySection } from './components/InventorySection';
import { LabPrescriptionsSection } from './components/LabPrescriptionsSection';
import { BillingSection } from './components/BillingSection';
import { LandingAndAuthScreen } from './components/LandingAndAuthScreen';
import { ToastContainer, ToastMessage } from './components/Toast';
import { EmergencyModal } from './components/EmergencyModal';

function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error(`Failed to load ${key} from localStorage`, err);
  }
  return defaultValue;
}

export function App() {
  // Navigation, Authentication & Role State with LocalStorage
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => getStoredData('syrian_hosp_isLoggedIn', false));
  const [activeTab, setActiveTab] = useState<string>(() => getStoredData('syrian_hosp_activeTab', 'dashboard'));
  const [userRole, setUserRole] = useState<UserRole>(() => getStoredData('syrian_hosp_userRole', 'admin'));
  const [searchQuery, setSearchQuery] = useState('');

  // Emergency SOS State
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [activeSOS, setActiveSOS] = useState<{
    id: string;
    patientName: string;
    condition: string;
    roomName: string;
    time: string;
    status: 'active' | 'responding' | 'resolved';
  } | null>(null);

  const handleTriggerSOS = (patientName: string, condition: string, roomName: string) => {
    setActiveSOS({
      id: 'sos-' + Date.now(),
      patientName,
      condition,
      roomName,
      time: new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }),
      status: 'active',
    });
  };

  const handleResolveSOS = () => {
    setActiveSOS(null);
  };
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastMessage['type'] = 'success') => {
    const newToast: ToastMessage = {
      id: 't-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      message,
      type,
    };
    setToasts(prev => [...prev, newToast]);
  };

  const handleCloseToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Domain Data State initialized from LocalStorage (persists deletions, additions, edits)
  const [patients, setPatients] = useState(() => getStoredData('syrian_hosp_patients', mockPatients));
  const [doctors, setDoctors] = useState(() => getStoredData('syrian_hosp_doctors', mockDoctors));
  const [appointments, setAppointments] = useState(() => getStoredData('syrian_hosp_appointments', mockAppointments));
  const [inventory, setInventory] = useState(() => getStoredData('syrian_hosp_inventory', mockInventory));
  const [labResults, setLabResults] = useState(() => getStoredData('syrian_hosp_labResults', mockLabResults));
  const [prescriptions, setPrescriptions] = useState(() => getStoredData('syrian_hosp_prescriptions', mockPrescriptions));
  const [invoices, setInvoices] = useState(() => getStoredData('syrian_hosp_invoices', mockInvoices));
  const [shifts, setShifts] = useState(() => getStoredData('syrian_hosp_shifts', mockShifts));

  // Auto-switch away from restricted tabs when userRole or activeTab changes
  useEffect(() => {
    const roleTabsMap = {
      admin: ['dashboard', 'patients', 'doctors', 'appointments', 'inventory', 'lab', 'billing'],
      doctor: ['dashboard', 'patients', 'doctors', 'appointments', 'lab'],
      staff: ['dashboard', 'patients', 'appointments', 'inventory', 'billing'],
      patient: ['dashboard', 'appointments', 'lab', 'billing'],
    };
    const allowed = roleTabsMap[userRole] || roleTabsMap.admin;
    if (!allowed.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [userRole, activeTab]);

  useEffect(() => { localStorage.setItem('syrian_hosp_patients', JSON.stringify(patients)); }, [patients]);
  useEffect(() => { localStorage.setItem('syrian_hosp_doctors', JSON.stringify(doctors)); }, [doctors]);
  useEffect(() => { localStorage.setItem('syrian_hosp_appointments', JSON.stringify(appointments)); }, [appointments]);
  useEffect(() => { localStorage.setItem('syrian_hosp_inventory', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('syrian_hosp_labResults', JSON.stringify(labResults)); }, [labResults]);
  useEffect(() => { localStorage.setItem('syrian_hosp_prescriptions', JSON.stringify(prescriptions)); }, [prescriptions]);
  useEffect(() => { localStorage.setItem('syrian_hosp_invoices', JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem('syrian_hosp_shifts', JSON.stringify(shifts)); }, [shifts]);

  // Handlers for Patient Management
  const handleAddPatient = (patientData: any) => {
    const newPatient = {
      id: 'p-' + (patients.length + 1),
      fileNumber: 'MED-' + Math.floor(100000 + Math.random() * 900000),
      lastVisitDate: new Date().toISOString().split('T')[0],
      createdDate: new Date().toISOString().split('T')[0],
      status: 'active' as const,
      ...patientData,
    };
    setPatients([newPatient, ...patients]);
    showToast(`تم إضافة المريض (${newPatient.fullName}) لشبكة الرعاية بنجاح`, 'success');
  };

  const handleUpdatePatient = (id: string, data: any) => {
    setPatients(patients.map(p => p.id === id ? { ...p, ...data } : p));
    showToast('تم تحديث بيانات ملف المريض بنجاح', 'info');
  };

  const handleDeletePatient = (id: string) => {
    const target = patients.find(p => p.id === id);
    setPatients(patients.filter(p => p.id !== id));
    showToast(`تم حذف ملف المريض (${target?.fullName || id}) بنجاح`, 'warning');
  };

  // Handlers for Doctors & Status
  const handleAddDoctor = (doctorData: any) => {
    const newDoc = {
      id: 'doc-' + (doctors.length + 1),
      ...doctorData,
    };
    setDoctors([newDoc, ...doctors]);

    // Automatically create a default shift entry for the new doctor
    const newShift = {
      id: 's-' + (shifts.length + 1),
      doctorId: newDoc.id,
      doctorName: newDoc.name,
      shiftType: newDoc.shift || 'صباحي',
      timeRange: newDoc.shift === 'مسائي' ? '04:00 م - 12:00 م' : newDoc.shift === 'ليلي' ? '12:00 م - 08:00 ص' : '08:00 ص - 04:00 م',
      department: newDoc.department,
      days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
    };
    setShifts([newShift, ...shifts]);

    showToast(`تم انضمام الطبيب (${newDoc.name}) للكادر الطبي بنجاح`, 'success');
  };

  const handleToggleDoctorStatus = (id: string, newStatus: any) => {
    setDoctors(doctors.map(d => d.id === id ? { ...d, status: newStatus } : d));
    showToast('تم تحديث حالة تواجد الطبيب المباشر', 'info');
  };

  const handleDeleteDoctor = (id: string) => {
    const target = doctors.find(d => d.id === id);
    setDoctors(doctors.filter(d => d.id !== id));
    showToast(`تم حذف سجل الطبيب (${target?.name || id}) بنجاح`, 'warning');
  };

  // Handlers for Appointments
  const handleAddAppointment = (aptData: any) => {
    const newApt = {
      id: 'apt-' + (appointments.length + 1),
      status: 'مؤكد' as const,
      createdDate: new Date().toISOString().split('T')[0],
      ...aptData,
    };
    setAppointments([newApt, ...appointments]);
    showToast('تم حجز وتأكيد الموعد الطبي بنجاح', 'success');
  };

  const handleUpdateAppointmentStatus = (id: string, status: any) => {
    setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a));
    showToast(`تم تحديث حالة الموعد إلى (${status})`, 'info');
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments(appointments.filter(a => a.id !== id));
    showToast('تم إلغاء وحذف الموعد الطبي فوراً', 'error');
  };

  // Handlers for Inventory
  const handleAddInventoryItem = (itemData: any) => {
    const newItem = {
      id: 'inv-' + (inventory.length + 1),
      status: 'متوفر' as const,
      ...itemData,
    };
    setInventory([newItem, ...inventory]);
    showToast(`تم إضافة الصنف الصيدلاني (${newItem.itemName}) إلى المستودع`, 'success');
  };

  const handleDeleteInventoryItem = (id: string) => {
    const target = inventory.find(i => i.id === id);
    setInventory(inventory.filter(i => i.id !== id));
    showToast(`تم إزالة الصنف (${target?.itemName || id}) من قائمة الصيدلية`, 'warning');
  };

  // Handlers for Lab & Prescriptions
  const handleAddLabResult = (labData: any) => {
    const newLab = {
      id: 'lab-' + (labResults.length + 1),
      testDate: new Date().toISOString().split('T')[0],
      ...labData,
    };
    setLabResults([newLab, ...labResults]);
    showToast('تم إدخال نتيجة التحليل المخبري وتوثيقها', 'success');
  };

  const handleDeleteLabResult = (id: string) => {
    setLabResults(labResults.filter(l => l.id !== id));
    showToast('تم حذف سجل التحليل المخبري', 'warning');
  };

  const handleAddPrescription = (rxData: any) => {
    const newRx = {
      id: 'RX-' + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString().split('T')[0],
      status: 'نشطة' as const,
      ...rxData,
    };
    setPrescriptions([newRx, ...prescriptions]);
    showToast('تم إصدار الوصفة الطبية الإلكترونية بنجاح', 'success');
  };

  const handleDeletePrescription = (id: string) => {
    setPrescriptions(prescriptions.filter(r => r.id !== id));
    showToast('تم حذف الوصفة الطبية بنجاح', 'warning');
  };

  // Handlers for Invoices
  const handleAddInvoice = (invData: any) => {
    const subtotal = invData.subtotal || 100;
    const tax = Math.round(subtotal * 0.15);
    const insuranceCovered = invData.insuranceCovered || 0;
    const netAmount = (subtotal + tax) - insuranceCovered;

    const newInv = {
      id: 'inv-' + (invoices.length + 1),
      invoiceNumber: 'INV-2026-' + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString().split('T')[0],
      tax,
      netAmount,
      ...invData,
    };
    setInvoices([newInv, ...invoices]);
    showToast(`تم إصدار الفاتورة (${newInv.invoiceNumber}) بنجاح`, 'success');
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices(invoices.filter(i => i.id !== id));
    showToast('تم إلغاء وحذف الفاتورة المالية', 'warning');
  };

  // Badge counts calculations for sidebar
  const pendingAppointmentsCount = appointments.filter(a => a.status === 'معلق' || a.status === 'مؤكد').length;
  const lowInventoryCount = inventory.filter(i => i.status === 'منخفض' || i.quantity <= i.minStockAlert).length;
  const criticalLabCount = labResults.filter(l => l.status === 'حرج').length;

  if (!isLoggedIn) {
    return (
      <LandingAndAuthScreen
        onLogin={(role) => {
          setUserRole(role);
          setIsLoggedIn(true);
          setActiveTab('dashboard');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans dir-rtl" dir="rtl">
      
      {/* Top Navigation Header */}
      <Header
        userRole={userRole}
        onRoleChange={(newRole) => {
          setUserRole(newRole);
          // Auto-switch to dashboard if active tab is restricted for the new role
          const roleTabsMap = {
            admin: ['dashboard', 'patients', 'doctors', 'appointments', 'inventory', 'lab', 'billing'],
            doctor: ['dashboard', 'patients', 'doctors', 'appointments', 'lab'],
            staff: ['dashboard', 'patients', 'appointments', 'inventory', 'billing'],
            patient: ['dashboard', 'appointments', 'lab', 'billing'],
          };
          const allowed = roleTabsMap[newRole] || roleTabsMap.admin;
          if (!allowed.includes(activeTab)) {
            setActiveTab('dashboard');
          }
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNavigate={setActiveTab}
        lowStockCount={lowInventoryCount}
        criticalLabCount={criticalLabCount}
        onOpenEmergencyModal={() => setShowEmergencyModal(true)}
        hasActiveSOS={!!activeSOS}
      />

      {/* Main Body with Sidebar + Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Right Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userRole={userRole}
          onLogout={() => setIsLoggedIn(false)}
          patientsCount={patients.length}
          doctorsCount={doctors.length}
          appointmentsCount={pendingAppointmentsCount}
          inventoryAlertsCount={lowInventoryCount}
        />

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          
          {activeTab === 'dashboard' && (
            <Dashboard
              userRole={userRole}
              patients={patients}
              doctors={doctors}
              appointments={appointments}
              inventory={inventory}
              invoices={invoices}
              onNavigate={setActiveTab}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              onDeleteAppointment={handleDeleteAppointment}
            />
          )}

          {activeTab === 'patients' && (
            <PatientsSection
              userRole={userRole}
              patients={patients}
              onAddPatient={handleAddPatient}
              onUpdatePatient={handleUpdatePatient}
              onDeletePatient={handleDeletePatient}
              searchQuery={searchQuery}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'doctors' && (
            <DoctorsSection
              userRole={userRole}
              doctors={doctors}
              shifts={shifts}
              onToggleStatus={handleToggleDoctorStatus}
              onDeleteDoctor={handleDeleteDoctor}
              onAddDoctor={handleAddDoctor}
            />
          )}

          {activeTab === 'appointments' && (
            <AppointmentsSection
              userRole={userRole}
              appointments={appointments}
              patients={patients}
              doctors={doctors}
              onAddAppointment={handleAddAppointment}
              onUpdateStatus={handleUpdateAppointmentStatus}
              onDeleteAppointment={handleDeleteAppointment}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === 'inventory' && (
            <InventorySection
              userRole={userRole}
              inventory={inventory}
              onAddItem={handleAddInventoryItem}
              onDeleteItem={handleDeleteInventoryItem}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === 'lab' && (
            <LabPrescriptionsSection
              userRole={userRole}
              labResults={labResults}
              prescriptions={prescriptions}
              patients={patients}
              doctors={doctors}
              onAddLabResult={handleAddLabResult}
              onAddPrescription={handleAddPrescription}
              onDeleteLabResult={handleDeleteLabResult}
              onDeletePrescription={handleDeletePrescription}
            />
          )}

          {activeTab === 'billing' && (
            <BillingSection
              userRole={userRole}
              invoices={invoices}
              patients={patients}
              onAddInvoice={handleAddInvoice}
              onDeleteInvoice={handleDeleteInvoice}
            />
          )}

        </main>

      </div>

      {/* Floating Toast Alerts Container */}
      <ToastContainer toasts={toasts} onCloseToast={handleCloseToast} />

      {/* Emergency Modal */}
      <EmergencyModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        userRole={userRole}
        doctors={doctors}
        patients={patients}
        activeSOS={activeSOS}
        onTriggerSOS={handleTriggerSOS}
        onResolveSOS={handleResolveSOS}
        onShowToast={showToast}
      />

    </div>
  );
}

export default App;
