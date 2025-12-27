
import React, { useState, useEffect } from 'react';
import { Header, Button, Card } from '../components/UI';
import { 
  Home, ClipboardList, UserPlus, Phone, Search, 
  AlertTriangle, Mic, ChevronRight, CheckCircle2,
  Baby, Heart, Pill, Thermometer, MapPin, X, ArrowLeft, Package, Trash2,
  Users, Activity, Calendar, Stethoscope, Plus, User, Hash, UserCheck, FileText,
  Loader2, RefreshCcw
} from 'lucide-react';
import { RiskLevel, Task } from '../types';
import { analyzeSymptoms } from '../services/geminiService';
import { subscribeToTasks, completeTask, saveAssessment } from '../services/dataService';

// Dynamic Question Set Structure
const QUESTION_FLOW = {
  initial: { id: 'fever', text: "क्या मरीज़ को बुखार है?", sub: "Does patient have fever?", nextIfYes: 'respiratory', nextIfNo: 'general' },
  respiratory: [
    { id: 'cough', text: "क्या मरीज़ को खांसी है?", sub: "Does patient have cough?" },
    { id: 'breathing', text: "क्या सांस लेने में तकलीफ है?", sub: "Difficulty breathing?" }
  ],
  general: [
    { id: 'weakness', text: "क्या शरीर में बहुत कमजोरी है?", sub: "Severe weakness?" },
    { id: 'pain', text: "क्या शरीर के किसी अंग में दर्द है?", sub: "Body or local pain?" }
  ]
};

const MOCK_VISITS: Task[] = [
  { id: 'v1', title: 'Prenatal Checkup', patientName: 'Sita Devi', patientId: 'p1', type: 'PREGNANCY', priority: RiskLevel.HIGH, time: '09:00 AM', completed: false, address: 'Ward 3, House #45' },
  { id: 'v2', title: 'Immunization', patientName: 'Rahul (Baby)', patientId: 'p2', type: 'BABY', priority: RiskLevel.MEDIUM, time: '11:00 AM', completed: true, address: 'Ward 2, House #12' },
  { id: 'v3', title: 'TB Follow-up', patientName: 'Ram Kumar', patientId: 'p3', type: 'MEDICINE', priority: RiskLevel.LOW, time: '02:00 PM', completed: false, address: 'Ward 3, House #102' },
];

