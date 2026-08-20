import React, { useState } from 'react';
import { Doctor, Shift, UserRole } from '../types';
import { 
  UserCheck, 
  Stethoscope, 
  Clock, 
  Search, 
  Star, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Phone,
  Mail,
  Trash2,
  Plus,
  LayoutGrid,
  List
} from 'lucide-react';

interface DoctorsSectionProps {
  userRole?: UserRole;
  doctors: Doctor[];
  shifts: Shift[];
  onToggleStatus: (id: string, newStatus: Doctor['status']) => void;
  onDeleteDoctor?: (id: string) => void;
  onAddDoctor?: (doctor: Partial<Doctor>) => void;
  onNavigate?: (tab: string) => void;
  onSelectDoctorForBooking?: (doctor: Doctor) => void;
}

export const DoctorsSection: React.FC<DoctorsSectionProps> = ({
  userRole = 'admin',
  doctors,
  shifts,
  onToggleStatus,
  onDeleteDoctor,
  onAddDoctor,
  onNavigate,
  onSelectDoctorForBooking,
}) => {
  const canManageDoctors = userRole === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [activeTab, setActiveTab] = useState<'doctors' | 'shifts'>('doctors');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newDocData, setNewDocData] = useState({
    name: '',
    specialty: 'طب باطني',
    department: 'قسم الباطنية العام',
    experienceYears: 5,
    consultingFee: 25000,
    phone: '0933123456',
    roomNumber: 'B-101',
    shift: 'صباحي',
    email: '',
    password: '',
  });

  const handleAddDoctorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocData.name) return;

    const formattedName = newDocData.name.startsWith('د.') ? newDocData.name : `د. ${newDocData.name}`;

    // If an email and password were provided, automatically register the doctor account
    if (newDocData.email && newDocData.password) {
      try {
        const saved = localStorage.getItem('syrian_hosp_accounts');
        const accounts = saved ? JSON.parse(saved) : {};
        const cleanEmail = newDocData.email.trim().toLowerCase();
        accounts[cleanEmail] = {
          role: 'doctor',
          name: formattedName,
          pass: newDocData.password.trim(),
          registeredAt: new Date().toISOString(),
        };
        localStorage.setItem('syrian_hosp_accounts', JSON.stringify(accounts));
      } catch (err) {
        console.error('Failed to create doctor login account', err);
      }
    }

    if (onAddDoctor) {
      onAddDoctor({
        name: formattedName,
        specialty: newDocData.specialty,
        department: newDocData.department,
        experienceYears: Number(newDocData.experienceYears),
        consultingFee: Number(newDocData.consultingFee),
        phone: newDocData.phone,
        roomNumber: newDocData.roomNumber,
        shift: newDocData.shift,
        status: 'active',
        rating: 5.0,
      });
    }

    setShowAddModal(false);
    setNewDocData({
      name: '',
      specialty: 'طب باطني',
      department: 'قسم الباطنية العام',
      experienceYears: 5,
      consultingFee: 25000,
      phone: '0933123456',
      roomNumber: 'B-101',
      shift: 'صباحي',
      email: '',
      password: '',
    });
  };

  const specialties = Array.from(new Set(doctors.map((d) => d.specialty)));

  // Calculate doctor counts per specialty
  const specialtyDistribution = specialties.map((sp) => {
    const docs = doctors.filter((d) => d.specialty === sp);
    const activeCount = docs.filter((d) => d.status === 'active').length;
    return {
      specialty: sp,
      count: docs.length,
      activeCount,
      department: docs[0]?.department || 'القسم التخصصي',
      doctors: docs
    };
  });

  const activeDoctorsCount = doctors.filter(d => d.status === 'active').length;

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecialty = selectedSpecialty === 'all' || doc.specialty === selectedSpecialty;

    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Main Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">إدارة الكادر الطبي وتوزيع الاختصاصات</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                توزيع استشاريي وأخصائيي المشفى على الأقسام والورديات السريرية
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher & Add Doctor Action */}
        <div className="flex flex-wrap items-center gap-3">
          {canManageDoctors && onAddDoctor && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة طبيب لاختصاص</span>
            </button>
          )}

          <div className="flex items-center p-1 bg-slate-800 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('doctors')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'doctors' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              دليل الأطباء ({doctors.length})
            </button>
            <button
              onClick={() => setActiveTab('shifts')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'shifts' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              جدول المناوبات ({shifts.length})
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">إجمالي الأطباء</span>
          <p className="text-xl font-black text-white mt-1">{doctors.length} طبيب</p>
          <span className="text-[10px] text-sky-400 font-semibold">استشاري وأخصائي</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">الاختصاصات الطبية</span>
          <p className="text-xl font-black text-white mt-1">{specialties.length} تخصص</p>
          <span className="text-[10px] text-teal-400 font-semibold">مغطاة بالكامل</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">الأطباء على رأس العمل</span>
          <p className="text-xl font-black text-emerald-400 mt-1">{activeDoctorsCount} طبيب</p>
          <span className="text-[10px] text-emerald-400/80 font-semibold">جاهزية واستقبال</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">تغطية الورديات</span>
          <p className="text-xl font-black text-sky-300 mt-1">100%</p>
          <span className="text-[10px] text-slate-400 font-semibold">صباحي / مسائي / ليلي</span>
        </div>
      </div>

      {/* Specialty Breakdown Matrix Card (توزيع الأطباء حسب الاختصاص) */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">توزيع الكادر الطبي حسب الاختصاصات (Doctors per Specialty)</h3>
          </div>
          {selectedSpecialty !== 'all' && (
            <button
              onClick={() => setSelectedSpecialty('all')}
              className="text-xs text-sky-400 hover:underline font-semibold"
            >
              عرض كافة الاختصاصات &larr;
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
          {specialtyDistribution.map((item) => {
            const isSelected = selectedSpecialty === item.specialty;
            return (
              <button
                key={item.specialty}
                onClick={() => setSelectedSpecialty(isSelected ? 'all' : item.specialty)}
                className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                  isSelected 
                    ? 'bg-sky-950/60 border-sky-500 shadow-md text-white ring-1 ring-sky-500/50' 
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/70 text-slate-200 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-xs text-white leading-tight line-clamp-1">{item.specialty}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                    isSelected ? 'bg-sky-500 text-white' : 'bg-slate-700 text-sky-300'
                  }`}>
                    {item.count} {item.count === 1 ? 'طبيب' : 'أطباء'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="line-clamp-1">{item.department}</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3 inline" /> نشط ({item.activeCount})
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'doctors' ? (
        <>
          {/* Search Bar & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative sm:col-span-2">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث باسم الطبيب، التخصص، أو رقم العيادة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                />
              </div>

              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="all">كافة الاختصاصات الطبية ({doctors.length} طبيب)</option>
                {specialties.map((sp) => {
                  const count = doctors.filter(d => d.specialty === sp).length;
                  return (
                    <option key={sp} value={sp}>{sp} ({count} {count === 1 ? 'طبيب' : 'أطباء'})</option>
                  );
                })}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="عرض البطاقات (Cards View)"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">كروت</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="عرض الجدول الشامل (Table View)"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">جدول</span>
              </button>
            </div>
          </div>

          {/* DOCTORS CONTENT: GRID OR TABLE */}
          {viewMode === 'grid' ? (
            /* Doctors Grid Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDoctors.map((doc) => (
                <div key={doc.id} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 hover:border-sky-500/40 transition-all flex flex-col justify-between group">
                  
                  {/* Top Info */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                          {doc.name.charAt(3) || 'د'}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white">{doc.name}</h3>
                          <p className="text-xs text-sky-400 font-medium">{doc.specialty}</p>
                        </div>
                      </div>

                      {/* Status & Delete Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onToggleStatus(doc.id, doc.status === 'active' ? 'on_leave' : 'active')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                            doc.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                          }`}
                          title="انقر لتبديل حالة دوام الطبيب (نشط / إجازة)"
                        >
                          {doc.status === 'active' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>نشط</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              <span>إجازة</span>
                            </>
                          )}
                        </button>

                        {onDeleteDoctor && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteDoctor(doc.id);
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all cursor-pointer"
                            title="حذف الطبيب من النظام"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Doctor Details */}
                    <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">القسم والعيادة:</span>
                        <span className="font-bold text-slate-200">{doc.department} ({doc.roomNumber})</span>
                      </div>

                      {doc.clinicHours && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">ساعات العيادة الخارجية:</span>
                          <span className="font-bold text-sky-300">{doc.clinicHours}</span>
                        </div>
                      )}

                      {doc.clinicDays && doc.clinicDays.length > 0 && (
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-slate-400 shrink-0">أيام المعاينة:</span>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {doc.clinicDays.map((day, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                                {day}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">رسوم الاستشارة:</span>
                        <span className="font-bold text-emerald-400 font-mono">{doc.consultingFee.toLocaleString('ar-SY')} ل.س</span>
                      </div>

                      {doc.availableServices && doc.availableServices.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/60">
                          <span className="text-[11px] text-slate-400 block mb-1.5">الخدمات والإجراءات الطبية بالعيادة:</span>
                          <div className="flex flex-wrap gap-1">
                            {doc.availableServices.slice(0, 3).map((srv, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px]">
                                {srv}
                              </span>
                            ))}
                            {doc.availableServices.length > 3 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px]">
                                +{doc.availableServices.length - 3} أخرى
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rating & Action */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span>{doc.rating} / 5.0</span>
                    </div>

                    <button
                      onClick={() => {
                        if (onSelectDoctorForBooking) {
                          onSelectDoctorForBooking(doc);
                        } else if (onNavigate) {
                          onNavigate('appointments');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>حجز موعد بالعيادة</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            /* Doctors Modern Data Table View */
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs text-slate-300">
                  <thead className="bg-slate-800 text-slate-400 font-bold border-b border-slate-700">
                    <tr>
                      <th className="p-4">اسم الطبيب</th>
                      <th className="p-4">التخصص والدرجة</th>
                      <th className="p-4">القسم والعيادة</th>
                      <th className="p-4">الخبرة</th>
                      <th className="p-4">كشفية الاستشارة</th>
                      <th className="p-4">الوردية</th>
                      <th className="p-4">التقييم</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredDoctors.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-sky-600/20 text-sky-400 flex items-center justify-center font-bold text-xs border border-sky-500/30">
                              {doc.name.charAt(3) || 'د'}
                            </div>
                            <div>
                              <strong className="text-white block font-bold">{doc.name}</strong>
                              <span className="text-[11px] text-slate-400 font-mono">{doc.phone}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 font-semibold text-sky-300">{doc.specialty}</td>
                        <td className="p-4 text-slate-300">{doc.department} ({doc.roomNumber})</td>
                        <td className="p-4 font-semibold text-slate-200">{doc.experienceYears} سنوات</td>
                        <td className="p-4 font-mono font-bold text-emerald-400">{doc.consultingFee.toLocaleString('ar-SY')} ل.س</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px]">
                            {doc.shift}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-amber-400 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{doc.rating}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => onToggleStatus(doc.id, doc.status === 'active' ? 'on_leave' : 'active')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                              doc.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {doc.status === 'active' ? 'نشط' : 'إجازة'}
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          {onDeleteDoctor && (
                            <button
                              type="button"
                              onClick={() => onDeleteDoctor(doc.id)}
                              className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all cursor-pointer"
                              title="حذف الطبيب"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Shifts Schedule View */
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-200">تنظيم جدول مناوبات الأطباء (Hospital Shift Roster)</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-slate-300">
              <thead className="bg-slate-800 text-slate-400 font-bold border-b border-slate-700">
                <tr>
                  <th className="p-4">الطبيب المناوب</th>
                  <th className="p-4">نوع المناوبة</th>
                  <th className="p-4">التوقيت والتغطية</th>
                  <th className="p-4">القسم الطبي</th>
                  <th className="p-4">أيام الدوام المحددة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {shifts.map((sh) => (
                  <tr key={sh.id} className="hover:bg-slate-800/50">
                    <td className="p-4 font-bold text-white">{sh.doctorName}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md font-bold text-[11px] ${
                        sh.shiftType === 'صباحي' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                        sh.shiftType === 'مسائي' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}>
                        مناوبة {sh.shiftType}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-300">{sh.timeRange}</td>
                    <td className="p-4 text-slate-200">{sh.department}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {sh.days.map((day, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] text-slate-300">
                            {day}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-2xl border border-sky-500/30">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-white">إضافة طبيب / استشاري جديد</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDoctorSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم الطبيب الكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: د. خالد إبراهيم السعيد"
                  value={newDocData.name}
                  onChange={(e) => setNewDocData({ ...newDocData, name: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">الاختصاص الطبي *</label>
                  <select
                    value={newDocData.specialty}
                    onChange={(e) => {
                      const sp = e.target.value;
                      let dept = newDocData.department;
                      let room = newDocData.roomNumber;
                      if (sp === 'أمراض القلب والشرايين') { dept = 'قسم القلب والأوعية الدموية'; room = 'عيادة 201'; }
                      else if (sp === 'جراحة العظام والمفاصل') { dept = 'قسم العظام والكسور'; room = 'عيادة 105'; }
                      else if (sp === 'طب الأطفال وحديثي الولادة') { dept = 'قسم الأطفال والخدج'; room = 'عيادة 302'; }
                      else if (sp === 'الأمراض الباطنية والسكري') { dept = 'قسم الباطنية العام'; room = 'عيادة 108'; }
                      else if (sp === 'الجراحة العامة والمناظير') { dept = 'قسم الجراحة العامة'; room = 'عيادة 101'; }
                      else if (sp === 'طب النساء والتوليد') { dept = 'قسم النساء والولادة'; room = 'عيادة 305'; }
                      else if (sp === 'أمراض وجراحة العيون') { dept = 'قسم طب العيون'; room = 'عيادة 204'; }
                      else if (sp === 'أمراض الأنف والأذن والحنجرة') { dept = 'قسم الأذن والأنف والحنجرة (ENT)'; room = 'عيادة 206'; }
                      else if (sp === 'الأمراض الجلدية والتجميل') { dept = 'قسم الجلدية'; room = 'عيادة 401'; }
                      else if (sp === 'الأشعة والتصوير الطبي') { dept = 'قسم الأشعة والتشخيص المقطعي'; room = 'جناح الأشعة R-1'; }
                      else if (sp === 'التخدير والعناية المشددة') { dept = 'قسم العناية المركزة والتخدير (ICU)'; room = 'غرفة الإنعاش ICU-01'; }
                      else if (sp === 'طب وجراحة الفم والأسنان') { dept = 'قسم طب وجراحة الأسنان'; room = 'عيادة الأسنان D-1'; }
                      setNewDocData({ ...newDocData, specialty: sp, department: dept, roomNumber: room });
                    }}
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="أمراض القلب والشرايين">أمراض القلب والشرايين (Cardiology)</option>
                    <option value="جراحة العظام والمفاصل">جراحة العظام والمفاصل (Orthopedics)</option>
                    <option value="طب الأطفال وحديثي الولادة">طب الأطفال وحديثي الولادة (Pediatrics)</option>
                    <option value="الأمراض الباطنية والسكري">الأمراض الباطنية والسكري (Internal Medicine)</option>
                    <option value="الجراحة العامة والمناظير">الجراحة العامة والمناظير (General Surgery)</option>
                    <option value="طب النساء والتوليد">طب النساء والتوليد (OB/GYN)</option>
                    <option value="أمراض وجراحة العيون">أمراض وجراحة العيون (Ophthalmology)</option>
                    <option value="أمراض الأنف والأذن والحنجرة">أمراض الأنف والأذن والحنجرة (ENT)</option>
                    <option value="الأمراض الجلدية والتجميل">الأمراض الجلدية والتجميل (Dermatology)</option>
                    <option value="الأشعة والتصوير الطبي">الأشعة والتصوير الطبي (Radiology)</option>
                    <option value="التخدير والعناية المشددة">التخدير والعناية المشددة (ICU & Anesthesia)</option>
                    <option value="طب وجراحة الفم والأسنان">طب وجراحة الفم والأسنان (Dentistry)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">القسم بالمستشفى</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: قسم الجراحة العامة"
                    value={newDocData.department}
                    onChange={(e) => setNewDocData({ ...newDocData, department: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">سنوات الخبرة</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newDocData.experienceYears}
                    onChange={(e) => setNewDocData({ ...newDocData, experienceYears: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">رسوم الاستشارة (ل.س)</label>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    value={newDocData.consultingFee}
                    onChange={(e) => setNewDocData({ ...newDocData, consultingFee: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم العيادة / الغرفة</label>
                  <input
                    type="text"
                    value={newDocData.roomNumber}
                    onChange={(e) => setNewDocData({ ...newDocData, roomNumber: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">الشفت / الدوام</label>
                  <select
                    value={newDocData.shift}
                    onChange={(e) => setNewDocData({ ...newDocData, shift: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="صباحي">صباحي (08:00 - 16:00)</option>
                    <option value="مسائي">مسائي (16:00 - 00:00)</option>
                    <option value="ليلي">ليلي (00:00 - 08:00)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رقم الهاتف للتواصل</label>
                <input
                  type="text"
                  value={newDocData.phone}
                  onChange={(e) => setNewDocData({ ...newDocData, phone: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Login Account Details for Doctor */}
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                <p className="text-[11px] font-bold text-sky-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>بيانات تسجيل الدخول لحساب الطبيب (اختياري)</span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">البريد الإلكتروني</label>
                    <input
                      type="email"
                      placeholder="doctor@hospital.com"
                      value={newDocData.email}
                      onChange={(e) => setNewDocData({ ...newDocData, email: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">كلمة المرور</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={newDocData.password}
                      onChange={(e) => setNewDocData({ ...newDocData, password: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition-colors shadow-lg shadow-sky-600/30"
                >
                  حفظ إضافة الطبيب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
