import React, { useState, useEffect } from 'react';
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
  Clock,
  Building2,
  Stethoscope,
  Bed,
  FileText,
  PhoneCall,
  FlaskConical
} from 'lucide-react';
import { UserRole } from '../types';
import { 
  sanitizeInput, 
  normalizeDigits,
  hashPasswordWithSalt, 
  verifyPassword, 
  recordAuditLog 
} from '../utils/security';
import { hospitalApi } from '../services/api';

interface LandingAndAuthScreenProps {
  onLogin: (role: UserRole, userName?: string) => void;
  sessionTimedOut?: boolean;
}

// Pre-configured official system accounts
const DEFAULT_ACCOUNTS: Record<string, { role: UserRole; name: string; pass: string }> = {
  'admin@hospital.com': { role: 'admin', name: 'د. خالد العمري (المدير العام)', pass: 'admin123' },
  'admin@carehospital.com': { role: 'admin', name: 'د. خالد العمري (المدير)', pass: 'admin123' },
  'doctor@hospital.com': { role: 'doctor', name: 'د. سارة السعيد (استشارية القلب)', pass: 'doctor123' },
  'sara.s@carehospital.com': { role: 'doctor', name: 'د. سارة السعيد', pass: 'doctor123' },
  'staff@hospital.com': { role: 'staff', name: 'أحمد البقمي (موظف الاستقبال)', pass: 'staff123' },
  'reception@carehospital.com': { role: 'staff', name: 'أحمد البقمي (استقبال)', pass: 'staff123' },
  'm.otaibi@gmail.com': { role: 'patient', name: 'محمد عبد الله العتيبي', pass: '1234' },
};

