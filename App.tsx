
import React, { useState, useEffect } from 'react';
import { UserRole } from './types';
import AshaApp from './screens/AshaApp';
import DoctorApp from './screens/DoctorApp';
import PatientApp from './screens/PatientApp';
import { UserCircle2, Stethoscope, Users, Globe, Lock, Phone, User, Fingerprint, Loader2 } from 'lucide-react';
import { ArogyaLogo } from './components/Logo';
import { Button } from './components/UI';
import { loginWithEmail, registerWithEmail, sendOTP, verifyOTP, logout, onAuthChange, type ConfirmationResult } from './services/firebase';
import type { User as FirebaseUser } from 'firebase/auth';

const SideSlideText: React.FC<{ text: string; delayOffset?: number; isOut?: boolean }> = ({ text, delayOffset = 0, isOut = false }) => {
  const chars = text.split('');
  
  return (
    <div className="flex justify-center overflow-hidden">
      {chars.map((char, i) => (
        <span
          key={i}
          className={`inline-block transition-all duration-700 ease-out transform ${isOut ? 'opacity-0 translate-x-10' : 'opacity-100 translate-x-0'}`}
          style={{ 
            transitionDelay: `${(i * 60) + delayOffset}ms`, 
            whiteSpace: char === ' ' ? 'pre' : 'normal',
            display: 'inline-block'
          }}
        >
          {char}
        </span>
      ))}
    </div>
  );
};

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [stage, setStage] = useState<'marathi_in' | 'marathi_out' | 'english_in' | 'english_out'>('marathi_in');

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage('marathi_out'), 2200),
      setTimeout(() => setStage('english_in'), 3000),
      setTimeout(() => setStage('english_out'), 5200),
      setTimeout(onComplete, 6200)
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-green-800 flex flex-col items-center justify-center z-[100] overflow-hidden">
      <div className="mb-12 animate-pulse">
        <ArogyaLogo className="w-28 h-28 shadow-2xl rounded-full bg-white/10 p-4" color="white" />
      </div>
      
      <div className="text-5xl lg:text-7xl font-black text-white min-h-[1.5em] text-center px-4 tracking-tighter">
        {(stage === 'marathi_in' || stage === 'marathi_out') && (
          <SideSlideText text="आरोग्य स्वार्म" isOut={stage === 'marathi_out'} />
        )}
        {(stage === 'english_in' || stage === 'english_out') && (
          <SideSlideText text="Arogya Swarm" isOut={stage === 'english_out'} />
        )}
      </div>

      <div className="mt-8 flex flex-col items-center space-y-2">
        <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-green-400 animate-[loading_6s_linear]" />
        </div>
        <p className="text-green-300 tracking-[0.3em] uppercase text-[10px] font-black opacity-80">
          Empowering Rural Health with AI
        </p>
      </div>

      <style>{`
        @keyframes loading {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

const RoleSelection: React.FC<{ onSelect: (role: UserRole) => void; lang: 'hi' | 'en'; setLang: (l: 'hi' | 'en') => void }> = ({ onSelect, lang, setLang }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-1000">
    <div className="max-w-md w-full text-center space-y-10">
      <div className="flex flex-col items-center relative">
        <button 
          onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
          className="absolute -top-4 -right-4 bg-white p-3 rounded-full shadow-md border border-slate-100 flex items-center space-x-2 text-xs font-black text-slate-600 active:scale-95 transition-all"
        >
          <Globe size={16} className="text-green-600" />
          <span>{lang === 'hi' ? 'EN' : 'हिन्दी'}</span>
        </button>
        <ArogyaLogo className="w-24 h-24 text-green-700 mb-6 drop-shadow-xl" />
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Arogya Swarm</h1>
        <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-xs">
          {lang === 'hi' ? 'ग्रामीण एआई स्वास्थ्य सहायक' : 'Rural AI Health Assistant'}
        </p>
      </div>

      <div className="space-y-4">
        <button onClick={() => onSelect(UserRole.ASHA)} className="w-full bg-white p-6 rounded-[2rem] shadow-sm border-2 border-transparent hover:border-green-600 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center group">
          <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center group-hover:bg-green-600 transition-colors">
            <Users className="text-green-600 group-hover:text-white" />
          </div>
          <div className="ml-5 text-left">
            <h2 className="text-xl font-bold text-slate-900">{lang === 'hi' ? 'आशा कार्यकर्ता' : 'ASHA Worker'}</h2>
            <p className="text-slate-400 text-sm">{lang === 'hi' ? 'सामुदायिक निगरानी' : 'Community Monitoring'}</p>
          </div>
        </button>

        <button onClick={() => onSelect(UserRole.DOCTOR)} className="w-full bg-white p-6 rounded-[2rem] shadow-sm border-2 border-transparent hover:border-blue-600 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center group">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
            <Stethoscope className="text-blue-600 group-hover:text-white" />
          </div>
          <div className="ml-5 text-left">
            <h2 className="text-xl font-bold text-slate-900">{lang === 'hi' ? 'डॉक्टर' : 'Doctor'}</h2>
            <p className="text-slate-400 text-sm">{lang === 'hi' ? 'विशेषज्ञ परामर्श' : 'Expert Consultation'}</p>
          </div>
        </button>

        <button onClick={() => onSelect(UserRole.PATIENT)} className="w-full bg-white p-6 rounded-[2rem] shadow-sm border-2 border-transparent hover:border-orange-600 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center group">
          <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:bg-orange-600 transition-colors">
            <UserCircle2 className="text-orange-600 group-hover:text-white" />
          </div>
          <div className="ml-5 text-left">
            <h2 className="text-xl font-bold text-slate-900">{lang === 'hi' ? 'मरीज / परिवार' : 'Patient / Family'}</h2>
            <p className="text-slate-400 text-sm">{lang === 'hi' ? 'व्यक्तिगत डैशबोर्ड' : 'Personal Dashboard'}</p>
          </div>
        </button>
      </div>
    </div>
  </div>
);

const Login: React.FC<{ role: UserRole; onLogin: () => void; onBack: () => void; lang: 'hi' | 'en' }> = ({ role, onLogin, onBack, lang }) => {
  const [formData, setFormData] = useState({ id: '', pin: '', phone: '', confirmPin: '', name: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleEmailSignUp = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    // Validate passwords match
    if (formData.pin !== formData.confirmPin) {
      setError(lang === 'hi' ? 'पासवर्ड मेल नहीं खाते।' : 'Passwords do not match.');
      setIsLoading(false);
      return;
    }
    
    // Validate password length
    if (formData.pin.length < 6) {
      setError(lang === 'hi' ? 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए।' : 'Password must be at least 6 characters.');
      setIsLoading(false);
      return;
    }
    
    try {
      const email = formData.id.includes('@') ? formData.id : `${formData.id}@arogyaswarm.in`;
      await registerWithEmail(email, formData.pin);
      setSuccess(lang === 'hi' ? 'खाता बनाया गया! अब लॉगिन करें।' : 'Account created! Please login now.');
      setIsSignUp(false);
      setFormData({ ...formData, pin: '', confirmPin: '' });
    } catch (err: any) {
      console.error('Sign up failed:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError(lang === 'hi' ? 'यह ID पहले से पंजीकृत है।' : 'This ID is already registered.');
      } else {
        setError(lang === 'hi' ? 'पंजीकरण विफल। कृपया पुनः प्रयास करें।' : 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // For ASHA/Doctor: use ID as email (or append @arogyaswarm.in)
      const email = formData.id.includes('@') ? formData.id : `${formData.id}@arogyaswarm.in`;
      await loginWithEmail(email, formData.pin);
      onLogin();
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(lang === 'hi' ? 'लॉगिन विफल। कृपया पुनः प्रयास करें।' : 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const phoneNumber = formData.phone.startsWith('+') ? formData.phone : `+91${formData.phone}`;
      const result = await sendOTP(phoneNumber, 'recaptcha-container');
      setConfirmationResult(result);
      setOtpSent(true);
    } catch (err: any) {
      console.error('OTP send failed:', err);
      setError(lang === 'hi' ? 'OTP भेजने में विफल। कृपया पुनः प्रयास करें।' : 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!confirmationResult) return;
    setIsLoading(true);
    setError(null);
    try {
      await verifyOTP(confirmationResult, otp);
      onLogin();
    } catch (err: any) {
      console.error('OTP verification failed:', err);
      setError(lang === 'hi' ? 'गलत OTP। कृपया पुनः प्रयास करें।' : 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    if (role === UserRole.PATIENT) {
      if (otpSent) {
        handleVerifyOTP();
      } else {
        handleSendOTP();
      }
    } else {
      if (isSignUp) {
        handleEmailSignUp();
      } else {
        handleEmailLogin();
      }
    }
  };

  const roleInfo = {
    [UserRole.ASHA]: { 
      title: isSignUp 
        ? (lang === 'hi' ? 'आशा कार्यकर्ता पंजीकरण' : 'ASHA Worker Sign Up')
        : (lang === 'hi' ? 'आशा कार्यकर्ता लॉगिन' : 'ASHA Worker Login'),
      icon: <Users className="text-green-600" />,
      fields: ['id', 'pin'],
      placeholders: { id: lang === 'hi' ? 'ASHA ID लिखें' : 'Enter ASHA ID', pin: lang === 'hi' ? 'पिन लिखें' : 'Enter PIN' }
    },
    [UserRole.DOCTOR]: { 
      title: isSignUp
        ? (lang === 'hi' ? 'डॉक्टर पंजीकरण' : 'Doctor Sign Up')
        : (lang === 'hi' ? 'डॉक्टर लॉगिन' : 'Doctor Login'),
      icon: <Stethoscope className="text-blue-600" />,
      fields: ['id', 'pin'],
      placeholders: { id: lang === 'hi' ? 'पंजीकरण संख्या' : 'Registration No.', pin: lang === 'hi' ? 'पासवर्ड' : 'Password' }
    },
    [UserRole.PATIENT]: { 
      title: lang === 'hi' ? 'मरीज लॉगिन' : 'Patient Login',
      icon: <UserCircle2 className="text-orange-600" />,
      fields: ['phone'],
      placeholders: { phone: lang === 'hi' ? 'मोबाइल नंबर लिखें' : 'Enter Mobile Number' }
    },
  }[role];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-900 font-bold flex items-center text-sm uppercase tracking-widest transition-colors">
          ← {lang === 'hi' ? 'पीछे' : 'Back'}
        </button>

        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-[1.5rem] bg-slate-50 flex items-center justify-center shadow-inner">
            {roleInfo.icon}
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{roleInfo.title}</h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm font-bold text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl text-sm font-bold text-center">
            {success}
          </div>
        )}

        <div className="space-y-4">
          {/* Name field for sign up */}
          {isSignUp && roleInfo.fields.includes('id') && (
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder={lang === 'hi' ? 'पूरा नाम' : 'Full Name'} 
                className="w-full bg-slate-50 p-5 pl-14 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-green-500/20"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                disabled={isLoading}
              />
            </div>
          )}
          
          {roleInfo.fields.includes('id') && (
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder={roleInfo.placeholders.id} 
                className="w-full bg-slate-50 p-5 pl-14 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-green-500/20"
                value={formData.id}
                onChange={e => setFormData({...formData, id: e.target.value})}
                disabled={isLoading}
              />
            </div>
          )}
          {roleInfo.fields.includes('phone') && !otpSent && (
            <div className="relative">
              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="tel" 
                placeholder={roleInfo.placeholders.phone} 
                className="w-full bg-slate-50 p-5 pl-14 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                disabled={isLoading}
              />
            </div>
          )}
          {otpSent && role === UserRole.PATIENT && (
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder={lang === 'hi' ? 'OTP दर्ज करें' : 'Enter OTP'} 
                className="w-full bg-slate-50 p-5 pl-14 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-orange-500/20 text-center text-2xl tracking-[0.5em]"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={isLoading}
                maxLength={6}
              />
            </div>
          )}
          {roleInfo.fields.includes('pin') && (
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="password" 
                placeholder={roleInfo.placeholders.pin} 
                className="w-full bg-slate-50 p-5 pl-14 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.pin}
                onChange={e => setFormData({...formData, pin: e.target.value})}
                disabled={isLoading}
              />
            </div>
          )}
          
          {/* Confirm password field for sign up */}
          {isSignUp && roleInfo.fields.includes('pin') && (
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="password" 
                placeholder={lang === 'hi' ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'} 
                className="w-full bg-slate-50 p-5 pl-14 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.confirmPin}
                onChange={e => setFormData({...formData, confirmPin: e.target.value})}
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        {/* Invisible reCAPTCHA container for phone auth */}
        <div id="recaptcha-container"></div>

        {role === UserRole.ASHA && !isSignUp && (
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-center space-x-4 cursor-pointer active:scale-95 transition-all">
            <Fingerprint className="text-green-600" size={32} />
            <p className="text-xs font-black text-slate-600 uppercase tracking-widest">{lang === 'hi' ? 'फिंगरप्रिंट का उपयोग करें' : 'Use Fingerprint'}</p>
          </div>
        )}

        <Button 
          onClick={handleLogin} 
          variant={role === UserRole.ASHA ? 'primary' : role === UserRole.DOCTOR ? 'info' : 'warning'} 
          className="py-5 rounded-2xl shadow-xl"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="animate-spin mr-2" size={20} />
              {lang === 'hi' ? 'कृपया प्रतीक्षा करें...' : 'Please wait...'}
            </span>
          ) : otpSent && role === UserRole.PATIENT ? (
            lang === 'hi' ? 'OTP सत्यापित करें' : 'Verify OTP'
          ) : role === UserRole.PATIENT ? (
            lang === 'hi' ? 'OTP भेजें' : 'Send OTP'
          ) : isSignUp ? (
            lang === 'hi' ? 'पंजीकरण करें' : 'Sign Up'
          ) : (
            lang === 'hi' ? 'लॉगिन करें' : 'Login'
          )}
        </Button>

        {/* Sign Up / Login toggle for ASHA and Doctor */}
        {role !== UserRole.PATIENT && (
          <div className="text-center space-y-2">
            <p className="text-sm text-slate-500">
              {isSignUp 
                ? (lang === 'hi' ? 'पहले से खाता है?' : 'Already have an account?')
                : (lang === 'hi' ? 'नया उपयोगकर्ता?' : 'New user?')
              }
            </p>
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
                setFormData({ id: '', pin: '', phone: '', confirmPin: '', name: '' });
              }}
              className="text-blue-600 font-bold hover:underline uppercase tracking-widest text-xs"
            >
              {isSignUp 
                ? (lang === 'hi' ? 'लॉगिन करें' : 'Login Here')
                : (lang === 'hi' ? 'नया खाता बनाएं' : 'Create Account')
              }
            </button>
          </div>
        )}

        <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
          {lang === 'hi' ? 'क्या आप लॉग इन नहीं कर पा रहे हैं? सहायता लें' : 'Trouble logging in? Get Help'}
        </p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [lang, setLang] = useState<'hi' | 'en'>('en');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setFirebaseUser(user);
      setIsLoggedIn(!!user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!role) {
    return <RoleSelection onSelect={setRole} lang={lang} setLang={setLang} />;
  }

  if (!isLoggedIn) {
    return <Login role={role} onLogin={() => setIsLoggedIn(true)} onBack={() => setRole(null)} lang={lang} />;
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-green-100">
      <div className={`fixed top-0 left-0 right-0 h-1.5 z-[110] transition-colors ${isOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
      
      {role === UserRole.ASHA && <AshaApp onExit={async () => { await logout(); setRole(null); }} />}
      {role === UserRole.DOCTOR && <DoctorApp onExit={async () => { await logout(); setRole(null); }} />}
      {role === UserRole.PATIENT && <PatientApp onExit={async () => { await logout(); setRole(null); }} />}
      
      {!isOnline && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-xl text-white px-8 py-3 rounded-full text-sm font-bold flex items-center shadow-2xl z-[110] border border-gray-700/50">
          <span className="mr-3 text-xl">📡</span> {lang === 'hi' ? 'ऑफलाइन - काम जारी रखें' : 'Offline - Keep working'}
        </div>
      )}
    </div>
  );
};

export default App;
