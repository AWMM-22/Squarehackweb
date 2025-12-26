
import React, { useState, useEffect } from 'react';
import { Header, Button, Card } from '../components/UI';
import { 
  Home, ClipboardList, UserPlus, Phone, Search, 
  AlertTriangle, Mic, ChevronRight, CheckCircle2,
  Baby, Heart, Pill, Thermometer, MapPin, X, ArrowLeft, Package, Trash2,
  Users, Activity, Calendar, Stethoscope
} from 'lucide-react';
import { RiskLevel, Task } from '../types';
import { analyzeSymptoms } from '../services/geminiService';
import { subscribeToTasks, completeTask, saveAssessment } from '../services/dataService';

const ASSESSMENT_QUESTIONS = [
  { id: 'fever', text: "क्या मरीज़ को बुखार है?", sub: "Does patient have fever?", choices: [{ label: 'हाँ (YES)', val: true }, { label: 'नहीं (NO)', val: false }] },
  { id: 'cough', text: "क्या मरीज़ को खांसी है?", sub: "Does patient have cough?", choices: [{ label: 'हाँ (YES)', val: true }, { label: 'नहीं (NO)', val: false }] },
  { id: 'breathing', text: "क्या सांस लेने में तकलीफ है?", sub: "Difficulty breathing?", choices: [{ label: 'हाँ (YES)', val: true }, { label: 'नहीं (NO)', val: false }] },
  { id: 'weakness', text: "क्या शरीर में बहुत कमजोरी है?", sub: "Severe weakness?", choices: [{ label: 'हाँ (YES)', val: true }, { label: 'नहीं (NO)', val: false }] },
];

