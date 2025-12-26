
import React, { useState } from 'react';
import { Header, Button, Card } from '../components/UI';
import { 
  Home, ClipboardList, UserPlus, Phone, Search, 
  AlertTriangle, Mic, ChevronRight, CheckCircle2,
  Baby, Heart, Pill, Thermometer, MapPin, X, ArrowLeft, Package, Trash2
} from 'lucide-react';
import { RiskLevel, Task } from '../types';
import { analyzeSymptoms } from '../services/geminiService';

const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Baby Checkup', patientName: 'Kamla Devi', patientId: 'p1', type: 'BABY', priority: RiskLevel.HIGH, time: '9:00 AM', completed: false, address: 'Ward 3, House #47' },
  { id: '2', title: 'Pregnancy Checkup', patientName: 'Sita Devi', patientId: 'p2', type: 'PREGNANCY', priority: RiskLevel.MEDIUM, time: '11:00 AM', completed: false, address: 'Ward 2, House #23' },
  { id: '3', title: 'TB Follow-up', patientName: 'Ram Kumar', patientId: 'p3', type: 'MEDICINE', priority: RiskLevel.MEDIUM, time: '2:00 PM', completed: true, address: 'Ward 1, House #12' },
];

const ASSESSMENT_QUESTIONS = [
  { id: 'fever', text: "क्या मरीज़ को बुखार है?", sub: "Does patient have fever?", choices: [{ label: 'हाँ (YES)', val: true }, { label: 'नहीं (NO)', val: false }] },
  { id: 'cough', text: "क्या मरीज़ को खांसी है?", sub: "Does patient have cough?", choices: [{ label: 'हाँ (YES)', val: true }, { label: 'नहीं (NO)', val: false }] },
  { id: 'breathing', text: "क्या सांस लेने में तकलीफ है?", sub: "Difficulty breathing?", choices: [{ label: 'हाँ (YES)', val: true }, { label: 'नहीं (NO)', val: false }] },
  { id: 'weakness', text: "क्या शरीर में बहुत कमजोरी है?", sub: "Severe weakness?", choices: [{ label: 'हाँ (YES)', val: true }, { label: 'नहीं (NO)', val: false }] },
];

