import React, { useState } from 'react';
import { HospitalLogo } from './HospitalLogo';
import { 
  LogIn, 
  ShieldCheck, 
  Mail, 
  Lock, 
  User as UserIcon, 
  HeartPulse,
  Pill,
  Calendar,
  Users,
  Home,
  AlertCircle
} from 'lucide-react';
import { UserRole } from '../types';

interface LandingAndAuthScreenProps {
  onLogin: (role: UserRole, userName?: string) => void;
}

// Pre-configured official system accounts
const DEFAULT_ACCOUNTS: Record<string, { role: UserRole; name: string; pass: string }> = {
  'admin@hospital.com': { role: 'admin', name: 'مدير النظام الرئيسي', pass: 'admin123' },
  'doctor@hospital.com': { role: 'doctor', name: 'د. أحمد السوري', pass: 'doctor123' },
  'staff@hospital.com': { role: 'staff', name: 'موظف الاستقبال والتسجيل', pass: 'staff123' },
};

export const LandingAndAuthScreen: React.FC<LandingAndAuthScreenProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<'landing' | 'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [errorMessage, setErrorMessage] = useState('');
  const [isRoleLocked, setIsRoleLocked] = useState(false);
  const [lockedRoleLabel, setLockedRoleLabel] = useState('');

  // Load existing accounts dictionary merged with defaults
  const getRegisteredAccounts = () => {
    try {
      const saved = localStorage.getItem('syrian_hosp_accounts');
      const userAccounts = saved ? JSON.parse(saved) : {};
      return { ...DEFAULT_ACCOUNTS, ...userAccounts };
    } catch (e) {
      return DEFAULT_ACCOUNTS;
    }
  };

  const getRoleArabicName = (r: UserRole) => {
    switch (r) {
      case 'admin': return 'مدير النظام';
      case 'doctor': return 'طبيب معالج';
      case 'staff': return 'موظف استقبال';
      case 'patient': return 'مريض';
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    const cleanEmail = val.trim().toLowerCase();
    if (cleanEmail) {
      const accounts = getRegisteredAccounts();
      if (accounts[cleanEmail]) {
        const boundRole: UserRole = accounts[cleanEmail].role;
        setSelectedRole(boundRole);
        setIsRoleLocked(true);
        setLockedRoleLabel(getRoleArabicName(boundRole));
        if (accounts[cleanEmail].name && !fullName) {
          setFullName(accounts[cleanEmail].name);
        }
      } else {
        setIsRoleLocked(false);
        setLockedRoleLabel('');
      }
    } else {
      setIsRoleLocked(false);
      setLockedRoleLabel('');
    }
  };

  const validateEmail = (emailStr: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr.trim());
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateEmail(email)) {
      setErrorMessage('يرجى إدخال بريد إلكتروني نظامي وصحيح (مثل: name@domain.com)');
      return;
    }

    if (password.trim().length < 4) {
      setErrorMessage('كلمة المرور يجب أن تتكون من 4 خانات أو رموز على الأقل');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const accounts = getRegisteredAccounts();

    // LOGIN LOGIC
    if (activeTab === 'login') {
      const existingAccount = accounts[cleanEmail];
      if (!existingAccount) {
        setErrorMessage('البريد الإلكتروني غير مسجّل بالنظام! يرجى التأكد من البريد أو الانتقال لإنشاء حساب مريض.');
        return;
      }

      // Check password
      if (existingAccount.pass && existingAccount.pass !== password.trim()) {
        setErrorMessage('كلمة المرور غير صحيحة لهذا الحساب!');
        return;
      }

      // Successful verified login
      onLogin(existingAccount.role, existingAccount.name || fullName || email.split('@')[0]);
      return;
    }

    // REGISTER LOGIC (Strictly locked to Patient role for public safety)
    if (activeTab === 'register') {
      if (fullName.trim().length < 3) {
        setErrorMessage('يرجى كتابة الاسم الكامل للمريض بشكل واضح');
        return;
      }

      if (accounts[cleanEmail]) {
        setErrorMessage('هذا البريد الإلكتروني مسجّل مسبقاً بالنظام! يرجى الانتقال لتسجيل الدخول.');
        return;
      }

      // Save new user account to localStorage (strictly as patient)
      const userAccountsRaw = localStorage.getItem('syrian_hosp_accounts');
      const userAccounts = userAccountsRaw ? JSON.parse(userAccountsRaw) : {};

      userAccounts[cleanEmail] = {
        role: 'patient',
        name: fullName.trim(),
        pass: password.trim(),
        registeredAt: new Date().toISOString()
      };

      try {
        localStorage.setItem('syrian_hosp_accounts', JSON.stringify(userAccounts));
      } catch (err) {
        // Fallback
      }

      onLogin('patient', fullName.trim());
    }
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
              <h1 className="text-lg font-black text-white tracking-wide group-hover:text-sky-400 transition-colors">مشفى الرحمة</h1>
              <p className="text-[11px] text-slate-400">النظام الطبي الموحد لإدارة الرعاية الصحيّة</p>
            </div>
          </div>

          {/* Unified Clean Header Navigation Bar */}
          <nav className="flex items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-full border border-slate-800/80 shadow-lg">
            <button
              onClick={() => setActiveTab('landing')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'landing' 
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-900/50 border border-sky-400/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>الرئيسية</span>
            </button>

            <button
              onClick={() => setActiveTab('login')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'login' || activeTab === 'register'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-900/50 border border-sky-400/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>بوابة الدخول</span>
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

              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight">
                منظومة <span className="text-sky-600">مشفى الرحمة الطبية</span>
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                منظومة إلكترونية متكاملة لربط إدارة المرضى، الأطباء، جدولة المواعيد، الصيدلية، المختبر، والفواتير بمرونة وسهولة كاملة.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-center pt-2">
                <button
                  onClick={() => setActiveTab('login')}
                  className="px-8 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-sm shadow-md shadow-sky-600/30 transition-all hover:scale-105 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <LogIn className="w-4.5 h-4.5" />
                  <span>الانتقال لبوابة تسجيل الدخول</span>
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
                <h3 className="font-bold text-white text-sm mb-1">أمان وخصوصية تامة</h3>
                <p className="text-xs text-slate-400 leading-relaxed">عزل كامل لبيانات المرضى، وحصر إدارة الحسابات بإدارة المستشفى.</p>
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
              <h2 className="text-2xl font-black text-white mt-3">مشفى الرحمة الطبي</h2>
              <p className="text-xs text-slate-400 mt-1">
                {activeTab === 'login' 
                  ? 'تسجيل الدخول إلى بوابّة النظام الموحد' 
                  : 'بوابة تسجيل المرضى والمراجعين الجدد'}
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/80 text-rose-200 text-xs flex items-center gap-2 shadow-lg">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
                  <span className="font-semibold">{errorMessage}</span>
                </div>
              )}
              
              {activeTab === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">الاسم الكامل للمريض *</label>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">البريد الإلكتروني *</label>
                <div className="relative">
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="أدخل البريد الإلكتروني (مثال: admin@hospital.com)..."
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

              <button
                type="submit"
                className="w-full py-3.5 px-4 mt-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md shadow-sky-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{activeTab === 'login' ? 'تسجيل الدخول للنظام' : 'إنشاء حساب المريض والدخول'}</span>
              </button>
            </form>

            <div className="mt-5 text-center">
              {activeTab === 'login' ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-xs text-sky-400 hover:underline font-semibold cursor-pointer"
                >
                  إنشاء حساب مريض جديد
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-xs text-sky-400 hover:underline font-semibold cursor-pointer"
                >
                  لديك حساب بالفعل؟ تسجيل الدخول
                </button>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-4 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>مشفى الرحمة</span>
          <span className="text-[11px] text-slate-400">نظام طبي موحد وآمن وفق أعلى المعايير القياسية</span>
        </div>
      </footer>

    </div>
  );
};
