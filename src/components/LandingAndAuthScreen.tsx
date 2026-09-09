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
  AlertCircle,
  KeyRound,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
  Send,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { UserRole } from '../types';

interface LandingAndAuthScreenProps {
  onLogin: (role: UserRole, userName?: string) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

// Pre-configured official system accounts (including all hospital roles)
const DEFAULT_ACCOUNTS: Record<string, { role: UserRole; name: string; pass: string }> = {
  'admin@hospital.com': { role: 'admin', name: 'مدير النظام الرئيسي', pass: 'admin123' },
  'admin@carehospital.com': { role: 'admin', name: 'د. خالد العمري (المدير)', pass: 'admin123' },
  'doctor@hospital.com': { role: 'doctor', name: 'د. أحمد السوري', pass: 'doctor123' },
  'sara.s@carehospital.com': { role: 'doctor', name: 'د. سارة السعيد', pass: 'doctor123' },
  'staff@hospital.com': { role: 'staff', name: 'موظف الاستقبال والتسجيل', pass: 'staff123' },
  'reception@carehospital.com': { role: 'staff', name: 'أحمد البقمي (استقبال)', pass: 'staff123' },
  'm.otaibi@gmail.com': { role: 'patient', name: 'محمد عبد الله العتيبي', pass: '1234' },
};

export const LandingAndAuthScreen: React.FC<LandingAndAuthScreenProps> = ({ 
  onLogin, 
  theme = 'light', 
  onToggleTheme 
}) => {
  const [activeTab, setActiveTab] = useState<'landing' | 'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isRoleLocked, setIsRoleLocked] = useState(false);
  const [lockedRoleLabel, setLockedRoleLabel] = useState('');

  // Forgot Password / Email Recovery States
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [generatedCode, setGeneratedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [simulatedEmail, setSimulatedEmail] = useState<{
    to: string;
    accountName: string;
    roleName: string;
    code: string;
    timestamp: string;
  } | null>(null);

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
    setSuccessMessage('');

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
        setErrorMessage('كلمة المرور غير صحيحة لهذا الحساب! إذا نسيت الكلمة، اضغط على "نسيت كلمة المرور؟" بالأسفل.');
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
        setErrorMessage('هذا البريد الإلكتروني مسجّل مسبقاً بالنظام! يرجى الانتقال لتسجيل الدخول أو استعادة كلمة المرور.');
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

  // SEND RECOVERY CODE TO EMAIL (For all roles: Admin, Doctor, Staff, Patient)
  const handleSendRecoveryCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateEmail(resetEmail)) {
      setErrorMessage('يرجى إدخال بريد إلكتروني صحيح للبحث عن الحساب.');
      return;
    }

    const cleanEmail = resetEmail.trim().toLowerCase();
    const accounts = getRegisteredAccounts();
    const targetAccount = accounts[cleanEmail];

    if (!targetAccount) {
      setErrorMessage('عذراً، هذا البريد الإلكتروني غير مسجل في النظام. تأكد من كتابة البريد بشكل صحيح.');
      return;
    }

    setIsSendingEmail(true);

    setTimeout(() => {
      // Generate a realistic 6-digit OTP code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setSimulatedEmail({
        to: cleanEmail,
        accountName: targetAccount.name,
        roleName: getRoleArabicName(targetAccount.role),
        code: code,
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      });
      setIsSendingEmail(false);
      setResetStep(2);
      setSuccessMessage(`تم إرسال رمز التحقق الأمني بنجاح إلى البريد: ${cleanEmail}`);
    }, 700);
  };

  // VERIFY CODE & APPLY NEW PASSWORD
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (enteredCode.trim() !== generatedCode.trim()) {
      setErrorMessage('رمز التحقق غير صحيح! يرجى إدخال الرمز المكون من 6 أرقام المستلم على بريدك.');
      return;
    }

    if (newPassword.trim().length < 4) {
      setErrorMessage('كلمة المرور الجديدة يجب ألا تقل عن 4 خانات.');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setErrorMessage('كلمتا المرور غير متطابقتين! يرجى إعادة التأكد.');
      return;
    }

    const cleanEmail = resetEmail.trim().toLowerCase();
    const accounts = getRegisteredAccounts();
    const targetAccount = accounts[cleanEmail];

    if (!targetAccount) {
      setErrorMessage('حدث خطأ أثناء حفظ كلمة المرور.');
      return;
    }

    // Persist new password for the account in localStorage
    try {
      const userAccountsRaw = localStorage.getItem('syrian_hosp_accounts');
      const userAccounts = userAccountsRaw ? JSON.parse(userAccountsRaw) : {};

      userAccounts[cleanEmail] = {
        ...targetAccount,
        pass: newPassword.trim(),
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('syrian_hosp_accounts', JSON.stringify(userAccounts));
    } catch (e) {
      // Ignore
    }

    // Fill the login form with the updated credentials
    setEmail(cleanEmail);
    setPassword(newPassword.trim());
    setSelectedRole(targetAccount.role);
    setIsRoleLocked(true);
    setLockedRoleLabel(getRoleArabicName(targetAccount.role));

    // Reset forgot password wizard and switch to login tab
    setResetStep(1);
    setSimulatedEmail(null);
    setEnteredCode('');
    setNewPassword('');
    setConfirmPassword('');
    setActiveTab('login');
    setSuccessMessage(`تم تغيير كلمة المرور بنجاح لحساب (${targetAccount.name})! يمكنك الآن تسجيل الدخول مباشرة.`);
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
                activeTab === 'login' || activeTab === 'register' || activeTab === 'forgot'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-900/50 border border-sky-400/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>بوابة الدخول</span>
            </button>

            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'التحويل إلى النمط النهاري' : 'التحويل إلى النمط الليلي'}
                className="p-2 rounded-full text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-400" />
                )}
              </button>
            )}
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
              
              {successMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/80 text-emerald-200 text-xs flex items-center gap-2 shadow-lg">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                  <span className="font-semibold">{successMessage}</span>
                </div>
              )}

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
                    placeholder=""
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

                {/* Forgot password button */}
                {activeTab === 'login' && (
                  <div className="flex items-center justify-end text-xs pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('forgot');
                        setResetStep(1);
                        setResetEmail(email || '');
                        setErrorMessage('');
                        setSuccessMessage('');
                        setSimulatedEmail(null);
                      }}
                      className="text-sky-400 hover:text-sky-300 hover:underline font-semibold cursor-pointer transition-colors"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>
                )}
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

        {/* FORGOT PASSWORD & RECOVERY CARD */}
        {activeTab === 'forgot' && (
          <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 my-auto relative">
            
            {/* Header */}
            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-800/80 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-3 shadow-inner">
                <KeyRound className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-white">استعادة كلمة المرور</h2>
            </div>

            {/* Messages */}
            {successMessage && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/80 text-emerald-200 text-xs flex items-center gap-2 shadow-lg">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                <span className="font-semibold">{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/80 text-rose-200 text-xs flex items-center gap-2 shadow-lg">
                <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
            )}

            {/* STEP 1: Enter Registered Email */}
            {resetStep === 1 && (
              <form onSubmit={handleSendRecoveryCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    البريد الإلكتروني المسجل في النظام *
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder=""
                      required
                      className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="w-full py-3.5 px-4 mt-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-800 text-white font-bold text-sm shadow-md shadow-sky-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSendingEmail ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-sky-200" />
                      <span>جارٍ إرسال البريد الأمني...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>إرسال رمز الاستعادة إلى البريد</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: Verify OTP & Enter New Password */}
            {resetStep === 2 && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                
                {/* Simulated Hospital Webmail Preview Notification */}
                {simulatedEmail && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-950/60 to-slate-950 border border-sky-500/40 shadow-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-sky-500/20 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                        <span className="text-[11px] font-bold text-sky-300">بريد إلكتروني وارد الآن (محاكاة الصندوق)</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{simulatedEmail.timestamp}</span>
                    </div>

                    <div className="text-xs text-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">إلى: {simulatedEmail.to}</span>
                        <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-bold">
                          {simulatedEmail.roleName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        مرحباً <strong className="text-white">{simulatedEmail.accountName}</strong>، رمز التحقق لإعادة تعيين كلمة المرور هو:
                      </p>
                    </div>

                    {/* Prominent Code Box */}
                    <div className="bg-slate-950/90 border border-sky-500/50 rounded-xl p-3 flex items-center justify-between">
                      <span className="font-mono text-2xl font-black tracking-widest text-sky-400">
                        {simulatedEmail.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEnteredCode(simulatedEmail.code)}
                        className="px-3 py-1.5 rounded-lg bg-sky-600/30 hover:bg-sky-600 text-sky-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>تعبئة تلقائية للرمز</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Entered Code Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    أدخل رمز التحقق (6 أرقام) *
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      maxLength={6}
                      value={enteredCode}
                      onChange={(e) => setEnteredCode(e.target.value.trim())}
                      placeholder=""
                      required
                      className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono tracking-wider text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all text-center"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">كلمة المرور الجديدة *</label>
                  <div className="relative">
                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور الجديدة..."
                      required
                      className="w-full pr-10 pl-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">تأكيد كلمة المرور الجديدة *</label>
                  <div className="relative">
                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="أعد إدخال كلمة المرور..."
                      required
                      className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep(1);
                      setErrorMessage('');
                    }}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    تغيير البريد
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md shadow-sky-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد وحفظ كلمة المرور</span>
                  </button>
                </div>

              </form>
            )}

            {/* Back to Login */}
            <div className="mt-6 text-center border-t border-slate-800/80 pt-4">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="text-xs text-sky-400 hover:underline font-semibold flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة لشاشة تسجيل الدخول</span>
              </button>
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