const AshaApp: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'HOME' | 'TASKS' | 'ASSESS' | 'STOCK'>('HOME');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);

  // Sync tasks with Firebase
  useEffect(() => {
    const unsubscribe = subscribeToTasks("sunita_rampur", (data) => {
      setTasks(data);
    });
    return () => unsubscribe();
  }, []);

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
    
    // Save to Firebase
    await saveAssessment({
      ashaId: "sunita_rampur",
      patientId: "p2", // Example ID
      symptoms,
      ...result
    });

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
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-gradient-to-br from-green-700 to-green-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-black tracking-tight leading-none">Namaste, Sunita</h2>
            <p className="text-green-200 font-bold uppercase tracking-widest text-[10px] mt-2">Rampur Village • Ward 3</p>
          </div>
          <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-md">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
        
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-200">Visits Today</p>
            <div className="flex items-end justify-between mt-1">
              <span className="text-2xl font-black">{tasks.filter(t => t.completed).length} / {tasks.length}</span>
              <Activity className="w-4 h-4 mb-1 text-green-300" />
            </div>
            <div className="w-full h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-green-400" style={{ width: `${(tasks.filter(t => t.completed).length / (tasks.length || 1)) * 100}%` }} />
            </div>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-200">Alerts</p>
            <div className="flex items-end justify-between mt-1">
              <span className="text-2xl font-black">03</span>
              <AlertTriangle className="w-4 h-4 mb-1 text-yellow-300" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setActiveTab('ASSESS')} className="flex-1 bg-white border-2 border-slate-100 p-6 rounded-[2rem] flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md active:scale-95 transition-all group">
          <div className="bg-green-100 p-4 rounded-2xl mb-2 text-green-700 group-hover:bg-green-600 group-hover:text-white transition-all"><Mic size={24} /></div>
          <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Health Scan</span>
        </button>
        <button className="flex-1 bg-red-600 p-6 rounded-[2rem] flex flex-col items-center justify-center text-center shadow-lg shadow-red-200 active:scale-95 transition-all group">
          <div className="bg-white/20 p-4 rounded-2xl mb-2 text-white"><Phone size={24} /></div>
          <span className="font-black text-white uppercase text-[10px] tracking-widest">Emergency</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setActiveTab('TASKS')} className="bg-white border border-slate-100 p-6 rounded-[2rem] flex items-center space-x-4 shadow-sm active:scale-95 transition-all">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><ClipboardList size={20} /></div>
          <div className="text-left">
            <p className="font-black text-slate-900 text-xs">TASKS</p>
            <p className="text-[10px] font-bold text-slate-400">{tasks.filter(t => !t.completed).length} Pending</p>
          </div>
        </button>
        <button onClick={() => setActiveTab('STOCK')} className="bg-white border border-slate-100 p-6 rounded-[2rem] flex items-center space-x-4 shadow-sm active:scale-95 transition-all">
          <div className="bg-orange-50 p-3 rounded-xl text-orange-600"><Package size={20} /></div>
          <div className="text-left">
            <p className="font-black text-slate-900 text-xs">STOCK</p>
            <p className="text-[10px] font-bold text-slate-400">Inventory</p>
          </div>
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-green-600 transition-colors" />
        <input type="text" placeholder="Search for a patient..." className="w-full bg-white p-6 pl-14 rounded-[2rem] border border-slate-100 text-sm font-bold outline-none focus:ring-4 focus:ring-green-500/10 shadow-sm transition-all" />
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="p-4 space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center px-2 mb-4">
          <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Priority Visits Today</h3>
      </div>
      {tasks.length === 0 ? (
        <div className="p-10 text-center text-slate-400 font-bold">No tasks assigned for today.</div>
      ) : (
        tasks.map(task => (
          <Card key={task.id} borderColor={task.priority === RiskLevel.HIGH ? '#D32F2F' : '#F57C00'} className="p-6 border-none shadow-md hover:shadow-xl transition-all rounded-[2.5rem] bg-white group">
            <div className="flex justify-between items-start">
              <div className="flex items-start">
                <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center mr-5 shadow-inner">
                  {task.type === 'BABY' && <Baby className="text-blue-500" size={28} />}
                  {task.type === 'PREGNANCY' && <Heart className="text-pink-500" size={28} />}
                  {task.type === 'MEDICINE' && <Pill className="text-orange-500" size={28} />}
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-900 leading-tight">{task.patientName}</h3>
                  <p className="text-[10px] text-slate-400 font-bold flex items-center uppercase tracking-widest mt-1">
                    <MapPin className="w-3 h-3 mr-1 text-slate-300" /> {task.address}
                  </p>
                </div>
              </div>
              {task.completed && <CheckCircle2 className="text-green-600 w-8 h-8" strokeWidth={3} />}
            </div>
            {!task.completed && (
              <div className="flex gap-4 mt-8">
                <button onClick={() => setActiveTab('ASSESS')} className="flex-1 bg-slate-900 text-white rounded-2xl py-4 font-black text-xs uppercase tracking-widest shadow-lg">START VISIT</button>
                <button onClick={() => completeTask(task.id)} className="flex-1 border-2 border-slate-100 rounded-2xl py-4 font-black text-xs uppercase tracking-widest text-slate-600">MARK DONE</button>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen pb-28 shadow-2xl overflow-x-hidden selection:bg-green-100 border-x border-slate-100">
      <Header 
        title={activeTab === 'HOME' ? 'Arogya Swarm' : activeTab === 'TASKS' ? "Task List" : activeTab === 'STOCK' ? "Inventory" : "Symptom Check"} 
        subtitle="ASHA Assistant"
        onBack={activeTab !== 'HOME' ? () => setActiveTab('HOME') : onExit}
        rightElement={
          <div className="flex items-center space-x-2 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-[10px] font-black text-green-700 tracking-[0.2em] uppercase">SYNCING</span>
          </div>
        }
      />

      <main>
        {activeTab === 'HOME' && renderHome()}
        {activeTab === 'TASKS' && renderTasks()}
        {activeTab === 'ASSESS' && (diagnosis ? (
          <div className="p-4 space-y-6">
            <Card className="p-8 bg-green-600 text-white rounded-[2rem] shadow-xl">
              <h3 className="font-black text-3xl">Scan Complete</h3>
              <p className="font-bold opacity-80 mt-1">{diagnosis.diagnosis}</p>
            </Card>
            <Button onClick={resetAssessment} variant="secondary">Finish & Close</Button>
          </div>
        ) : (
          <div className="p-6 h-full flex flex-col space-y-10">
            <h2 className="text-3xl font-black text-center">{ASSESSMENT_QUESTIONS[qIndex].text}</h2>
            <div className="grid grid-cols-2 gap-6 h-48">
              <button onClick={() => handleAnswer(true)} className="bg-green-600 text-white rounded-[2rem] font-black text-xl">YES</button>
              <button onClick={() => handleAnswer(false)} className="bg-red-600 text-white rounded-[2rem] font-black text-xl">NO</button>
            </div>
          </div>
        ))}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-slate-100 px-10 py-6 flex justify-between items-center max-w-md mx-auto z-[60] rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('HOME')} className={`flex flex-col items-center ${activeTab === 'HOME' ? 'text-green-700' : 'text-slate-300'}`}><Home size={24} /><span className="text-[9px] mt-1.5 font-black uppercase">Home</span></button>
        <button onClick={() => setActiveTab('TASKS')} className={`flex flex-col items-center ${activeTab === 'TASKS' ? 'text-green-700' : 'text-slate-300'}`}><ClipboardList size={24} /><span className="text-[9px] mt-1.5 font-black uppercase">Tasks</span></button>
        <button onClick={() => setActiveTab('STOCK')} className={`flex flex-col items-center ${activeTab === 'STOCK' ? 'text-orange-700' : 'text-slate-300'}`}><Package size={24} /><span className="text-[9px] mt-1.5 font-black uppercase">Stock</span></button>
        <button onClick={onExit} className="flex flex-col items-center text-red-400"><X size={24} /><span className="text-[9px] mt-1.5 font-black uppercase">Exit</span></button>
      </nav>
    </div>
  );
};

export default AshaApp;
