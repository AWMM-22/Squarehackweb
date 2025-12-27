
import React, { useState, useEffect, useRef } from 'react';
import { Header, Card, Button } from '../components/UI';
import { 
  Heart, Users, Thermometer, Droplets, 
  Stethoscope, FileText, Apple, Bell,
  ChevronRight, Mic, CheckCircle2, UserPlus, X, Info, Home,
  User, Activity, BookOpen, UserCircle, Plus, Hash, Users2,
  Volume2, Loader2, AlertCircle, PhoneCall, MessageSquare, Pill
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
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Add Member</h2>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 active:scale-90 transition-all"><X size={20} /></button>
        </div>
        
        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Full Name" className="w-full bg-slate-50 p-4 pl-12 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-orange-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="number" placeholder="Age" className="w-full bg-slate-50 p-4 pl-12 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-orange-500 outline-none" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
            </div>
            <div className="relative flex-1">
              <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select className="w-full bg-slate-50 p-4 pl-12 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-orange-500 outline-none appearance-none" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="relative">
            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Relation (e.g. Wife, Son)" className="w-full bg-slate-50 p-4 pl-12 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-orange-500 outline-none" value={formData.relation} onChange={e => setFormData({...formData, relation: e.target.value})} />
          </div>
        </div>
        <Button onClick={handleSave} variant="warning" className="py-4 rounded-xl text-sm shadow-lg shadow-orange-100" disabled={loading}>{loading ? "Saving..." : "Save Family Member"}</Button>
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

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
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
    <div className="p-4 space-y-5 animate-in fade-in duration-700 pb-24">
      <div className="py-4 px-2 flex justify-between items-center">
        <div className="space-y-0.5">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {lang === 'hi' ? `नमस्ते ${user?.name?.split(' ')[0]}!` : `Hello ${user?.name?.split(' ')[0]}!`} 🙏
          </h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Health Assistant Active</p>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 active:scale-90 transition-all cursor-pointer">
          <Bell size={20} className="text-slate-400" />
        </div>
      </div>

      {drResponses.length > 0 && (
        <section className="px-1">
          <h3 className="font-black text-slate-400 uppercase text-[9px] tracking-widest mb-3">Advice from Doctor</h3>
          <div className="space-y-4">
            {drResponses.map(res => (
              <Card key={res.id} className="p-5 bg-white rounded-2xl shadow-lg border-2 border-blue-100 animate-in zoom-in-95 overflow-hidden">
                <div className="flex items-center space-x-3 mb-4">
                   <div className="bg-blue-600 p-2 rounded-lg text-white shadow-md shadow-blue-100"><Stethoscope size={18} /></div>
                   <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assessed by</p>
                    <p className="text-sm font-black text-slate-900 leading-none">Dr. {res.doctor_name}</p>
                   </div>
                </div>
                
                {res.doctor_response && (
                  <div className="mb-4 space-y-1">
                    <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest flex items-center">
                      <MessageSquare size={10} className="mr-1" /> Notes & Advice
                    </p>
                    <p className="font-bold text-base text-slate-700 leading-tight bg-slate-50 p-3 rounded-xl border border-slate-100 italic">"{res.doctor_response}"</p>
                  </div>
                )}

                {res.doctor_prescription && (
                  <div className="space-y-1 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 relative">
                    <div className="absolute top-2 right-3 opacity-10"><Pill size={40} /></div>
                    <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest flex items-center mb-1">
                      <Pill size={10} className="mr-1" /> Prescription Details
                    </p>
                    <p className="font-black text-base text-blue-900 leading-snug whitespace-pre-wrap">{res.doctor_prescription}</p>
                  </div>
                )}

                <button 
                  onClick={() => speakText(`Advice from Doctor ${res.doctor_name}. Notes: ${res.doctor_response}. Prescription: ${res.doctor_prescription}`)} 
                  className="mt-4 w-full bg-slate-900 hover:bg-black text-white active:scale-[0.98] px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center transition-all shadow-md shadow-slate-100"
                >
                  <Volume2 size={16} className="mr-2" /> Listen to Doctor's Voice
                </button>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-black text-slate-400 uppercase text-[9px] tracking-widest">Family Dashboard</h3>
          <button 
            onClick={() => setIsAddingMember(true)} 
            className="text-orange-600 text-[9px] font-black uppercase tracking-widest flex items-center bg-white px-3 py-1.5 rounded-lg active:scale-95 transition-all shadow-sm border border-orange-50"
          >
            <UserPlus size={14} className="mr-2" /> Add Member
          </button>
        </div>
        <Card className="p-0 overflow-hidden shadow-sm border border-slate-100 rounded-2xl bg-white">
          <div className="p-5 flex items-center justify-between border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black text-lg">{user?.name[0]}</div>
              <div>
                <p className="font-bold text-slate-900 text-base leading-none">{user?.name} (You)</p>
                <p className="bg-green-50 text-green-600 inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase mt-1.5 border border-green-100">Primary</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </div>
          {familyMembers.map((member, idx) => (
            <div key={idx} className="p-5 flex items-center justify-between border-b last:border-b-0 border-slate-50 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 ${member.gender === 'Female' ? 'bg-pink-50 text-pink-600' : 'bg-orange-50 text-orange-600'} rounded-xl flex items-center justify-center font-black text-lg`}>{member.name[0]}</div>
                <div>
                  <p className="font-bold text-slate-900 text-base leading-none">{member.name}</p>
                  <p className="text-[9px] text-slate-400 font-black uppercase mt-1 tracking-wider">{member.age} Y • {member.relation}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </div>
          ))}
        </Card>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setActiveScreen('SYMPTOMS')} 
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-3 hover:shadow-md transition-all active:scale-95 group"
        >
          <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all"><Thermometer size={28} /></div>
          <div className="space-y-0.5">
            <span className="font-black text-slate-900 text-sm block leading-none">{lang === 'hi' ? 'स्वास्थ्य जांच' : 'Health Check'}</span>
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">AI Scan</span>
          </div>
        </button>
        <button 
          onClick={() => setActiveScreen('NUTRITION')} 
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-3 hover:shadow-md transition-all active:scale-95 group"
        >
          <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all"><Apple size={28} /></div>
          <div className="space-y-0.5">
            <span className="font-black text-slate-900 text-sm block leading-none">{lang === 'hi' ? 'पोषण सलाह' : 'Diet Guide'}</span>
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Rural AI</span>
          </div>
        </button>
      </div>

      <button 
        onClick={() => setActiveScreen('DOCTOR_CONSULT')} 
        className="w-full bg-slate-900 text-white p-6 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all shadow-lg"
      >
        <div className="flex items-center space-x-5">
           <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-sky-400"><Stethoscope size={24} /></div>
           <div className="text-left">
              <p className="font-black text-lg tracking-tight leading-none">{lang === 'hi' ? 'डॉक्टर की सलाह' : 'Doctor Consult'}</p>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1.5">Direct Specialist Help</p>
           </div>
        </div>
        <ChevronRight className="text-slate-600" size={20} />
      </button>
    </div>
  );

  const renderConsultation = (mode: 'SYMPTOMS' | 'NUTRITION' | 'DOCTOR_CONSULT') => (
    <div className="p-4 flex-1 flex flex-col justify-center animate-in fade-in duration-500 pb-28 min-h-[80vh]">
      {step === 'SELECT' && (
        <div className="space-y-10 py-6 w-full">
          <div className="text-center space-y-3">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight px-4 leading-tight">
              {lang === 'hi' ? 'किसे सहायता चाहिए?' : 'Who needs help?'}
            </h2>
          </div>
          <div className="space-y-3 px-1">
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
                className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-orange-600 hover:shadow-md transition-all font-bold text-xl text-left flex justify-between items-center active:scale-95"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 font-bold text-base">{m.name[0]}</div>
                  <span>{m.name}</span>
                </div>
                <ChevronRight className="text-slate-300" size={24} />
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'TALKING' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6 space-y-10">
          {isProcessing ? (
            <div className="space-y-6 animate-in zoom-in duration-500">
              <div className="relative">
                <Loader2 className="w-24 h-24 animate-spin text-orange-600 mx-auto" strokeWidth={2.5} />
                <div className="absolute inset-0 flex items-center justify-center font-black text-orange-600 text-base tracking-tighter">AS</div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {lang === 'hi' ? 'आरोग्य स्वर्ण सोच रहा है...' : 'Arogya Swarm thinking...'}
                </h3>
              </div>
            </div>
          ) : (
            <div className="space-y-10 w-full px-2 flex-1 flex flex-col justify-center">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl relative overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                <div className="absolute top-3 left-6 text-[8px] font-black text-slate-300 uppercase tracking-widest">
                  Step {inputCount + 1} / {MAX_USER_INPUTS}
                </div>
                {currentQuestion ? (
                  <div className="mt-4">
                    <h3 className="text-2xl font-black text-slate-900 leading-tight mb-4 tracking-tight">{lang === 'hi' ? currentQuestion.hindiQuestion : currentQuestion.question}</h3>
                    <p className="text-base font-bold text-slate-400 italic uppercase tracking-wider leading-relaxed">{lang === 'hi' ? currentQuestion.question : currentQuestion.hindiQuestion}</p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <h3 className="text-3xl font-black text-slate-900 leading-tight mb-2 tracking-tight">
                      {lang === 'hi' ? 'अपनी बात बताएं' : 'Speak now'}
                    </h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Tap mic and start talking</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center space-y-6">
                <button 
                  onClick={startListening} 
                  className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-90 relative ${isListening ? 'bg-red-500 shadow-red-100' : 'bg-orange-600 shadow-orange-100 hover:bg-orange-700'}`}
                >
                  {isListening && <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-25" />}
                  <Mic size={48} strokeWidth={3} />
                </button>
                <div className="space-y-1.5">
                  <p className="font-black text-slate-900 uppercase tracking-widest text-xs">{lang === 'hi' ? 'बोलने के लिए दबाएं' : 'Tap to Speak'}</p>
                  {isListening && <p className="text-red-600 font-black animate-pulse text-[10px] uppercase tracking-widest">{lang === 'hi' ? 'सुन रहा हूँ...' : 'Listening...'}</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'RESULT' && consultResult && (
        <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
          {consultResult.type === 'DR_SENT' ? (
             <div className="text-center p-10 space-y-8 bg-white rounded-3xl shadow-lg border border-slate-50">
                <div className="w-24 h-24 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center mx-auto"><CheckCircle2 size={48} strokeWidth={3} /></div>
                <div className="space-y-2">
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight">{lang === 'hi' ? 'सूचना भेज दी गई' : 'Inquiry Sent'}</h2>
                   <p className="text-slate-400 font-bold text-base mt-2">{lang === 'hi' ? 'डॉक्टर जल्द संपर्क करेंगे।' : 'Doctor will reply soon.'}</p>
                </div>
                <Button onClick={() => setActiveScreen('HOME')} variant="primary" className="rounded-xl py-4">Home</Button>
             </div>
          ) : mode === 'NUTRITION' ? (
            <div className="space-y-6">
              <div className="p-8 rounded-3xl bg-green-800 text-white shadow-lg space-y-4">
                <h2 className="text-xl font-black tracking-tight leading-tight">{consultResult.summary}</h2>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Daily Tips</h3>
                {consultResult.tips.map((tip: string, i: number) => (
                  <div key={i} className="flex items-start space-x-4 bg-green-50/50 p-5 rounded-2xl border border-green-100/50">
                    <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={16} strokeWidth={3} />
                    <p className="text-base font-bold text-slate-800">{tip}</p>
                  </div>
                ))}
                <div className="pt-2">
                  <Button onClick={resetSession} variant="secondary" className="rounded-xl py-4 text-sm">{lang === 'hi' ? 'वापस' : 'Done'}</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className={`p-8 rounded-3xl text-white shadow-lg ${consultResult.riskLevel === 'HIGH' ? 'bg-red-600' : consultResult.riskLevel === 'MEDIUM' ? 'bg-orange-600' : 'bg-green-600'}`}>
                <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">{consultResult.riskLevel} RISK</h2>
              </div>
              <Card className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-8">
                <div className="space-y-1">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{lang === 'hi' ? 'स्थिति' : 'Diagnosis'}</h4>
                  <p className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{consultResult.diagnosis}</p>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{lang === 'hi' ? 'जरूरी सलाह' : 'Advice'}</h4>
                  {consultResult.recommendations.map((rec: string, i: number) => (
                    <div key={i} className="flex items-start space-x-4 bg-slate-50 p-5 rounded-2xl border border-slate-100/50">
                      <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={18} strokeWidth={3} />
                      <p className="text-base font-bold text-slate-700">{rec}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <Button onClick={resetSession} variant="secondary" className="rounded-xl py-4 text-sm">{lang === 'hi' ? 'वापस' : 'Done'}</Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen pb-24 shadow-2xl relative border-x border-slate-100 overflow-hidden font-sans">
      <Header 
        title={activeScreen === 'HOME' ? 'आरोग्य स्वर्ण' : activeScreen === 'NUTRITION' ? (lang === 'hi' ? 'पोषण' : 'Diet') : activeScreen === 'SYMPTOMS' ? (lang === 'hi' ? 'स्वास्थ्य जांच' : 'Health Scan') : activeScreen === 'DOCTOR_CONSULT' ? (lang === 'hi' ? 'डॉक्टर' : 'Doctor') : 'Portal'} 
        subtitle={activeScreen === 'HOME' ? (lang === 'hi' ? 'मरीज पोर्टल' : 'Patient App') : 'Rural AI Assistant'}
        onBack={activeScreen !== 'HOME' ? () => setActiveScreen('HOME') : onExit}
        rightElement={<div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-md">{user?.name[0]}</div>}
      />
      <main className="min-h-[80vh] flex flex-col">
        {activeScreen === 'HOME' && renderHome()}
        {activeScreen === 'SYMPTOMS' && renderConsultation('SYMPTOMS')}
        {activeScreen === 'NUTRITION' && renderConsultation('NUTRITION')}
        {activeScreen === 'DOCTOR_CONSULT' && renderConsultation('DOCTOR_CONSULT')}
      </main>
      {isAddingMember && <AddMemberModal parentPhone={user.phone} onClose={() => setIsAddingMember(false)} onSave={m => setFamilyMembers([...familyMembers, m])} />}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-8 py-5 flex justify-between items-center max-w-md mx-auto z-[70] rounded-t-3xl shadow-lg">
        <button onClick={() => setActiveScreen('HOME')} className={`flex flex-col items-center ${activeScreen === 'HOME' ? 'text-sky-600' : 'text-slate-300'}`}>
          <Home size={22} strokeWidth={activeScreen === 'HOME' ? 3 : 2} />
          <span className="text-[8px] mt-1.5 font-black uppercase tracking-widest">{lang === 'hi' ? 'होम' : 'Home'}</span>
        </button>
        <button onClick={() => setActiveScreen('SYMPTOMS')} className={`flex flex-col items-center ${activeScreen === 'SYMPTOMS' ? 'text-red-600' : 'text-slate-300'}`}>
          <Activity size={22} strokeWidth={activeScreen === 'SYMPTOMS' ? 3 : 2} />
          <span className="text-[8px] mt-1.5 font-black uppercase tracking-widest">{lang === 'hi' ? 'जांच' : 'Scan'}</span>
        </button>
        <button onClick={() => setActiveScreen('DOCTOR_CONSULT')} className={`flex flex-col items-center ${activeScreen === 'DOCTOR_CONSULT' ? 'text-blue-600' : 'text-slate-300'}`}>
          <Stethoscope size={22} strokeWidth={activeScreen === 'DOCTOR_CONSULT' ? 3 : 2} />
          <span className="text-[8px] mt-1.5 font-black uppercase tracking-widest">{lang === 'hi' ? 'डॉक्टर' : 'Doctor'}</span>
        </button>
        <button onClick={onExit} className="flex flex-col items-center text-slate-400 hover:text-red-500 transition-colors">
          <X size={22} strokeWidth={3} />
          <span className="text-[8px] mt-1.5 font-black uppercase tracking-widest">{lang === 'hi' ? 'बाहर' : 'Exit'}</span>
        </button>
      </nav>
    </div>
  );
};

export default PatientApp;
