
import React, { useState, useEffect } from 'react';
import { UserRole } from './types';
import AshaApp from './screens/AshaApp';
import DoctorApp from './screens/DoctorApp';
import PatientApp from './screens/PatientApp';
import { UserCircle2, Stethoscope, Users, Globe, Lock, Phone, User, Loader2, AlertCircle, Hash, UserCheck } from 'lucide-react';
import { ArogyaLogo } from './components/Logo';
import { Button } from './components/UI';
import { checkUserCredentials, createUserProfile } from './services/dataService';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
      <div className="flex flex-col items-center space-y-10 animate-in zoom-in fade-in duration-1000">
        <div className="relative">
          <div className="absolute inset-0 bg-sky-500/20 blur-3xl rounded-full animate-pulse" />
          <ArogyaLogo className="w-40 h-40 text-sky-400 relative z-10" />
        </div>
        <div className="space-y-4 text-center">
          <h1 className="text-7xl font-black text-white tracking-tighter animate-in slide-in-from-bottom-8 duration-1000 delay-300">
            आरोग्य स्वर्ण
          </h1>
          <p className="text-sky-400/60 font-black tracking-[0.5em] uppercase text-xs animate-in fade-in duration-1000 delay-700">
            Arogya Swarm
          </p>
        </div>
      </div>
    </div>
  );
};