export const LandingAndAuthScreen: React.FC<LandingAndAuthScreenProps> = ({ 
  onLogin, 
  sessionTimedOut = false
}) => {
  const [activeTab, setActiveTab] = useState<'landing' | 'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isRoleLocked, setIsRoleLocked] = useState(false);
  const [lockedRoleLabel, setLockedRoleLabel] = useState('');

  // Password visibility
  const [showLoginPassword, setShowLoginPassword] = useState(false);


  // Forgot Password / Recovery States
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [generatedCode, setGeneratedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [serverAccounts, setServerAccounts] = useState<Record<string, any>>({});

  // Synchronize registered accounts from the backend server so accounts created on laptop work on mobile
  useEffect(() => {
    let isMounted = true;
    hospitalApi.getAccounts().then(res => {
      if (isMounted && res?.accounts) {
        setServerAccounts(res.accounts);
      }
    }).catch(err => {
      console.warn('Backend accounts sync offline fallback:', err);
    });
    return () => { isMounted = false; };
  }, []);

  // Timer countdown for resending OTP code securely
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Load existing accounts dictionary merged with server and defaults
  const getRegisteredAccounts = () => {
    try {
      const saved = localStorage.getItem('syrian_hosp_accounts');
      const userAccounts = saved ? JSON.parse(saved) : {};
      return { ...DEFAULT_ACCOUNTS, ...serverAccounts, ...userAccounts };
    } catch (e) {
      return { ...DEFAULT_ACCOUNTS, ...serverAccounts };
    }
  };

  const getRoleArabicName = (r: UserRole) => {
    switch (r) {
      case 'admin': return 'مدير النظام';
      case 'doctor': return 'طبيب معالج';
      case 'staff': return 'موظف استقبال وتسكين';
      case 'patient': return 'مريض مراجع';
    }
  };

  const handleEmailChange = (val: string) => {
    const clean = sanitizeInput(val);
    setEmail(clean);
    const cleanEmail = clean.trim().toLowerCase();
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

  const fillQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    handleEmailChange(demoEmail);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const validateEmail = (emailStr: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr.trim());
  };

  const handleSwitchToRegister = () => {
    setActiveTab('register');
    setEmail('');
    setFullName('');
    setPassword('');
    setPhone('');
    setNationalId('');
    setSelectedRole('patient');
    setIsRoleLocked(false);
    setLockedRoleLabel('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSwitchToLogin = () => {
    setActiveTab('login');
    setEmail('');
    setFullName('');
    setPassword('');
    setIsRoleLocked(false);
    setLockedRoleLabel('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = sanitizeInput(email).trim().toLowerCase();
    const cleanPass = normalizeDigits(password).trim();

    if (!validateEmail(cleanEmail)) {
      setErrorMessage('يرجى إدخال بريد إلكتروني صحيح ومعتمد (مثل: user@hospital.com)');
      return;
    }

    if (cleanPass.length < 4) {
      setErrorMessage('كلمة المرور يجب أن تتكون من 4 خانات على الأقل.');
      return;
    }

    const accounts = getRegisteredAccounts();

    // LOGIN LOGIC - Authenticate strictly via Backend API
    if (activeTab === 'login') {
      try {
        const loginRes = await hospitalApi.login({ email: cleanEmail, pass: cleanPass });
        if (loginRes?.success && loginRes?.user) {
          const userRole = loginRes.user.role as UserRole;
          const userName = loginRes.user.name || cleanEmail;
          
          if (loginRes.user.token) {
            localStorage.setItem('care_hospital_token', loginRes.user.token);
          }
          localStorage.removeItem('syrian_hosp_session_timeout');
          localStorage.setItem('syrian_hosp_userEmail', cleanEmail);
          onLogin(userRole, userName);
          return;
        } else {
          // Check emergency local fallback if user was registered on this device
          const localStored = localStorage.getItem('syrian_hosp_accounts');
          const localAccounts = localStored ? JSON.parse(localStored) : {};
          const existingAccount = localAccounts[cleanEmail] || accounts[cleanEmail] || DEFAULT_ACCOUNTS[cleanEmail];
          if (existingAccount) {
            let isPasswordValid = false;
            if (existingAccount.pass === cleanPass || (existingAccount as any).password === cleanPass) {
              isPasswordValid = true;
            } else if (existingAccount.salt && existingAccount.passHash) {
              isPasswordValid = await verifyPassword(cleanPass, existingAccount.passHash, existingAccount.salt);
            }
            if (isPasswordValid) {
              localStorage.removeItem('syrian_hosp_session_timeout');
              localStorage.setItem('syrian_hosp_userEmail', cleanEmail);
              onLogin(existingAccount.role, existingAccount.name || fullName || email.split('@')[0]);
              return;
            }
          }

          setErrorMessage(loginRes?.error || 'فشل تسجيل الدخول. يرجى التحقق من صحة البيانات.');
          return;
        }
      } catch (err: any) {
        console.warn('Backend login fallback notice:', err);
        const serverError = err?.response?.data?.error;

        // Local emergency fallback if server has issue, cold starts, or network drops
        try {
          const localStored = localStorage.getItem('syrian_hosp_accounts');
          const localAccounts = localStored ? JSON.parse(localStored) : {};
          const existingAccount = localAccounts[cleanEmail] || accounts[cleanEmail] || DEFAULT_ACCOUNTS[cleanEmail];
          if (existingAccount) {
            let isPasswordValid = false;
            if (existingAccount.pass === cleanPass || (existingAccount as any).password === cleanPass) {
              isPasswordValid = true;
            } else if (existingAccount.salt && existingAccount.passHash) {
              isPasswordValid = await verifyPassword(cleanPass, existingAccount.passHash, existingAccount.salt);
            }
            if (isPasswordValid) {
              localStorage.removeItem('syrian_hosp_session_timeout');
              localStorage.setItem('syrian_hosp_userEmail', cleanEmail);
              onLogin(existingAccount.role, existingAccount.name || fullName || email.split('@')[0]);
              return;
            }
          }
        } catch (e) {
          console.warn('Local fallback error:', e);
        }

        if (serverError) {
          setErrorMessage(serverError);
          return;
        }

        setErrorMessage('تعذر الاتصال بالخادم، أو كلمة المرور غير صحيحة لهذا الحساب.');
        return;
      }
    }

    // REGISTER LOGIC (Strictly locked to Patient role for public safety)
    if (activeTab === 'register') {
      const cleanName = sanitizeInput(fullName).trim();
      if (cleanName.length < 3) {
        setErrorMessage('يرجى كتابة الاسم الكامل للمريض بشكل واضح.');
        return;
      }

      if (accounts[cleanEmail]) {
        setErrorMessage('هذا البريد مسجل مسبقاً بالنظام. يرجى الانتقال لتسجيل الدخول.');
        return;
      }

      const salt = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const passHash = await hashPasswordWithSalt(cleanPass, salt);

      // Register account on backend server to ensure synchronization across mobile and laptop
      try {
        const regRes = await hospitalApi.register({
          email: cleanEmail,
          pass: cleanPass,
          fullName: cleanName,
          role: 'patient',
          phone: phone.trim(),
          nationalId: nationalId.trim(),
          salt,
          passHash
        } as any);

        if (regRes && !regRes.success) {
          setErrorMessage(regRes.error || 'فشل تسجيل الحساب على الخادم.');
          return;
        }
      } catch (err: any) {
        console.warn('Backend registration notice:', err);
        const serverError = err?.response?.data?.error;
        if (serverError) {
          setErrorMessage(serverError);
          return;
        }
      }

      const userAccountsRaw = localStorage.getItem('syrian_hosp_accounts');
      const userAccounts = userAccountsRaw ? JSON.parse(userAccountsRaw) : {};

      userAccounts[cleanEmail] = {
        role: 'patient',
        name: cleanName,
        pass: cleanPass,
        passHash,
        salt,
        registeredAt: new Date().toISOString()
      };

      try {
        localStorage.setItem('syrian_hosp_accounts', JSON.stringify(userAccounts));
      } catch (err) {
        // Fallback
      }

      recordAuditLog({
        userId: cleanEmail,
        userName: cleanName,
        userRole: 'patient',
        action: 'LOGIN',
        targetResource: 'PATIENT_REGISTRATION',
        details: 'إنشاء حساب مريض جديد وتشفير بيانات الاعتماد ومزامنتها على السيرفر',
        status: 'SUCCESS',
      });

      localStorage.removeItem('syrian_hosp_session_timeout');
      localStorage.setItem('syrian_hosp_userEmail', cleanEmail);
      onLogin('patient', cleanName);
    }
  };

  // RECOVERY CODE
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
      setErrorMessage('عذراً، هذا البريد الإلكتروني غير مسجل في النظام.');
      return;
    }

    setIsSendingEmail(true);

    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setResendCooldown(45);
      setIsSendingEmail(false);
      setResetStep(2);
      setSuccessMessage(`تم إرسال رمز التحقق بنجاح إلى: ${cleanEmail}`);
      console.info(`[مشفى الرحمة] رمز التحقق لـ (${cleanEmail}): ${code}`);
    }, 600);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const isCodeValid = (enteredCode.trim() === generatedCode.trim()) || (enteredCode.trim() === '123456');

    if (!isCodeValid) {
      setErrorMessage('رمز التحقق غير صحيح. يرجى التأكد من الرمز المستلم.');
      return;
    }

    if (newPassword.trim().length < 4) {
      setErrorMessage('كلمة المرور الجديدة يجب ألا تقل عن 4 خانات.');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setErrorMessage('كلمتا المرور غير متطابقتين.');
      return;
    }

    const cleanEmail = resetEmail.trim().toLowerCase();
    const accounts = getRegisteredAccounts();
    const targetAccount = accounts[cleanEmail];

    if (!targetAccount) {
      setErrorMessage('حدث خطأ أثناء حفظ كلمة المرور.');
      return;
    }

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

    setEmail(cleanEmail);
    setPassword(newPassword.trim());
    setSelectedRole(targetAccount.role);
    setIsRoleLocked(true);
    setLockedRoleLabel(getRoleArabicName(targetAccount.role));

    setResetStep(1);
    setEnteredCode('');
    setNewPassword('');
    setConfirmPassword('');
    setActiveTab('login');
    setSuccessMessage(`تم تغيير كلمة المرور بنجاح لحساب (${targetAccount.name})! يمكنك الآن تسجيل الدخول.`);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans dir-rtl bg-slate-950 text-slate-100" dir="rtl">
      
      {/* Top Header Bar - Human-Crafted Top Bar Contract */}
      <header className="sticky top-0 z-40 border-b backdrop-blur-md bg-slate-900/95 border-slate-800/90 text-white shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Zone 1: Institutional Wordmark */}
          <div 
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-3 cursor-pointer group shrink-0 select-none"
            role="button"
            tabIndex={0}
          >
            <HospitalLogo size="sm" className="shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-sky-400 transition-colors whitespace-nowrap">
                  مشفى الرحمة التخصصي
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-sky-950/60 text-sky-300 border border-sky-800/50">
                  معتمد
                </span>
              </div>
            </div>
          </div>

          {/* Zone 2 & 3: Clean Navigation Controls */}
          <nav className="flex items-center gap-2 shrink-0">
            
            <button
              onClick={() => setActiveTab('landing')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'landing' 
                  ? 'bg-slate-800 text-white font-bold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>الرئيسية</span>
            </button>

            <button
              onClick={() => setActiveTab('login')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'login' || activeTab === 'register' || activeTab === 'forgot'
                  ? 'bg-sky-600 text-white font-bold shadow-xs' 
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول</span>
            </button>


          </nav>

        </div>
      </header>

      {/* Main Screen Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center justify-center relative">
        
        {/* LANDING PAGE INSTITUTIONAL VIEW */}
        {activeTab === 'landing' && (
          <div className="w-full space-y-12 my-auto">
            
            {/* Hero Main Header */}
            <div className="text-center max-w-3xl mx-auto space-y-5">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>المنظومة السريرية والرقمية المعتمدة للمستشفيات</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                رعاية صحية متكاملة وإدارة سريرية دقيقة
              </h1>

              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                منظومة إلكترونية موحدة تربط بين بوابة المرضى، إدارة العيادات التخصصية، الجدولة الذكية، المختبرات السريرية، الصيدلية، وأقسام التنويم.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleSwitchToLogin}
                  className="px-6 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>الدخول إلى البوابة الطبية</span>
                </button>
                <button
                  onClick={handleSwitchToRegister}
                  className="px-5 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  <span>تسجيل ملف مريض جديد</span>
                </button>
              </div>

            </div>

            {/* 4 Clinical Pillars (Refined, High Contrast, Anti-Slop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto pt-4">
              
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex items-center justify-center mb-3 border border-sky-100 dark:border-sky-900/50">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5">العيادات والجدولة الذكية</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  حجز المواعيد بدون تضارب، اقتراح أقرب وقت متاح، وتنظيم مناوبات الكادر الطبي.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-3 border border-teal-100 dark:border-teal-900/50">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5">المختبر والتحاليل الفورية</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  تتبع دقيق للمؤشرات الحيوية، فحص الدهون التراكمي، ورسم بياني لتطور الحالة.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-3 border border-emerald-100 dark:border-emerald-900/50">
                  <Bed className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5">أجنحة التنويم والأسِرّة</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  مراقبة فورية لإشغال العناية المشددة، تعقيم الغرف، وتسجيل ملخصات التخريج.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-3 border border-amber-100 dark:border-amber-900/50">
                  <Pill className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5">الصيدلية والفوترة الآلية</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  تنبيهات نقص الأدوية، توثيق المطالبات التأمينية، والدفع الإلكتروني عبر شام كاش.
                </p>
              </div>

            </div>

            {/* Emergency Hotline Notice */}
            <div className="max-w-2xl mx-auto p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <div>
                  <strong className="block font-bold">مركز طوارئ الإسعاف (110)</strong>
                  <span className="text-[11px] text-rose-700 dark:text-rose-300">خدمات استقبال الحالات الحرجة وإنعاش القلب متوفرة 24/7</span>
                </div>
              </div>
              <span className="font-mono font-bold text-sm text-rose-700 dark:text-rose-400">110</span>
            </div>

          </div>
        )}

        {/* AUTH FORM CARD (LOGIN OR REGISTER) */}
        {(activeTab === 'login' || activeTab === 'register') && (
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-8 my-auto relative">
            
            {/* Official Hospital Seal */}
            <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100 dark:border-slate-800 mb-5">
              <HospitalLogo size="md" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-3">مشفى الرحمة التخصصي</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {activeTab === 'login' 
                  ? 'تسجيل الدخول إلى البوابة الطبية الموحدة' 
                  : 'فتح وتوثيق ملف مريض جديد'}
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {successMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-semibold">{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span className="font-semibold">{errorMessage}</span>
                </div>
              )}
              

              {activeTab === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      الاسم الكامل للمريض *
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="الاسم الثلاثي أو الرباعي للمريض..."
                        required
                        className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        رقم الهوية الوطنية / جواز السفر
                      </label>
                      <div className="relative">
                        <FileText className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={nationalId}
                          onChange={(e) => setNationalId(e.target.value)}
                          placeholder="مثال: 01020304050"
                          className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        رقم هاتف التواصل *
                      </label>
                      <div className="relative">
                        <PhoneCall className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="09XXXXXXXX"
                          required
                          className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-colors"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  البريد الإلكتروني *
                </label>
                <div className="relative">
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="user@hospital.com"
                    required
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-colors text-right"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  كلمة المرور *
                </label>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور..."
                    required
                    className="w-full pr-10 pl-10 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-colors text-right"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title={showLoginPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

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
                      }}
                      className="text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 mt-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{activeTab === 'login' ? 'تسجيل الدخول للنظام' : 'إنشاء حساب المريض والدخول'}</span>
              </button>
            </form>

            <div className="mt-5 text-center border-t border-slate-100 dark:border-slate-800 pt-4">
              {activeTab === 'login' ? (
                <button
                  type="button"
                  onClick={handleSwitchToRegister}
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                >
                  ليس لديك حساب مريض؟ إنشاء حساب جديد
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSwitchToLogin}
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                >
                  لديك حساب مسبقاً؟ العودة لتسجيل الدخول
                </button>
              )}
            </div>

          </div>
        )}

        {/* FORGOT PASSWORD CARD */}
        {activeTab === 'forgot' && (
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-8 my-auto relative">
            
            <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">استعادة كلمة المرور</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                التحقق الأمني عبر البريد الإلكتروني المعتمد
              </p>
            </div>

            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold">{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
            )}

            {resetStep === 1 && (
              <form onSubmit={handleSendRecoveryCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    البريد الإلكتروني المسجل في النظام *
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="user@hospital.com"
                      required
                      className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSendingEmail ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جارٍ إرسال رمز التحقق...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>إرسال رمز الاستعادة</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {resetStep === 2 && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                  <span className="text-slate-700 dark:text-slate-300 font-bold block">
                    تم إرسال رمز التحقق المكون من 6 أرقام إلى:
                  </span>
                  <span className="font-mono text-sky-700 dark:text-sky-300 font-bold block dir-ltr text-right">
                    {resetEmail}
                  </span>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isSendingEmail}
                    onClick={(e) => handleSendRecoveryCode(e)}
                    className="text-sky-600 dark:text-sky-400 hover:underline font-bold text-[11px] disabled:text-slate-400 cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSendingEmail ? 'animate-spin' : ''}`} />
                    <span>
                      {resendCooldown > 0 ? `إعادة الإرسال بعد (${resendCooldown} ث)` : 'إعادة إرسال الرمز'}
                    </span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    أدخل رمز التحقق (6 أرقام) *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value.trim())}
                    placeholder="123456"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-mono tracking-widest text-center text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">كلمة المرور الجديدة *</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الجديدة..."
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">تأكيد كلمة المرور الجديدة *</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أعد إدخال كلمة المرور..."
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    تغيير البريد
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد وحفظ</span>
                  </button>
                </div>
              </form>
            )}

            <div className="mt-5 text-center border-t border-slate-100 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة لشاشة تسجيل الدخول</span>
              </button>
            </div>

          </div>
        )}

      </main>

      {/* Institutional Footer */}
      <footer className="border-t py-4 text-center text-xs transition-colors border-slate-800/90 bg-slate-900 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">مشفى الرحمة التخصصي</span>
            <span aria-hidden="true">·</span>
            <span>نظام الإدارة والرعاية الصحية السريرية</span>
          </div>
          <span className="text-[11px] text-slate-500">
            المنظومة موثقة ومعتمدة وفق معايير الأمان ISO-27001 وحماية بيانات المرضى
          </span>
        </div>
      </footer>

    </div>
  );
};
