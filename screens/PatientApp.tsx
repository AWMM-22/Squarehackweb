
import React, { useState, useEffect, useRef } from 'react';
import { Header, Card, Button } from '../components/UI';
import { 
  Heart, Users, Thermometer, Droplets, 
  Stethoscope, FileText, Apple, Bell,
  ChevronRight, Mic, CheckCircle2, UserPlus, X, Info, Home,
  User, Activity, BookOpen, UserCircle, Plus, Hash, Users2,
  Volume2, Loader2, AlertCircle, PhoneCall, MessageSquare
} from 'lucide-react';
import { 
  getNutritionAdvice, 
  analyzeSymptoms, 
  generateFollowUpQuestion,
  generateNutritionQuestion,
  getFinalNutritionAdvice
} from '../services/geminiService';
import { subscribeToFamily, addFamilyMember, sendDoctorInquiry, subscribeToPatientResponses, DoctorInquiry } from '../services/dataService';
import { FamilyMember, RiskLevel } from '../types';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const AddMemberModal: React.FC<{ 
  onClose: () => void; 
  onSave: (m: FamilyMember) => void;
  parentPhone: string;
}> = ({ onClose, onSave, parentPhone }) => {
  const [formData, setFormData] = useState({ name: '', age: '', gender: 'Male', relation: 'Family' });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!formData.name || !formData.age) return;
    setLoading(true);
    const newMember: FamilyMember = {
      parent_phone: parentPhone,
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender,
      relation: formData.relation
    };
    await addFamilyMember(newMember);
    onSave(newMember);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-t-[3.5rem] sm:rounded-[3.5rem] p-10 space-y-8 shadow-2xl animate-in slide-in-from-bottom-20 duration-500">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Add Member</h2>
          <button onClick={onClose} className="p-3 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 active:scale-90 transition-all"><X size={24} /></button>
        </div>
        
        <div className="space-y-5">
          <div className="relative">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
            <input type="text" placeholder="Full Name" className="w-full bg-slate-50 p-5 pl-14 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-orange-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="number" placeholder="Age" className="w-full bg-slate-50 p-5 pl-14 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-orange-500 outline-none" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
            </div>
            <div className="relative flex-1">
              <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <select className="w-full bg-slate-50 p-5 pl-14 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-orange-500 outline-none appearance-none" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="relative">
            <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
            <input type="text" placeholder="Relation (e.g. Wife, Son)" className="w-full bg-slate-50 p-5 pl-14 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-orange-500 outline-none" value={formData.relation} onChange={e => setFormData({...formData, relation: e.target.value})} />
          </div>
        </div>
        <Button onClick={handleSave} variant="warning" className="py-5 rounded-3xl text-base shadow-xl shadow-orange-100" disabled={loading}>{loading ? "Saving..." : "Save Family Member"}</Button>
      </div>
    </div>
  );
};