// Added lang prop to the component interface
const AshaApp: React.FC<{ onExit: () => void; user: any; lang: 'hi' | 'en' }> = ({ onExit, user, lang }) => {
  const [activeTab, setActiveTab] = useState<'HOME' | 'TASKS' | 'ASSESS' | 'STOCK' | 'VISIT_DETAIL'>('HOME');
  const [tasks, setTasks] = useState<Task[]>(MOCK_VISITS);
  const [selectedVisit, setSelectedVisit] = useState<Task | null>(null);
  
  // Assessment state
  const [qFlow, setQFlow] = useState<any[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);

  // Household Details
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [newPerson, setNewPerson] = useState({ name: '', age: '', gender: 'Male', description: '' });

  useEffect(() => {
    const ashaId = user?.uid || "sunita_rampur";
    const unsubscribe = subscribeToTasks(ashaId, (data) => {
      if (data && data.length > 0) {
        setTasks(data);
      }
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const startNewAssessment = (visit?: Task) => {
    // Explicitly reset all diagnosis and question states
    setDiagnosis(null);
    setAnswers({});
    setQIndex(0);
    setQFlow([{ ...QUESTION_FLOW.initial }]); // Reset to first fever question
    setIsAnalyzing(false);
    
    if (visit) setSelectedVisit(visit);
    else setSelectedVisit(null);
    
    setActiveTab('ASSESS');
  };

  const handleAnswer = (val: boolean) => {
    const currentQ = qFlow[qIndex];
    const newAnswers = { ...answers, [currentQ.id]: val };
    setAnswers(newAnswers);

    // Dynamic Branching Logic
    if (currentQ.id === 'fever') {
      const branch = val ? QUESTION_FLOW.respiratory : QUESTION_FLOW.general;
      setQFlow([...qFlow, ...branch]);
      setQIndex(qIndex + 1);
    } else if (qIndex < qFlow.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      finishAssessment(newAnswers);
    }
  };

  const finishAssessment = async (finalAnswers: any) => {
    setIsAnalyzing(true);
    const symptoms = Object.keys(finalAnswers).filter(k => finalAnswers[k]);
    const result = await analyzeSymptoms(symptoms, 28, 'F', [], lang);
    
    await saveAssessment({
      ashaId: user?.uid || "sunita_rampur",
      patientId: selectedVisit?.patientId || "p_gen",
      symptoms,
      ...result
    });

    setDiagnosis(result);
    setIsAnalyzing(false);
  };

  const resetAssessment = () => {
    setDiagnosis(null);
    setAnswers({});
    setQIndex(0);
    setActiveTab('HOME');
  };

  const handleAddPerson = () => {
    alert(`Person ${newPerson.name} added to visit records!`);
    setNewPerson({ name: '', age: '', gender: 'Male', description: '' });
    setShowAddPerson(false);
  };

  const renderHome = () => (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24">
      <div 
        onClick={() => setActiveTab('TASKS')}
        className="bg-gradient-to-br from-green-700 to-green-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-black tracking-tight leading-none">Namaste, {user?.name?.split(' ')[0] || 'Sunita'}</h2>
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
        <button onClick={() => startNewAssessment()} className="flex-1 bg-white border-2 border-slate-100 p-6 rounded-[2rem] flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md active:scale-95 transition-all group">
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
    </div>
  );

  const renderTasks = () => (
    <div className="p-4 space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 pb-24">
      <div className="flex justify-between items-center px-2 mb-4">
          <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Priority Visits Today</h3>
      </div>
      {tasks.map(task => (
        <Card 
          key={task.id} 
          borderColor={task.priority === RiskLevel.HIGH ? '#D32F2F' : '#F57C00'} 
          className="p-6 border-none shadow-md hover:shadow-xl transition-all rounded-[2.5rem] bg-white group cursor-pointer"
        >
          <div className="flex justify-between items-start" onClick={() => { setSelectedVisit(task); setActiveTab('VISIT_DETAIL'); }}>
            <div className="flex items-start">
              <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center mr-5 shadow-inner">
                {task.type === 'BABY' && <Baby className="text-blue-500" size={28} />}
                {task.type === 'PREGNANCY' && <Heart className="text-pink-500" size={28} />}
                {task.type === 'MEDICINE' && <Pill className="text-orange-500" size={28} />}
                {(!task.type || task.type === 'FEVER' || task.type === 'ELDERLY') && <Users className="text-slate-400" size={28} />}
              </div>
              <div>
                <h3 className="font-black text-xl text-slate-900 leading-tight">{task.patientName}</h3>
                <p className="text-sm font-bold text-slate-500 mt-1">{task.title}</p>
                <p className="text-[10px] text-slate-400 font-bold flex items-center uppercase tracking-widest mt-2">
                  <MapPin className="w-3 h-3 mr-1 text-slate-300" /> {task.address}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-[10px] font-black text-slate-400 mb-2">{task.time}</p>
              {task.completed && <CheckCircle2 className="text-green-600 w-8 h-8" strokeWidth={3} />}
            </div>
          </div>
          {!task.completed && (
            <div className="flex gap-4 mt-8">
              <button onClick={() => startNewAssessment(task)} className="flex-1 bg-slate-900 text-white rounded-2xl py-4 font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">START SCAN</button>
              <button onClick={() => completeTask(task.id)} className="flex-1 border-2 border-slate-100 rounded-2xl py-4 font-black text-xs uppercase tracking-widest text-slate-600 active:scale-95 transition-all">MARK DONE</button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );

  const renderStock = () => (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-24">
      <div className="flex justify-between items-center px-2 mb-2">
          <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Village Health Kit Inventory</h3>
      </div>
      <div className="space-y-4">
        {[
          { name: 'ORS Packets', count: 12, total: 50, color: 'red' },
          { name: 'Paracetamol', count: 45, total: 100, color: 'orange' },
          { name: 'Iron Folic Acid', count: 80, total: 100, color: 'green' },
          { name: 'Contraceptives', count: 20, total: 30, color: 'orange' },
          { name: 'Zinc Tablets', count: 5, total: 40, color: 'red' }
        ].map((item, i) => (
          <Card key={i} className="p-6 border-none bg-white rounded-[2.5rem] shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-black text-slate-900 uppercase text-xs tracking-wider">{item.name}</h4>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                item.color === 'red' ? 'bg-red-50 text-red-600' : 
                item.color === 'orange' ? 'bg-orange-50 text-orange-600' : 
                'bg-green-50 text-green-600'
              }`}>
                {item.count} Left
              </span>
            </div>
            <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
              <div 
                className={`h-full transition-all duration-1000 ${
                  item.color === 'red' ? 'bg-red-500' : 
                  item.color === 'orange' ? 'bg-orange-500' : 
                  'bg-green-500'
                }`} 
                style={{ width: `${(item.count / item.total) * 100}%` }} 
              />
            </div>
          </Card>
        ))}
      </div>
      <Button variant="info" className="rounded-3xl py-4 text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-200">Request Refill</Button>
    </div>
  );

  const renderVisitDetail = () => {
    if (!selectedVisit) return null;
    return (
      <div className="p-6 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-24">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-400 shadow-inner">
            <User size={48} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{selectedVisit.patientName}</h2>
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mt-2">Resident of Rampur • Ward 3</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-6 border-none bg-blue-50/50 rounded-3xl">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Last Visit</p>
            <p className="text-lg font-black text-slate-900 mt-1">15 Dec 2024</p>
          </Card>
          <Card className="p-6 border-none bg-orange-50/50 rounded-3xl">
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Risk Level</p>
            <p className="text-lg font-black text-slate-900 mt-1">{selectedVisit.priority}</p>
          </Card>
        </div>

        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Household Members</h3>
            <button onClick={() => setShowAddPerson(true)} className="bg-green-600 text-white p-2 rounded-xl shadow-lg active:scale-90 transition-all"><Plus size={20} /></button>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center">
             <div className="flex items-center space-x-4">
               <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><User size={20} /></div>
               <p className="font-black text-slate-900">Patient Self</p>
             </div>
             <ChevronRight className="text-slate-200" />
          </div>
        </section>

        <Button onClick={() => startNewAssessment(selectedVisit)} variant="primary" className="py-6 rounded-[2rem]">START SYMPTOM CHECK</Button>
      </div>
    );
  };

  const renderAssessment = () => {
    if (isAnalyzing) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8 min-h-[70vh]">
          <div className="relative">
             <Loader2 size={80} className="text-green-600 animate-spin" strokeWidth={3} />
             <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCcw size={32} className="text-green-200 animate-pulse" />
             </div>
          </div>
          <div className="space-y-4">
             <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
               {lang === 'hi' ? 'आरोग्य स्वर्ण सोच रहा है...' : 'Arogya Swarm Thinking...'}
             </h2>
             <p className="text-slate-400 font-bold text-sm leading-relaxed px-4 italic">Please wait while the Arogya AI generates clinical recommendations based on rural protocols.</p>
          </div>
        </div>
      );
    }

    if (diagnosis) {
      return (
        <div className="p-4 space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className={`p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden ${diagnosis.riskLevel === 'HIGH' ? 'bg-red-600' : diagnosis.riskLevel === 'MEDIUM' ? 'bg-orange-600' : 'bg-green-600'}`}>
            <div className="absolute top-0 right-0 p-8 opacity-20"><Stethoscope size={100} /></div>
            <h3 className="font-black text-5xl tracking-tighter uppercase">{diagnosis.riskLevel} RISK</h3>
            <p className="font-bold opacity-80 mt-4 flex items-center uppercase tracking-widest text-xs">
              <CheckCircle2 size={16} className="mr-2" /> Scan Complete
            </p>
          </div>

          <Card className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-sm space-y-8">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Possible Condition</p>
              <h4 className="text-3xl font-black text-slate-900 leading-tight">{diagnosis.diagnosis}</h4>
            </div>
            
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Instructions</p>
              {diagnosis.recommendations.map((rec: string, i: number) => (
                <div key={i} className="bg-slate-50 p-6 rounded-3xl flex items-start space-x-4 border border-slate-100">
                  <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
                  <p className="text-base font-bold text-slate-700 leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
             <Button onClick={() => { setActiveTab('TASKS'); setDiagnosis(null); }} variant="secondary" className="rounded-full py-4 text-xs">GO TO TASKS</Button>
             <Button onClick={resetAssessment} variant="primary" className="rounded-full py-4 text-xs">BACK HOME</Button>
          </div>
        </div>
      );
    }

    const currentQ = qFlow[qIndex];
    if (!currentQ) return null;

    return (
      <div className="p-6 flex flex-col items-center justify-between min-h-[70vh] animate-in fade-in slide-in-from-right-10 duration-500 pt-12">
        <div className="w-full text-center space-y-6">
           <div className="bg-white p-12 rounded-[4rem] border-2 border-slate-100 shadow-xl relative overflow-hidden">
             <div className="absolute top-4 left-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Question {qIndex + 1}</div>
             <div className="mt-4">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight mb-4">{currentQ.text}</h2>
                <p className="text-xl font-bold text-slate-500 italic uppercase tracking-wider">{currentQ.sub}</p>
             </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-6 w-full px-4 mb-12">
          <button 
            onClick={() => handleAnswer(true)} 
            className="h-44 bg-green-600 text-white rounded-[3rem] font-black text-3xl shadow-2xl shadow-green-600/20 active:scale-95 transition-all flex flex-col items-center justify-center space-y-2"
          >
            <span>YES</span>
            <span className="text-lg opacity-60">हाँ</span>
          </button>
          <button 
            onClick={() => handleAnswer(false)} 
            className="h-44 bg-red-600 text-white rounded-[3rem] font-black text-3xl shadow-2xl shadow-red-600/20 active:scale-95 transition-all flex flex-col items-center justify-center space-y-2"
          >
            <span>NO</span>
            <span className="text-lg opacity-60">नहीं</span>
          </button>
        </div>

        <div className="w-full px-8 space-y-4 mb-12">
           <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
             <div className="h-full bg-slate-900 transition-all duration-500" style={{ width: `${((qIndex + 1) / (qFlow.length || 1)) * 100}%` }} />
           </div>
           <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">Progress: {qIndex + 1} / {qFlow.length}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen shadow-2xl overflow-x-hidden border-x border-slate-100 font-sans">
      <Header 
        title={activeTab === 'HOME' ? 'Arogya Swarm' : activeTab === 'TASKS' ? "Task List" : activeTab === 'STOCK' ? "Inventory" : activeTab === 'VISIT_DETAIL' ? "Visit Detail" : "Symptom Check"} 
        subtitle="ASHA Assistant"
        onBack={activeTab !== 'HOME' ? () => setActiveTab(activeTab === 'VISIT_DETAIL' ? 'TASKS' : 'HOME') : onExit}
        rightElement={
          <div className="flex items-center space-x-2 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-[10px] font-black text-green-700 tracking-widest uppercase">SYNCING</span>
          </div>
        }
      />

      <main>
        {activeTab === 'HOME' && renderHome()}
        {activeTab === 'TASKS' && renderTasks()}
        {activeTab === 'STOCK' && renderStock()}
        {activeTab === 'VISIT_DETAIL' && renderVisitDetail()}
        {activeTab === 'ASSESS' && renderAssessment()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-slate-100 px-10 py-8 flex justify-between items-center max-w-md mx-auto z-[60] rounded-t-[4rem] shadow-lg">
        <button onClick={() => setActiveTab('HOME')} className={`flex flex-col items-center transition-all ${activeTab === 'HOME' ? 'text-green-700 scale-110' : 'text-slate-300'}`}>
          <Home size={24} strokeWidth={activeTab === 'HOME' ? 3 : 2} />
          <span className="text-[9px] mt-2 font-black uppercase tracking-widest">Home</span>
        </button>
        <button onClick={() => setActiveTab('TASKS')} className={`flex flex-col items-center transition-all ${activeTab === 'TASKS' || activeTab === 'VISIT_DETAIL' ? 'text-blue-700 scale-110' : 'text-slate-300'}`}>
          <ClipboardList size={24} strokeWidth={activeTab === 'TASKS' || activeTab === 'VISIT_DETAIL' ? 3 : 2} />
          <span className="text-[9px] mt-2 font-black uppercase tracking-widest">Tasks</span>
        </button>
        <button onClick={() => setActiveTab('STOCK')} className={`flex flex-col items-center transition-all ${activeTab === 'STOCK' ? 'text-orange-700 scale-110' : 'text-slate-300'}`}>
          <Package size={24} strokeWidth={activeTab === 'STOCK' ? 3 : 2} />
          <span className="text-[9px] mt-2 font-black uppercase tracking-widest">Stock</span>
        </button>
        <button onClick={onExit} className="flex flex-col items-center text-slate-400 group active:scale-90 transition-all">
          <X size={24} className="group-hover:rotate-90 transition-transform" />
          <span className="text-[9px] mt-2 font-black uppercase tracking-widest">Exit</span>
        </button>
      </nav>
    </div>
  );
};

export default AshaApp;
