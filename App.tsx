
import React, { useState, useEffect } from 'react';
import { UserRole } from './types';
import AshaApp from './screens/AshaApp';
import DoctorApp from './screens/DoctorApp';
import PatientApp from './screens/PatientApp';
import { UserCircle2, Stethoscope, Users, Globe, Lock, Phone, User, Fingerprint, Loader2, AlertCircle } from 'lucide-react';
import { ArogyaLogo } from './components/Logo';
import { Button } from './components/UI';
import { checkUserCredentials, createUserProfile } from './services/dataService';

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

const Login: React.FC<{ role: UserRole; onLogin: (user: any) => void; onBack: () => void; lang: 'hi' | 'en' }> = ({ role, onLogin, onBack, lang }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ id: '', pin: '', phone: '', name: '' });
  
  const roleInfo = {
    [UserRole.ASHA]: { 
      title: lang === 'hi' ? 'आशा कार्यकर्ता' : 'ASHA Worker',
      icon: <Users className="text-green-600" />,
      color: 'bg-green-600',
      idLabel: lang === 'hi' ? 'ASHA ID' : 'ASHA ID'
    },
    [UserRole.DOCTOR]: { 
      title: lang === 'hi' ? 'डॉक्टर' : 'Doctor',
      icon: <Stethoscope className="text-blue-600" />,
      color: 'bg-blue-600',
      idLabel: lang === 'hi' ? 'पंजीकरण संख्या' : 'Registration No.'
    },
    [UserRole.PATIENT]: { 
      title: lang === 'hi' ? 'मरीज / परिवार' : 'Patient / Family',
      icon: <UserCircle2 className="text-orange-600" />,
      color: 'bg-orange-600',
      idLabel: lang === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'
    },
  }[role];

  const handleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        // Validation
        if (!formData.name) throw new Error("Please enter your name");
        const uid = role === UserRole.PATIENT ? formData.phone : formData.id;
        if (!uid) throw new Error(`Please enter ${roleInfo.idLabel}`);
        
        const newProfile = await createUserProfile({
          uid,
          name: formData.name,
          role,
          pin: role !== UserRole.PATIENT ? formData.pin : undefined,
          phone: role === UserRole.PATIENT ? formData.phone : undefined
        });
        onLogin({ id: newProfile.id, name: formData.name, role });
      } else {
        const uid = role === UserRole.PATIENT ? formData.phone : formData.id;
        const user = await checkUserCredentials(role, uid, role !== UserRole.PATIENT ? formData.pin : undefined);
        if (user) {
          onLogin(user);
        } else {
          throw new Error("Invalid credentials or user not found");
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

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
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
            {isSignUp ? (lang === 'hi' ? 'नया पंजीकरण' : 'New Registration') : `${roleInfo.title} ${lang === 'hi' ? 'लॉगिन' : 'Login'}`}
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center space-x-3 text-sm font-bold animate-in shake duration-300">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {isSignUp && (
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder={lang === 'hi' ? 'अपना नाम लिखें' : 'Enter your name'} 
                className="w-full bg-slate-50 p-5 pl-14 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-slate-200"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}

          {role !== UserRole.PATIENT ? (
            <>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder={roleInfo.idLabel} 
                  className="w-full bg-slate-50 p-5 pl-14 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-slate-200"
                  value={formData.id}
                  onChange={e => setFormData({...formData, id: e.target.value})}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="password" 
                  placeholder={lang === 'hi' ? 'पिन लिखें' : 'Enter PIN'} 
                  className="w-full bg-slate-50 p-5 pl-14 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-slate-200"
                  value={formData.pin}
                  onChange={e => setFormData({...formData, pin: e.target.value})}
                />
              </div>
            </>
          ) : (
            <div className="relative">
              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="tel" 
                placeholder={roleInfo.idLabel} 
                className="w-full bg-slate-50 p-5 pl-14 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-slate-200"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          )}
        </div>

        <Button 
          onClick={handleAuth} 
          variant={role === UserRole.ASHA ? 'primary' : role === UserRole.DOCTOR ? 'info' : 'warning'} 
          className="py-5 rounded-2xl shadow-xl"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            isSignUp ? (lang === 'hi' ? 'रजिस्टर करें' : 'Sign Up') : (lang === 'hi' ? 'लॉगिन करें' : 'Login')
          )}
        </Button>

        <div className="text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
          >
            {isSignUp ? (lang === 'hi' ? 'पहले से खाता है? लॉगिन करें' : 'Already have an account? Login') : (lang === 'hi' ? 'नया खाता बनाएं' : 'Don\'t have an account? Sign Up')}
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [lang, setLang] = useState<'hi' | 'en'>('en');

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
    return (
      <Login 
        role={role} 
        onLogin={(userData) => { 
          setUser(userData);
          setIsLoggedIn(true); 
        }} 
        onBack={() => setRole(null)} 
        lang={lang} 
      />
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-green-100">
      <div className={`fixed top-0 left-0 right-0 h-1.5 z-[110] transition-colors ${isOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
      
      {role === UserRole.ASHA && <AshaApp user={user} onExit={() => { setIsLoggedIn(false); setRole(null); }} />}
      {role === UserRole.DOCTOR && <DoctorApp user={user} onExit={() => { setIsLoggedIn(false); setRole(null); }} />}
      {role === UserRole.PATIENT && <PatientApp user={user} onExit={() => { setIsLoggedIn(false); setRole(null); }} />}
      
      {!isOnline && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-xl text-white px-8 py-3 rounded-full text-sm font-bold flex items-center shadow-2xl z-[110] border border-gray-700/50">
          <span className="mr-3 text-xl">📡</span> {lang === 'hi' ? 'ऑफलाइन - काम जारी रखें' : 'Offline - Keep working'}
        </div>
      )}
    </div>
  );
};

export default App;