const RoleSelection: React.FC<{ onSelect: (role: UserRole) => void; lang: 'hi' | 'en'; setLang: (l: 'hi' | 'en') => void }> = ({ onSelect, lang, setLang }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
    <div className="max-w-md w-full text-center space-y-12">
      <div className="flex flex-col items-center relative">
        <button 
          onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')} 
          className="absolute -top-4 -right-4 bg-white p-4 rounded-full shadow-lg border border-slate-100 flex items-center space-x-2 text-xs font-black text-slate-600 active:scale-90 transition-all z-10"
        >
          <Globe size={18} className="text-sky-500" />
          <span>{lang === 'hi' ? 'EN' : 'हिन्दी'}</span>
        </button>
        <ArogyaLogo className="w-28 h-28 mb-8 text-sky-600" />
        <h1 className="text-5xl font-black text-slate-900 tracking-tight">आरोग्य स्वर्ण</h1>
        <p className="text-slate-400 mt-3 font-bold uppercase tracking-widest text-[10px]">{lang === 'hi' ? 'ग्रामीण एआई स्वास्थ्य सहायक' : 'Rural AI Health Assistant'}</p>
      </div>
      <div className="space-y-5">
        {[ {r: UserRole.ASHA, t: lang === 'hi' ? 'आशा कार्यकर्ता' : 'ASHA Worker', s: lang === 'hi' ? 'सामुदायिक निगरानी' : 'Community Monitoring', i: <Users className="text-green-600" />, c: 'green' },
           {r: UserRole.DOCTOR, t: lang === 'hi' ? 'डॉक्टर' : 'Doctor', s: lang === 'hi' ? 'विशेषज्ञ परामर्श' : 'Expert Consultation', i: <Stethoscope className="text-blue-600" />, c: 'blue' },
           {r: UserRole.PATIENT, t: lang === 'hi' ? 'मरीज / परिवार' : 'Patient / Family', s: lang === 'hi' ? 'व्यक्तिगत डैशबोर्ड' : 'Personal Dashboard', i: <UserCircle2 className="text-orange-600" />, c: 'orange' }
        ].map(item => (
          <button 
            key={item.r} 
            onClick={() => onSelect(item.r)} 
            className={`w-full bg-white p-8 rounded-[2.5rem] shadow-sm border-2 border-transparent hover:border-${item.c}-600 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center group active:scale-95`}
          >
            <div className={`w-16 h-16 bg-${item.c}-50 rounded-2xl flex items-center justify-center group-hover:bg-${item.c}-600 group-hover:text-white transition-all`}>
              {React.cloneElement(item.i as React.ReactElement, { size: 32 })}
            </div>
            <div className="ml-6 text-left">
              <h2 className="text-2xl font-black text-slate-900 leading-tight">{item.t}</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">{item.s}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
);

const Login: React.FC<{ role: UserRole; onLogin: (user: any) => void; onBack: () => void; lang: 'hi' | 'en' }> = ({ role, onLogin, onBack, lang }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ uid: '', password: '', phone: '', name: '', age: '', gender: 'Male' });
  
  const roleInfo = {
    [UserRole.ASHA]: { title: lang === 'hi' ? 'आशा कार्यकर्ता' : 'ASHA Worker', icon: <Users className="text-green-600" />, color: 'green', idLabel: lang === 'hi' ? 'आशा आईडी' : 'ASHA ID' },
    [UserRole.DOCTOR]: { title: lang === 'hi' ? 'डॉक्टर' : 'Doctor', icon: <Stethoscope className="text-blue-600" />, color: 'blue', idLabel: lang === 'hi' ? 'रजिस्ट्रेशन नंबर' : 'Reg No.' },
    [UserRole.PATIENT]: { title: lang === 'hi' ? 'मरीज / परिवार' : 'Patient / Family', icon: <UserCircle2 className="text-orange-600" />, color: 'orange', idLabel: lang === 'hi' ? 'आधार / आईडी' : 'Patient ID' },
  }[role];

  const handleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        if (!formData.name || !formData.age || !formData.uid || !formData.phone || !formData.password) {
          throw new Error(lang === 'hi' ? "कृपया सभी जानकारी भरें" : "Please fill all details");
        }
        const profile = await createUserProfile({ ...formData, age: parseInt(formData.age), role });
        onLogin(profile);
      } else {
        if (!formData.phone || !formData.password) {
          throw new Error(lang === 'hi' ? "मोबाइल नंबर और पासवर्ड भरें" : "Enter Mobile and Password");
        }
        const user = await checkUserCredentials(role, formData.phone, formData.password);
        if (user) onLogin(user);
        else throw new Error(lang === 'hi' ? "जानकारी गलत है" : "Incorrect login details.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
      <div className="max-w-md w-full bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 space-y-8">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-900 font-black flex items-center text-[10px] uppercase tracking-[0.3em]">
          ← {lang === 'hi' ? 'पीछे' : 'Back'}
        </button>
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-50 flex items-center justify-center shadow-inner">
            {React.cloneElement(roleInfo.icon as React.ReactElement, { size: 40 })}
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {isSignUp ? (lang === 'hi' ? 'नया पंजीकरण' : 'Sign Up') : (lang === 'hi' ? 'लॉगिन' : 'Login')}
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{roleInfo.title}</p>
        </div>
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center space-x-3 text-xs font-bold border border-red-100">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        <div className="space-y-4">
          {isSignUp && (
            <>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input type="text" placeholder={lang === 'hi' ? 'पूरा नाम' : 'Full Name'} className="w-full bg-slate-50 p-5 pl-14 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-sky-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="number" placeholder={lang === 'hi' ? 'उम्र' : 'Age'} className="w-full bg-slate-50 p-5 pl-14 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-sky-500 outline-none" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                </div>
                <div className="relative flex-1">
                  <UserCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select className="w-full bg-slate-50 p-5 pl-14 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-sky-500 outline-none appearance-none" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <div className="relative">
                <UserCircle2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input type="text" placeholder={roleInfo.idLabel} className="w-full bg-slate-50 p-5 pl-14 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-sky-500 outline-none" value={formData.uid} onChange={e => setFormData({...formData, uid: e.target.value})} />
              </div>
            </>
          )}
          <div className="relative">
            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="tel" placeholder={lang === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'} className="w-full bg-slate-50 p-5 pl-14 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-sky-500 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="password" placeholder={lang === 'hi' ? 'गुप्त पासवर्ड' : 'Password'} className="w-full bg-slate-50 p-5 pl-14 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-sky-500 outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
        </div>
        <Button 
          onClick={handleAuth} 
          variant={role === UserRole.ASHA ? 'primary' : role === UserRole.DOCTOR ? 'info' : 'warning'} 
          className="py-5 rounded-2xl shadow-xl shadow-slate-100" 
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? (lang === 'hi' ? 'रजिस्टर करें' : 'Sign Up') : (lang === 'hi' ? 'प्रवेश करें' : 'Login'))}
        </Button>
        <div className="text-center pt-2">
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }} 
            className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors"
          >
            {isSignUp ? (lang === 'hi' ? 'लॉगिन करें' : 'Back to Login') : (lang === 'hi' ? 'नया खाता बनाएं' : 'New User? Create Account')}
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
  const [splashVisible, setSplashVisible] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);
  const [lang, setLang] = useState<'hi' | 'en'>('hi');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashVisible(false);
      setTimeout(() => setContentVisible(true), 500); // Small delay to let splash fade out
    }, 2500);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden relative">
      {/* Splash Screen Layer */}
      <div 
        className={`fixed inset-0 z-[100] transition-opacity duration-1000 bg-slate-950 ${splashVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
         <SplashScreen />
      </div>

      {/* Main Content Layer */}
      <div 
        className={`transition-all duration-1000 transform ${contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        {!role ? (
          <RoleSelection onSelect={setRole} lang={lang} setLang={setLang} />
        ) : !isLoggedIn ? (
          <Login role={role} onLogin={(u) => { setUser(u); setIsLoggedIn(true); }} onBack={() => setRole(null)} lang={lang} />
        ) : (
          <div className="animate-in fade-in duration-700">
            {role === UserRole.ASHA && <AshaApp user={user} lang={lang} onExit={() => { setIsLoggedIn(false); setRole(null); }} />}
            {role === UserRole.DOCTOR && <DoctorApp user={user} onExit={() => { setIsLoggedIn(false); setRole(null); }} lang={lang} />}
            {role === UserRole.PATIENT && <PatientApp user={user} lang={lang} onExit={() => { setIsLoggedIn(false); setRole(null); }} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