const PatientApp: React.FC<{ onExit: () => void; user: any; lang: 'hi' | 'en' }> = ({ onExit, user, lang }) => {
  const [activeScreen, setActiveScreen] = useState<'HOME' | 'SYMPTOMS' | 'NUTRITION' | 'DOCTOR_CONSULT'>('HOME');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [drResponses, setDrResponses] = useState<DoctorInquiry[]>([]);

  // Consultation State
  const MAX_USER_INPUTS = 3; 
  const [step, setStep] = useState<'SELECT' | 'TALKING' | 'RESULT'>('SELECT');
  const [inputCount, setInputCount] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<{question: string, hindiQuestion: string} | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [consultResult, setConsultResult] = useState<any>(null);

  const recognition = useRef<any>(null);
  
  // Stale closure protection using Ref
  const stateRef = useRef({ 
    inputCount, 
    history, 
    currentQuestion, 
    isProcessing, 
    activeScreen, 
    selectedMember, 
    user 
  });

  useEffect(() => {
    stateRef.current = { 
      inputCount, 
      history, 
      currentQuestion, 
      isProcessing, 
      activeScreen, 
      selectedMember, 
      user 
    };
  }, [inputCount, history, currentQuestion, isProcessing, activeScreen, selectedMember, user]);

  useEffect(() => {
    resetSession();
  }, [activeScreen]);

  const resetSession = () => {
    setStep('SELECT');
    setInputCount(0);
    setHistory([]);
    setConsultResult(null);
    setCurrentQuestion(null);
    setIsProcessing(false);
    setIsListening(false);
    if (recognition.current) {
      try { recognition.current.stop(); } catch(e) {}
    }
  };

  const initRecognition = () => {
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      rec.onstart = () => setIsListening(true);
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceInput(transcript);
        setIsListening(false);
      };
      
      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e.error);
        setIsListening(false);
      };
      
      rec.onend = () => {
        setIsListening(false);
      };

      recognition.current = rec;
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToFamily(user.phone, setFamilyMembers);
    const unsubResponses = subscribeToPatientResponses(user.phone, setDrResponses);
    
    initRecognition();
    
    return () => { 
      unsubscribe(); 
      unsubResponses(); 
      if (recognition.current) {
        try { recognition.current.stop(); } catch(e) {}
      }
    };
  }, [user.phone, lang]);

  const speak = (text: string, textHindi: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const actualText = lang === 'hi' ? textHindi : text;
      const utterance = new SpeechSynthesisUtterance(actualText);
      utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.startsWith(lang === 'hi' ? 'hi' : 'en'));
      if (preferredVoice) utterance.voice = preferredVoice;
      
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if (!SpeechRecognition) {
      alert(lang === 'hi' ? "आपका ब्राउज़र वॉयस इनपुट का समर्थन नहीं करता है।" : "Your browser does not support voice input.");
      return;
    }

    initRecognition();

    if (recognition.current) {
      window.speechSynthesis.cancel();
      recognition.current.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
      try { 
        recognition.current.start(); 
      } catch (e) {
        console.warn("Recognition start failed or already active:", e);
      }
    }
  };

  const handleVoiceInput = async (transcript: string) => {
    if (stateRef.current.isProcessing) return;
    
    const { inputCount: curCount, history: curHist, currentQuestion: curQ, activeScreen: curMode } = stateRef.current;
    
    const nextCount = curCount + 1;
    if (nextCount > MAX_USER_INPUTS) return;

    setIsProcessing(true);
    setInputCount(nextCount);

    let newHistory: string[];
    if (nextCount === 1) {
      newHistory = [`User problem: ${transcript}`];
    } else {
      newHistory = [...curHist, `AI: ${curQ?.question || 'Follow-up'}`, `User: ${transcript}`];
    }
    setHistory(newHistory);

    try {
      if (nextCount < MAX_USER_INPUTS) {
        await askNextQuestion(newHistory, nextCount, curMode);
      } else {
        await finishConsultation(newHistory, curMode);
      }
    } catch (error) {
      console.error("AI Error:", error);
      setIsProcessing(false);
    }
  };

  const askNextQuestion = async (hist: string[], count: number, mode: string) => {
    const member = selectedMember || user;
    
    try {
      let nextQ;
      if (mode === 'SYMPTOMS') {
        nextQ = await generateFollowUpQuestion([], member.age, hist, count, lang);
      } else if (mode === 'NUTRITION') {
        nextQ = await generateNutritionQuestion(hist, member.age, count, lang);
      } else {
        const questions = [
          { question: "Where exactly is the pain or problem located?", hindiQuestion: "तकलीफ शरीर के किस हिस्से में हो रही है?" },
          { question: "How long has this been bothering you?", hindiQuestion: "यह समस्या आपको कितने दिनों से है?" }
        ];
        nextQ = questions[count - 1] || questions[0];
      }
      
      setCurrentQuestion(nextQ);
      speak(nextQ.question, nextQ.hindiQuestion);
    } catch (e) {
      const fallback = { 
        question: "Please tell me more about your condition.", 
        hindiQuestion: "कृपया मुझे अपनी स्थिति के बारे में थोड़ा और बताएं।" 
      };
      setCurrentQuestion(fallback);
      speak(fallback.question, fallback.hindiQuestion);
    } finally {
      setIsProcessing(false);
    }
  };

  const finishConsultation = async (hist: string[], mode: string) => {
    const member = selectedMember || user;
    
    try {
      if (mode === 'DOCTOR_CONSULT') {
        await sendDoctorInquiry({
          patient_id: user.phone,
          patient_name: member.name,
          phone: user.phone,
          problem_desc: hist[0].replace('User problem: ', ''),
          follow_up_answers: hist.filter(s => s.startsWith('User: ')).map(s => s.replace('User: ', ''))
        });
        setConsultResult({ type: 'DR_SENT' });
        speak("Sent to doctors. Check home screen later.", "डॉक्टरों को भेज दिया गया है। बाद में होम स्क्रीन देखें।");
      } else {
        let result;
        if (mode === 'SYMPTOMS') {
          result = await analyzeSymptoms([], member.age, member.gender, hist, lang);
        } else {
          result = await getFinalNutritionAdvice(hist, member.age, lang);
        }
        setConsultResult(result);
        if (mode === 'NUTRITION') {
          speak(result.summary, result.summary);
        } else {
          speak(`Findings: ${result.diagnosis}. Steps: ${result.recommendations.join(', ')}`, `${result.diagnosis}. ये कदम उठाएं: ${result.recommendations.join(', ')}`);
        }
      }
      setStep('RESULT');
    } catch (e) {
      console.error("Final Result Error:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderHome = () => (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-24">
      <div className="py-8 px-4 flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">
            {lang === 'hi' ? `नमस्ते ${user?.name?.split(' ')[0]}!` : `Hello ${user?.name?.split(' ')[0]}!`} 🙏
          </h2>
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] mt-1">Village Rampur • Ward 3</p>
        </div>
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 active:scale-90 transition-all cursor-pointer">
          <Bell className="text-slate-400" />
        </div>
      </div>

      {drResponses.length > 0 && (
        <section className="px-2">
          <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-4">Doctor's Recommendations</h3>
          <div className="space-y-4">
            {drResponses.map(res => (
              <Card key={res.id} className="p-8 bg-blue-600 text-white rounded-[2.5rem] shadow-xl shadow-blue-100 border-none animate-in zoom-in-95 duration-500">
                <div className="flex items-center space-x-4 mb-3">
                   <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md"><Stethoscope size={20} /></div>
                   <p className="text-[10px] font-black uppercase tracking-widest">From {res.doctor_name}</p>
                </div>
                <p className="font-bold text-xl leading-tight tracking-tight">{res.doctor_response}</p>
                <button 
                  onClick={() => speak(res.doctor_response!, res.doctor_response!)} 
                  className="mt-6 bg-white/10 hover:bg-white/20 active:scale-95 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center transition-all"
                >
                  <Volume2 size={16} className="mr-2" /> Play Voice Advice
                </button>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em]">Your Family</h3>
          <button 
            onClick={() => setIsAddingMember(true)} 
            className="text-orange-600 text-[10px] font-black uppercase tracking-widest flex items-center border-2 border-orange-50 bg-white px-5 py-2.5 rounded-full active:scale-95 transition-all shadow-sm"
          >
            <UserPlus size={16} className="mr-2" /> Add Member
          </button>
        </div>
        <Card className="p-0 overflow-hidden shadow-xl border-none rounded-[3.5rem] bg-white">
          <div className="p-8 flex items-center justify-between border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 font-black text-2xl shadow-inner">{user?.name[0]}</div>
              <div>
                <p className="font-black text-slate-900 text-xl leading-none">{user?.name} (You)</p>
                <p className="bg-green-100 text-green-700 inline-block px-3 py-1 rounded-xl text-[10px] font-black uppercase mt-3 border border-green-200">Active Profile</p>
              </div>
            </div>
            <ChevronRight className="text-slate-200" />
          </div>
          {familyMembers.map((member, idx) => (
            <div key={idx} className="p-8 flex items-center justify-between border-b last:border-b-0 border-slate-50 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center space-x-6">
                <div className={`w-16 h-16 ${member.gender === 'Female' ? 'bg-pink-100 text-pink-600' : 'bg-orange-100 text-orange-600'} rounded-3xl flex items-center justify-center font-black text-2xl shadow-inner`}>{member.name[0]}</div>
                <div>
                  <p className="font-black text-slate-900 text-xl leading-none">{member.name}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase mt-2 tracking-widest">{member.age} Y • {member.gender} • {member.relation}</p>
                </div>
              </div>
              <ChevronRight className="text-slate-200" />
            </div>
          ))}
        </Card>
      </section>

      <div className="grid grid-cols-2 gap-5 pt-4">
        <button 
          onClick={() => setActiveScreen('SYMPTOMS')} 
          className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-5 hover:shadow-2xl transition-all active:scale-95 group"
        >
          <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform"><Thermometer size={48} strokeWidth={2.5} /></div>
          <div className="space-y-1">
            <span className="font-black text-slate-900 text-xl block leading-none">{lang === 'hi' ? 'स्वास्थ्य जांच' : 'Health Check'}</span>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mt-1">AI Scan</span>
          </div>
        </button>
        <button 
          onClick={() => setActiveScreen('NUTRITION')} 
          className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-5 hover:shadow-2xl transition-all active:scale-95 group"
        >
          <div className="w-24 h-24 bg-green-50 rounded-[2rem] flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform"><Apple size={48} strokeWidth={2.5} /></div>
          <div className="space-y-1">
            <span className="font-black text-slate-900 text-xl block leading-none">{lang === 'hi' ? 'पोषण सलाह' : 'Diet Guide'}</span>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mt-1">Rural AI</span>
          </div>
        </button>
      </div>

      <button 
        onClick={() => setActiveScreen('DOCTOR_CONSULT')} 
        className="w-full bg-slate-900 text-white p-10 rounded-[4rem] flex items-center justify-between group active:scale-[0.98] transition-all shadow-2xl shadow-slate-200"
      >
        <div className="flex items-center space-x-8">
           <div className="w-20 h-20 bg-white/10 rounded-[1.75rem] flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform"><Stethoscope size={40} /></div>
           <div className="text-left">
              <p className="font-black text-2xl tracking-tight leading-none">{lang === 'hi' ? 'विशेषज्ञ डॉक्टर' : 'Direct Doctor'}</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-3">Priority Consultation</p>
           </div>
        </div>
        <ChevronRight className="text-slate-700" size={32} />
      </button>
    </div>
  );

  const renderConsultation = (mode: 'SYMPTOMS' | 'NUTRITION' | 'DOCTOR_CONSULT') => (
    <div className="p-4 flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-right-10 duration-700 pb-32 min-h-[85vh]">
      {step === 'SELECT' && (
        <div className="space-y-14 py-10 w-full">
          <div className="text-center space-y-6">
            <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-none px-4">
              {lang === 'hi' ? 'किसे सहायता चाहिए?' : 'Who needs help?'}
            </h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Select Family Member to Begin</p>
          </div>
          <div className="space-y-4 px-2">
            {[ {name: user.name, age: user.age, gender: user.gender, isMe: true}, ...familyMembers ].map((m, idx) => (
              <button 
                key={idx} 
                onClick={() => { 
                  setSelectedMember(m as FamilyMember); 
                  setStep('TALKING'); 
                  const greeting = mode === 'DOCTOR_CONSULT' ? ["What is your problem? Please describe clearly.", "आपकी समस्या क्या है? कृपया विस्तार से बताएं।"] :
                                   mode === 'NUTRITION' ? ["What did you eat today?", "आज आपने क्या खाया?"] :
                                   ["Describe your symptoms please.", "कृपया अपने लक्षणों के बारे में बताएं।"];
                  speak(greeting[0], greeting[1]);
                }} 
                className="w-full bg-white p-12 rounded-[3.5rem] shadow-sm border-2 border-slate-100 hover:border-orange-600 hover:shadow-2xl transition-all font-black text-3xl text-left flex justify-between items-center active:scale-95"
              >
                <div className="flex items-center space-x-6">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 font-black text-xl">{m.name[0]}</div>
                  <span>{m.name}</span>
                </div>
                <ChevronRight className="text-slate-300" size={32} />
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'TALKING' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-16">
          {isProcessing ? (
            <div className="space-y-10 animate-in zoom-in duration-700">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-500/10 blur-3xl rounded-full animate-pulse" />
                <Loader2 className="w-48 h-48 animate-spin text-orange-600 mx-auto relative z-10" strokeWidth={2.5} />
                <div className="absolute inset-0 flex items-center justify-center font-black text-orange-600 text-3xl tracking-tighter z-20">AS</div>
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-tight">
                  {lang === 'hi' ? 'आरोग्य स्वर्ण सोच रहा है...' : 'Arogya Swarm is thinking...'}
                </h3>
                <p className="text-slate-400 font-black text-xs uppercase tracking-[0.4em]">{lang === 'hi' ? 'कृपया प्रतीक्षा करें' : 'Please wait a moment'}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-16 w-full px-4 flex-1 flex flex-col justify-center">
              <div className="bg-white p-14 rounded-[5rem] border-2 border-slate-100 shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-12 duration-700">
                <div className="absolute top-6 left-10 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                  Consultation Interaction {inputCount + 1} / {MAX_USER_INPUTS}
                </div>
                {currentQuestion ? (
                  <div className="mt-6">
                    <h3 className="text-4xl font-black text-slate-900 leading-[1.15] mb-6 tracking-tight">{lang === 'hi' ? currentQuestion.hindiQuestion : currentQuestion.question}</h3>
                    <div className="h-1 w-20 bg-slate-100 mx-auto rounded-full mb-6" />
                    <p className="text-xl font-bold text-slate-400 italic uppercase tracking-wider leading-relaxed">{lang === 'hi' ? currentQuestion.question : currentQuestion.hindiQuestion}</p>
                  </div>
                ) : (
                  <div className="mt-6">
                    <h3 className="text-5xl font-black text-slate-900 leading-tight mb-6 tracking-tighter">
                      {lang === 'hi' ? 'अपनी बात बताएं' : 'Tell your problem'}
                    </h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">We are listening to you</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center space-y-8">
                <div className="relative">
                  {isListening && <div className="absolute inset-[-20px] bg-red-500/20 rounded-full animate-ping" />}
                  <button 
                    onClick={startListening} 
                    className={`w-48 h-48 mx-auto rounded-full flex items-center justify-center text-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all active:scale-90 relative z-10 ${isListening ? 'bg-red-600' : 'bg-orange-600 hover:bg-orange-700'}`}
                  >
                    <Mic size={72} strokeWidth={3} />
                  </button>
                </div>
                <div className="space-y-3">
                  <p className="font-black text-slate-900 uppercase tracking-[0.4em] text-sm">{lang === 'hi' ? 'बोलने के लिए दबाएं' : 'Tap to Speak'}</p>
                  {isListening && <p className="text-red-600 font-black animate-pulse text-xs uppercase tracking-widest">{lang === 'hi' ? 'सुन रहा हूँ...' : 'Listening now...'}</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'RESULT' && consultResult && (
        <div className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          {consultResult.type === 'DR_SENT' ? (
             <div className="text-center p-14 space-y-10 bg-white rounded-[5rem] shadow-2xl border border-slate-50">
                <div className="w-40 h-40 bg-sky-50 text-sky-500 rounded-[3rem] flex items-center justify-center mx-auto shadow-inner"><CheckCircle2 size={80} strokeWidth={3} /></div>
                <div className="space-y-4">
                   <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{lang === 'hi' ? 'डॉक्टर को सूचना दी गई' : 'Inquiry Sent'}</h2>
                   <p className="text-slate-400 font-bold text-xl mt-4 leading-relaxed max-w-[280px] mx-auto">{lang === 'hi' ? 'डॉक्टर जल्द ही आपसे संपर्क करेंगे।' : 'A doctor will review your case shortly.'}</p>
                </div>
                <Button onClick={() => setActiveScreen('HOME')} variant="primary" className="rounded-full py-6 text-xl shadow-xl shadow-green-100">Go to Dashboard</Button>
             </div>
          ) : mode === 'NUTRITION' ? (
            <div className="space-y-12">
              <div className="p-14 rounded-[5rem] bg-green-800 text-white shadow-2xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10"><Apple size={120} /></div>
                <h2 className="text-3xl font-black tracking-tight leading-[1.2] relative z-10">{consultResult.summary}</h2>
              </div>
              <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 space-y-8">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Nutritional Tips</h3>
                {consultResult.tips.map((tip: string, i: number) => (
                  <div key={i} className="flex items-start space-x-6 bg-green-50/50 p-8 rounded-[2.5rem] border border-green-100/50">
                    <div className="bg-green-600 p-2 rounded-xl text-white shrink-0 mt-1 shadow-md shadow-green-200"><CheckCircle2 size={18} strokeWidth={3} /></div>
                    <p className="text-xl font-bold text-slate-800 leading-snug">{tip}</p>
                  </div>
                ))}
                <div className="pt-4">
                  <Button onClick={resetSession} variant="secondary" className="rounded-full py-6 text-lg">{lang === 'hi' ? 'वापस जाएं' : 'Back to Selection'}</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              <div className={`p-14 rounded-[5rem] text-white shadow-2xl relative overflow-hidden ${consultResult.riskLevel === 'HIGH' ? 'bg-red-600' : consultResult.riskLevel === 'MEDIUM' ? 'bg-orange-600' : 'bg-green-600'}`}>
                <div className="absolute top-0 right-0 p-10 opacity-20 rotate-12"><Activity size={120} /></div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-4 opacity-70">Arogya Risk Analysis</p>
                  <h2 className="text-7xl font-black tracking-tighter uppercase leading-none">{consultResult.riskLevel}</h2>
                </div>
              </div>
              <Card className="p-12 bg-white rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">{lang === 'hi' ? 'संभावित स्थिति' : 'Findings'}</h4>
                  <p className="text-4xl font-black text-slate-900 leading-tight tracking-tight">{consultResult.diagnosis}</p>
                </div>
                <div className="space-y-5">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">{lang === 'hi' ? 'जरूरी कदम' : 'Action Plan'}</h4>
                  {consultResult.recommendations.map((rec: string, i: number) => (
                    <div key={i} className="flex items-start space-x-5 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100/50">
                      <CheckCircle2 className="text-green-600 shrink-0 mt-1" size={24} strokeWidth={3} />
                      <p className="text-lg font-bold text-slate-700 leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-4">
                  <Button onClick={resetSession} variant="secondary" className="rounded-full py-6 text-lg">{lang === 'hi' ? 'वापस जाएं' : 'Close Assessment'}</Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen pb-28 shadow-2xl relative border-x border-slate-100 overflow-hidden font-sans">
      <Header 
        title={activeScreen === 'HOME' ? 'आरोग्य स्वर्ण' : activeScreen === 'NUTRITION' ? (lang === 'hi' ? 'पोषण सलाह' : 'Nutrition') : activeScreen === 'SYMPTOMS' ? (lang === 'hi' ? 'स्वास्थ्य जांच' : 'Health Check') : activeScreen === 'DOCTOR_CONSULT' ? (lang === 'hi' ? 'विशेषज्ञ डॉक्टर' : 'Specialist') : 'Portal'} 
        subtitle={activeScreen === 'HOME' ? (lang === 'hi' ? 'ग्रामीण एआई स्वास्थ्य' : 'Patient App') : 'Powered by Arogya Swarm'}
        onBack={activeScreen !== 'HOME' ? () => setActiveScreen('HOME') : onExit}
        rightElement={<div className="w-14 h-14 bg-slate-900 text-white rounded-3xl flex items-center justify-center font-black text-xl shadow-lg">{user?.name[0]}</div>}
      />
      <main className="min-h-[85vh] flex flex-col">
        {activeScreen === 'HOME' && renderHome()}
        {activeScreen === 'SYMPTOMS' && renderConsultation('SYMPTOMS')}
        {activeScreen === 'NUTRITION' && renderConsultation('NUTRITION')}
        {activeScreen === 'DOCTOR_CONSULT' && renderConsultation('DOCTOR_CONSULT')}
      </main>
      {isAddingMember && <AddMemberModal parentPhone={user.phone} onClose={() => setIsAddingMember(false)} onSave={m => setFamilyMembers([...familyMembers, m])} />}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-3xl border-t border-slate-100 px-12 py-10 flex justify-between items-center max-w-md mx-auto z-[70] rounded-t-[5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveScreen('HOME')} className={`flex flex-col items-center group ${activeScreen === 'HOME' ? 'text-sky-600 scale-110' : 'text-slate-300'}`}>
          <Home size={28} strokeWidth={activeScreen === 'HOME' ? 3 : 2} />
          <span className="text-[10px] mt-3 font-black uppercase tracking-widest transition-all">{lang === 'hi' ? 'होम' : 'Home'}</span>
        </button>
        <button onClick={() => setActiveScreen('SYMPTOMS')} className={`flex flex-col items-center group ${activeScreen === 'SYMPTOMS' ? 'text-red-600 scale-110' : 'text-slate-300'}`}>
          <Activity size={28} strokeWidth={activeScreen === 'SYMPTOMS' ? 3 : 2} />
          <span className="text-[10px] mt-3 font-black uppercase tracking-widest transition-all">{lang === 'hi' ? 'जांच' : 'Scan'}</span>
        </button>
        <button onClick={() => setActiveScreen('DOCTOR_CONSULT')} className={`flex flex-col items-center group ${activeScreen === 'DOCTOR_CONSULT' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
          <Stethoscope size={28} strokeWidth={activeScreen === 'DOCTOR_CONSULT' ? 3 : 2} />
          <span className="text-[10px] mt-3 font-black uppercase tracking-widest transition-all">{lang === 'hi' ? 'डॉक्टर' : 'Consult'}</span>
        </button>
        <button onClick={onExit} className="flex flex-col items-center text-slate-400 group active:scale-90 transition-all">
          <X size={28} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
          <span className="text-[10px] mt-3 font-black uppercase tracking-widest">{lang === 'hi' ? 'बाहर' : 'Exit'}</span>
        </button>
      </nav>
    </div>
  );
};

export default PatientApp;