const AshaApp: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'HOME' | 'TASKS' | 'ASSESS' | 'STOCK'>('HOME');
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);

  const handleAnswer = (val: boolean) => {
    const q = ASSESSMENT_QUESTIONS[qIndex];
    const newAnswers = { ...answers, [q.id]: val };
    setAnswers(newAnswers);
    
    if (qIndex < ASSESSMENT_QUESTIONS.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      finishAssessment(newAnswers);
    }
  };

  const finishAssessment = async (finalAnswers: any) => {
    setIsAnalyzing(true);
    const symptoms = Object.keys(finalAnswers).filter(k => finalAnswers[k]);
    const result = await analyzeSymptoms(symptoms, 28, 'F');
    setDiagnosis(result);
    setIsAnalyzing(false);
  };

  const resetAssessment = () => {
    setQIndex(0);
    setAnswers({});
    setDiagnosis(null);
    setActiveTab('HOME');
  };

  const renderHome = () => (
    <div className="p-4 space-y-6">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-green-50 rounded-[1.5rem] flex items-center justify-center text-green-700 mb-4 shadow-inner">
           <Home size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Namaste, Sunita</h2>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Village Rampur • Ward 3</p>
      </div>

      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-[2rem] p-5 flex items-start shadow-sm">
        <div className="bg-red-100 p-2 rounded-xl mr-4"><AlertTriangle className="text-red-600" /></div>
        <div className="flex-1">
          <h3 className="font-bold text-red-800 text-lg tracking-tight">Heavy Rain Alert</h3>
          <p className="text-sm text-yellow-800 leading-tight mt-1">High diarrhea risk. Prioritize pregnant women visits.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setActiveTab('TASKS')} className="bg-green-100 p-6 rounded-[2rem] flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md active:scale-95 transition-all">
          <div className="bg-green-600 p-4 rounded-2xl mb-3 text-white shadow-lg shadow-green-200"><ClipboardList /></div>
          <span className="font-bold text-green-900 uppercase text-xs">Today's Tasks</span>
          <span className="text-[10px] text-green-700 font-black uppercase mt-1">3 Pending</span>
        </button>
        <button onClick={() => setActiveTab('STOCK')} className="bg-orange-100 p-6 rounded-[2rem] flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md active:scale-95 transition-all">
          <div className="bg-orange-600 p-4 rounded-2xl mb-3 text-white shadow-lg shadow-orange-200"><Package /></div>
          <span className="font-bold text-orange-900 uppercase text-xs">Stock Alert</span>
          <span className="text-[10px] text-orange-700 font-black uppercase mt-1 tracking-tighter">Low Items</span>
        </button>
      </div>

      <Button onClick={() => setActiveTab('ASSESS')} variant="primary" icon={Mic} className="py-6 rounded-[2rem] shadow-xl">
        SYMPTOM SCANNER
      </Button>

      <div className="space-y-4">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" />
          <input type="text" placeholder="Find patient..." className="w-full bg-white p-5 pl-14 rounded-2xl border border-slate-100 text-lg font-medium outline-none focus:ring-2 focus:ring-green-500/20 shadow-sm" />
          <Mic className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer" />
        </div>
      </div>

      <Button variant="danger" icon={Phone} className="animate-pulse py-6 rounded-[2rem] shadow-red-200 shadow-xl">
        EMERGENCY DOCTOR
      </Button>
    </div>
  );

  const renderStock = () => (
    <div className="p-4 space-y-6 animate-in fade-in duration-300">
      <div className="bg-red-50 border border-red-100 p-5 rounded-[2rem] space-y-2">
        <h3 className="font-black text-red-800 text-lg uppercase tracking-tight">CRITICAL STOCK</h3>
        <p className="text-xs text-red-600 font-bold uppercase tracking-widest">Reorder required immediately</p>
      </div>
      
      <div className="space-y-3">
        {[
          { name: 'ORS Packets', count: 15, total: 200, status: 'CRITICAL' },
          { name: 'Paracetamol 500', count: 8, total: 100, status: 'LOW' },
          { name: 'Iron Tablets', count: 45, total: 500, status: 'OK' },
          { name: 'Bandages', count: 120, total: 200, status: 'OK' }
        ].map(item => (
          <Card key={item.name} className="p-5 border-none shadow-sm rounded-3xl bg-white flex items-center justify-between">
            <div className="flex items-center space-x-4">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.status === 'CRITICAL' ? 'bg-red-100 text-red-600' : item.status === 'LOW' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                 <Package size={24} />
               </div>
               <div>
                  <p className="font-black text-slate-800">{item.name}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div className={`h-full ${item.status === 'CRITICAL' ? 'bg-red-500' : item.status === 'LOW' ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${(item.count/item.total)*100}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400">{item.count}/{item.total}</span>
                  </div>
               </div>
            </div>
            {item.status !== 'OK' && <button className="bg-slate-900 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">ORDER</button>}
          </Card>
        ))}
      </div>

      <Button variant="info" className="rounded-[2rem] py-4" icon={ClipboardList}>SUBMIT MONTHLY REPORT</Button>
    </div>
  );

  const renderAssessment = () => {
    if (isAnalyzing) {
      return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
          <div className="w-20 h-20 border-8 border-green-600 border-t-transparent rounded-full animate-spin" />
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Analysing Data...</h2>
          <p className="text-slate-500 font-medium">Gemini AI is processing health markers</p>
        </div>
      );
    }

    if (diagnosis) {
      return (
        <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className={`p-6 rounded-[2.5rem] text-white flex items-center shadow-xl ${diagnosis.riskLevel === 'HIGH' ? 'bg-red-600 shadow-red-200' : 'bg-orange-500 shadow-orange-200'}`}>
              <AlertTriangle className="w-10 h-10 mr-5" />
              <div>
                <h3 className="font-black text-3xl tracking-tighter">{diagnosis.riskLevel} RISK</h3>
                <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Attention Required</p>
              </div>
           </div>

           <Card className="p-6 border-none bg-white shadow-xl rounded-[2rem]">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Likely Diagnosis</h4>
             <p className="text-2xl font-black text-slate-900 leading-tight">{diagnosis.diagnosis}</p>
             <div className="mt-4 flex items-center text-xs font-bold text-slate-400">
               <span className="mr-2 italic">AI Confidence: {(diagnosis.confidence * 100).toFixed(0)}%</span>
               <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-green-500" style={{ width: `${diagnosis.confidence * 100}%` }} />
               </div>
             </div>
           </Card>

           <div className="space-y-4 px-2">
             <h4 className="font-black text-lg text-slate-800 uppercase tracking-tight">Recommended Actions</h4>
             {diagnosis.recommendations.map((rec: string, i: number) => (
               <div key={i} className="flex items-start bg-white p-5 rounded-2xl shadow-sm border border-slate-50">
                 <span className="bg-green-600 text-white w-7 h-7 rounded-xl flex items-center justify-center text-sm font-black mr-4 shrink-0 shadow-lg shadow-green-100">{i+1}</span>
                 <p className="text-slate-800 font-bold leading-snug">{rec}</p>
               </div>
             ))}
           </div>

           <div className="pt-6 space-y-4 pb-20">
             <Button variant="info" icon={Phone} className="rounded-[2rem] py-5">CONSULT DOCTOR NOW</Button>
             <Button variant="secondary" onClick={resetAssessment} className="rounded-[2rem] py-4">CLOSE & FINISH</Button>
           </div>
        </div>
      );
    }

    const currentQ = ASSESSMENT_QUESTIONS[qIndex];
    return (
      <div className="p-6 flex flex-col h-full space-y-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-slate-400">
           <span>STEP {qIndex + 1} OF {ASSESSMENT_QUESTIONS.length}</span>
           <div className="flex gap-1">
             {ASSESSMENT_QUESTIONS.map((_, i) => (
               <div key={i} className={`w-6 h-1 rounded-full transition-all ${i === qIndex ? 'bg-green-600' : 'bg-slate-200'}`} />
             ))}
           </div>
        </div>

        <div className="text-center space-y-4 py-6">
          <div className="flex justify-center mb-6">
             <div className="w-40 h-40 bg-green-50 rounded-full flex items-center justify-center border-4 border-white shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-green-200 opacity-20 animate-ping rounded-full" />
                <Mic className="w-16 h-16 text-green-600 relative z-10" />
             </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">{currentQ.text}</h2>
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">{currentQ.sub}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 h-48">
          {currentQ.choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(choice.val)}
              className={`rounded-[2.5rem] flex flex-col items-center justify-center text-white shadow-2xl active:scale-95 transition-all
                ${choice.val ? 'bg-green-600 shadow-green-200' : 'bg-red-600 shadow-red-200'}`}
            >
              <span className="text-4xl font-black mb-1">{choice.val ? '✓' : '✗'}</span>
              <span className="font-black text-xl tracking-tighter">{choice.label}</span>
            </button>
          ))}
        </div>
        
        <div className="flex justify-between pt-10">
          <button onClick={() => qIndex > 0 && setQIndex(qIndex-1)} disabled={qIndex === 0} className="text-slate-400 font-bold flex items-center disabled:opacity-0 transition-opacity">
            <ArrowLeft className="mr-2 w-4 h-4" /> PREVIOUS
          </button>
          <button onClick={() => handleAnswer(false)} className="text-slate-400 font-bold">SKIP</button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen pb-24 shadow-2xl overflow-x-hidden selection:bg-green-100">
      <Header 
        title={activeTab === 'HOME' ? 'Arogya Swarm' : activeTab === 'TASKS' ? "Today's Tasks" : activeTab === 'STOCK' ? "Medicine Stock" : "Assessment"} 
        subtitle="ASHA: Sunita Rampur"
        onBack={activeTab !== 'HOME' ? () => setActiveTab('HOME') : onExit}
        rightElement={
          <div className="bg-green-100 px-3 py-1 rounded-full flex items-center">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse mr-2" />
            <span className="text-[10px] font-black text-green-700 tracking-widest uppercase">ONLINE</span>
          </div>
        }
      />

      <main>
        {activeTab === 'HOME' && renderHome()}
        {activeTab === 'TASKS' && (
          <div className="p-4 space-y-4 animate-in fade-in duration-300">
            {MOCK_TASKS.map(task => (
              <Card key={task.id} borderColor={task.priority === RiskLevel.HIGH ? '#D32F2F' : '#F57C00'} className="p-5 border-none shadow-md hover:shadow-lg transition-all rounded-3xl bg-white">
                <div className="flex justify-between items-start">
                  <div className="flex">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mr-4 shadow-sm">
                      {task.type === 'BABY' && <Baby className="text-blue-500" />}
                      {task.type === 'PREGNANCY' && <Heart className="text-pink-500" />}
                      {task.type === 'MEDICINE' && <Pill className="text-orange-500" />}
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-slate-800">{task.patientName}</h3>
                      <p className="text-[10px] text-slate-400 font-bold flex items-center uppercase tracking-wider">
                        <MapPin className="w-3 h-3 mr-1" /> {task.address}
                      </p>
                      <span className="inline-block mt-2 bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black">{task.time}</span>
                    </div>
                  </div>
                  {task.completed && <CheckCircle2 className="text-green-600 w-8 h-8" />}
                </div>
                {!task.completed && (
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setActiveTab('ASSESS')} className="flex-1 bg-green-600 text-white rounded-2xl py-3 font-black text-sm shadow-lg active:scale-95">START VISIT</button>
                    <button className="flex-1 border-2 border-slate-100 rounded-2xl py-3 font-black text-sm text-slate-600">CALL</button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
        {activeTab === 'STOCK' && renderStock()}
        {activeTab === 'ASSESS' && renderAssessment()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-8 py-4 flex justify-between items-center max-w-md mx-auto z-40 rounded-t-[2.5rem] shadow-2xl">
        <button onClick={() => setActiveTab('HOME')} className={`flex flex-col items-center ${activeTab === 'HOME' ? 'text-green-700' : 'text-slate-400'}`}>
          <Home size={22} strokeWidth={activeTab === 'HOME' ? 3 : 2} />
          <span className="text-[10px] mt-1 font-black uppercase tracking-widest">Home</span>
        </button>
        <button onClick={() => setActiveTab('TASKS')} className={`flex flex-col items-center ${activeTab === 'TASKS' ? 'text-green-700' : 'text-slate-400'}`}>
          <ClipboardList size={22} strokeWidth={activeTab === 'TASKS' ? 3 : 2} />
          <span className="text-[10px] mt-1 font-black uppercase tracking-widest">Tasks</span>
        </button>
        <button onClick={() => setActiveTab('STOCK')} className={`flex flex-col items-center ${activeTab === 'STOCK' ? 'text-orange-700' : 'text-slate-400'}`}>
          <Package size={22} strokeWidth={activeTab === 'STOCK' ? 3 : 2} />
          <span className="text-[10px] mt-1 font-black uppercase tracking-widest">Stock</span>
        </button>
        <button onClick={onExit} className="flex flex-col items-center text-red-400">
          <X size={22} />
          <span className="text-[10px] mt-1 font-black uppercase tracking-widest">Logout</span>
        </button>
      </nav>
    </div>
  );
};

export default AshaApp;
