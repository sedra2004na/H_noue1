import React, { useState } from 'react';
import { HospitalLogo } from './HospitalLogo';
import { 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  Stethoscope, 
  UserCheck, 
  UserCircle2, 
  Mail, 
  Lock, 
  User as UserIcon, 
  HeartPulse,
  Pill,
  Calendar,
  Users,
  Home
} from 'lucide-react';
import { UserRole } from '../types';

interface LandingAndAuthScreenProps {
  onLogin: (role: UserRole, userName?: string) => void;
}

export const LandingAndAuthScreen: React.FC<LandingAndAuthScreenProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<'landing' | 'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(selectedRole, fullName || undefined);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between dir-rtl font-sans selection:bg-sky-500 selection:text-white" dir="rtl">
      
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-1/3 w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Hospital Name */}
          <div 
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <HospitalLogo size="md" />
            <div>
              <h1 className="text-lg font-black text-white tracking-wide group-hover:text-sky-400 transition-colors">مشفى النور</h1>
              <p className="text-[11px] text-slate-400">النظام الطبي الموحد لإدارة الرعاية الصحيّة</p>
            </div>
          </div>

          {/* Unified Clean Header Navigation Bar */}
          <nav className="flex items-center gap-1 bg-slate-950/90 p-1.5 rounded-full border border-slate-800/80 shadow-lg">
            <button
              onClick={() => setActiveTab('landing')}
              className="px-4 py-2 rounded-full text-xs font-bold bg-sky-600 text-white shadow-md shadow-sky-900/50 border border-sky-400/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>الرئيسية</span>
            </button>
          </nav>

        </div>
      </header>

      {/* Main Screen Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center relative z-10">
        
        {/* LANDING PAGE VIEW */}
        {activeTab === 'landing' && (
          <div className="w-full space-y-12 my-auto">
            
            {/* Hero Main Banner */}
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold">
                <HeartPulse className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>نظام إدارة المشافي والعيادات الموحد</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
                منظومة <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400">مشفى النور الطبية</span>
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                منظومة إلكترونية متكاملة لربط إدارة المرضى، الأطباء، جدولة المواعيد، الصيدلية، المختبر، والفواتير بمرونة وسهولة كاملة.
              </p>

              {/* Action Button */}
              <div className="flex items-center justify-center pt-2">
                <button
                  onClick={() => setActiveTab('login')}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-sky-950/80 border border-sky-400/40 transition-all hover:scale-105 flex items-center justify-center gap-3 cursor-pointer"
                >
                  <LogIn className="w-5 h-5" />
                  <span>الانتقال لبوابة الدخول</span>
                </button>
              </div>
            </div>

            {/* Quick Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto pt-4">
              
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm mb-1">إدارة المرضى والملفات</h3>
                <p className="text-xs text-slate-400 leading-relaxed">سجلات مرضية شاملة، تشخيصات حية وتاريخ طبي محفوظ.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm mb-1">جدول المواعيد والمناوبات</h3>
                <p className="text-xs text-slate-400 leading-relaxed">تراسل دقيق وحجوزات فورية مع الأطباء والأقسام المختصة.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                  <Pill className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm mb-1">الصيدلية والتحاليل</h3>
                <p className="text-xs text-slate-400 leading-relaxed">تنبيهات لنقص الأدوية والنتائج الطبية المخبرية الحرجّة.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm mb-1">صلاحيات آمنة (RBAC)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">دخول مخصص لكل صفة: مدير، طبيب، موظف استقبال ومريض.</p>
              </div>

            </div>

          </div>
        )}

        {/* AUTH FORM CARD (LOGIN OR REGISTER) */}
        {(activeTab === 'login' || activeTab === 'register') && (
          <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 my-auto relative">
            
            {/* Official Logo Displayed Prominently at top of Form Card */}
            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-800/80 mb-6">
              <HospitalLogo size="xl" />
              <h2 className="text-2xl font-black text-white mt-3">مشفى النور الطبي</h2>
              <p className="text-xs text-slate-400 mt-1">
                {activeTab === 'login' 
                  ? 'تسجيل الدخول إلى بوابّة النظام الموحد' 
                  : 'إنشاء حساب مستخدم جديد في النظام'}
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {activeTab === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">الاسم الكامل *</label>
                  <div className="relative">
                    <UserIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="أدخل الاسم الرباعي الكامل..."
                      required
                      className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم المستخدم / البريد الإلكتروني *</label>
                <div className="relative">
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="أدخل البريد الإلكتروني أو اسم المستخدم..."
                    required
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">كلمة المرور *</label>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور..."
                    required
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>

              {/* Role Selection Option */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">اختر الصفة الوظيفية للدخول:</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  
                  <button
                    type="button"
                    onClick={() => setSelectedRole('admin')}
                    className={`p-3 rounded-xl border text-right transition-all flex items-center gap-2.5 cursor-pointer ${
                      selectedRole === 'admin'
                        ? 'bg-purple-950/80 border-purple-500/80 text-purple-200 ring-1 ring-purple-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <span className="block font-bold">مدير النظام</span>
                      <span className="text-[10px] text-slate-400">تحكم كامل بالنظام</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('doctor')}
                    className={`p-3 rounded-xl border text-right transition-all flex items-center gap-2.5 cursor-pointer ${
                      selectedRole === 'doctor'
                        ? 'bg-blue-950/80 border-blue-500/80 text-blue-200 ring-1 ring-blue-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <span className="block font-bold">طبيب معالج</span>
                      <span className="text-[10px] text-slate-400">تشخيص ومواعيد ووصفات</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('staff')}
                    className={`p-3 rounded-xl border text-right transition-all flex items-center gap-2.5 cursor-pointer ${
                      selectedRole === 'staff'
                        ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200 ring-1 ring-emerald-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="block font-bold">موظف استقبال</span>
                      <span className="text-[10px] text-slate-400">استقبال وتسجيل وفواتير</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('patient')}
                    className={`p-3 rounded-xl border text-right transition-all flex items-center gap-2.5 cursor-pointer ${
                      selectedRole === 'patient'
                        ? 'bg-amber-950/80 border-amber-500/80 text-amber-200 ring-1 ring-amber-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <UserCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="block font-bold">مريض</span>
                      <span className="text-[10px] text-slate-400">عرض الملف والمواعيد</span>
                    </div>
                  </button>

                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 mt-4 rounded-xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-sky-950/80 border border-sky-400/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{activeTab === 'login' ? 'تسجيل الدخول للنظام' : 'إنشاء الحساب والدخول'}</span>
              </button>
            </form>

            <div className="mt-5 text-center">
              {activeTab === 'login' ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-xs text-sky-400 hover:underline font-semibold cursor-pointer"
                >
                  ليس لديك حساب؟ اضغط هنا لإنشاء حساب جديد
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-xs text-sky-400 hover:underline font-semibold cursor-pointer"
                >
                  لديك حساب بالفعل؟ اضغط هنا لتسجيل الدخول
                </button>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-4 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>مشفى النور</span>
          <span className="text-[11px] text-slate-400">نظام طبي موحد وآمن وفق أعلى المعايير القياسية</span>
        </div>
      </footer>

    </div>
  );
};
