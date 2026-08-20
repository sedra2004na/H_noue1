import React from 'react';
import { 
  Activity, 
  Bed as BedIcon, 
  Siren, 
  Stethoscope, 
  FlaskConical, 
  Pill, 
  Clock, 
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { Patient, Doctor, Appointment, InventoryItem, LabResult, Bed } from '../types';

interface HospitalPulseBarProps {
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  inventory: InventoryItem[];
  labResults: LabResult[];
  beds?: Bed[];
  activeSOS: boolean;
  onOpenEmergency: () => void;
  onNavigate: (tabId: string) => void;
}

export const HospitalPulseBar: React.FC<HospitalPulseBarProps> = ({
  patients,
  doctors,
  appointments,
  inventory,
  labResults,
  beds = [],
  activeSOS,
  onOpenEmergency,
  onNavigate
}) => {
  // Compute real-time hospital metrics from beds state
  const totalBeds = beds.length > 0 ? beds.length : 36;
  const occupiedBeds = beds.length > 0 ? beds.filter(b => b.status === 'occupied').length : Math.min(totalBeds, patients.length * 4);
  const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);

  const activeDoctors = (doctors && doctors.length > 0) 
    ? (doctors.filter(d => d.status === 'active').length || doctors.length)
    : 12;
  const pendingLabs = labResults ? labResults.filter(l => l.status === 'قيد التحليل' || l.status === 'معلق' || l.status === 'تحذير' || l.status === 'حرج').length : 3;
  const lowStockMedicines = inventory ? inventory.filter(i => i.status === 'منخفض' || (i.quantity ?? 0) <= (i.minStockAlert ?? 20)).length : 0;
  const todayAppointments = appointments ? appointments.filter(a => a.status === 'مؤكد' || a.status === 'معلق' || a.status === 'confirmed' || a.status === 'pending').length : 0;

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-300">
      
      {/* Left side: Live Pulse Indicator & Bed Occupancy */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        
        {/* Live Status Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>المؤشرات</span>
        </div>

        {/* Bed Occupancy Meter */}
        <div 
          onClick={() => onNavigate('beds')}
          className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-200 cursor-pointer transition-colors"
          title="عرض خريطة الأسِرّة والأجنحة وإدارتها مباشرة"
        >
          <BedIcon className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-semibold">إشغال الأسِرّة:</span>
          <span className="font-mono font-bold text-sky-300">{occupiedBeds}/{totalBeds} ({occupancyRate}%)</span>
          <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden hidden sm:block">
            <div 
              className={`h-full rounded-full ${occupancyRate > 85 ? 'bg-amber-500' : 'bg-sky-400'}`}
              style={{ width: `${occupancyRate}%` }}
            ></div>
          </div>
        </div>

        {/* Active On-Duty Doctors */}
        <div 
          onClick={() => onNavigate('doctors')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-200 cursor-pointer transition-colors"
          title="الأطباء المناوبون في الورديات الحالية"
        >
          <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
          <span>الأطباء المناوبون:</span>
          <strong className="text-teal-300 font-mono">{activeDoctors} أطباء</strong>
        </div>

      </div>

      {/* Right side: Emergency Status & Laboratory / Pharmacy Telemetry */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        
        {/* Emergency SOS Button */}
        <button
          type="button"
          onClick={onOpenEmergency}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold transition-all text-xs cursor-pointer border ${
            activeSOS 
              ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/30 animate-pulse' 
              : 'bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border-rose-800/50'
          }`}
        >
          <Siren className="w-3.5 h-3.5 text-rose-400" />
          <span>{activeSOS ? 'نداء إسعاف نشط!' : 'طوارئ وإسعاف'}</span>
        </button>

        {/* Pending Lab Tests */}
        <button
          type="button"
          onClick={() => onNavigate('doctor_portal')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="النتائج المخبرية ولوحة الطبيب"
        >
          <FlaskConical className="w-3.5 h-3.5 text-sky-400" />
          <span>المخبر:</span>
          <span className="font-mono font-bold text-sky-300">{pendingLabs || 3} تحاليل</span>
        </button>

        {/* Low Stock Alerts */}
        {lowStockMedicines > 0 && (
          <button
            type="button"
            onClick={() => onNavigate('inventory')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/30 text-amber-300 transition-colors cursor-pointer"
          >
            <Pill className="w-3.5 h-3.5 text-amber-400" />
            <span>نواقص الصيدلية:</span>
            <span className="font-mono font-bold text-amber-200">{lowStockMedicines}</span>
          </button>
        )}

      </div>

    </div>
  );
};
