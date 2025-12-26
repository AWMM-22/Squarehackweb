
import React, { useState, useEffect } from 'react';
import { Header, Card, Button } from '../components/UI';
import { 
  Heart, Users, Thermometer, Droplets, 
  Stethoscope, FileText, Apple, Bell,
  ChevronRight, Mic, CheckCircle2, UserPlus, X, Info, Home
} from 'lucide-react';
import { getNutritionAdvice } from '../services/geminiService';

const PatientApp: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [activeScreen, setActiveScreen] = useState<'HOME' | 'SYMPTOMS' | 'REPORTS' | 'NUTRITION'>('HOME');
  const [advice, setAdvice] = useState('लोड हो रहा है... (Loading...)');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [assessmentStep, setAssessmentStep] = useState(0);

  useEffect(() => {
    if (activeScreen === 'NUTRITION') {
      getNutritionAdvice('Arjun', 8).then(setAdvice);
    }
  }, [activeScreen]);

  const renderHome = () => (
    <div className="p-4 space-y-6 animate-in fade-in duration-500">
      <div className="py-4 px-2">
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">Namaste, Ram Kumar! 🙏</h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-2">Welcome to Arogya Swarm</p>
      </div>

      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em]">Family Health Cards</h3>
          <button className="text-blue-600 text-[10px] font-black uppercase tracking-widest flex items-center hover:bg-blue-50 px-3 py-1.5 rounded-full transition-all active:scale-95"><UserPlus size={14} className="mr-1" /> Add Person</button>
        </div>
        <Card className="p-0 overflow-hidden shadow-xl border-none rounded-[2.5rem] bg-white">
          <div className="p-8 flex items-center justify-between border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer group">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-blue-100 rounded-[1.25rem] flex items-center justify-center text-blue-600 font-black text-2xl shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">RK</div>
              <div>
                <p className="font-black text-slate-900 text-lg leading-none">Ram Kumar (You)</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Last BP: 120/80 • Healthy</p>
              </div>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-slate-900 transition-all" />
          </div>
          <div className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-colors cursor-pointer group">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-pink-100 rounded-[1.25rem] flex items-center justify-center text-pink-600 font-black text-2xl shadow-inner group-hover:bg-pink-600 group-hover:text-white transition-all">SD</div>
              <div>
                <p className="font-black text-slate-900 text-lg leading-none">Sita Devi (Wife)</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Pregnancy Month 8 • Next Scan: 22 Dec</p>
              </div>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-slate-900 transition-all" />
          </div>
        </Card>
      </section>

      <div className="bg-orange-50 border-2 border-orange-100 rounded-[2.5rem] p-8 flex items-start shadow-sm shadow-orange-100/50 group hover:shadow-md transition-all">
        <div className="bg-white p-4 rounded-2xl shadow-sm mr-6 group-hover:scale-110 transition-all">
          <Bell className="text-orange-500" size={32} />
        </div>
        <div className="text-sm">
          <p className="font-black text-orange-900 uppercase tracking-widest text-xs mb-1">Health Alert</p>
          <p className="text-orange-800 font-bold text-lg leading-tight">Priya's Vaccination due in 2 days.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2">
        <button 
          onClick={() => setActiveScreen('SYMPTOMS')}
          className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 active:scale-95 transition-all flex flex-col items-center justify-center text-center space-y-4 group hover:shadow-xl hover:-translate-y-1"
        >
          <div className="w-20 h-20 bg-red-50 rounded-[1.5rem] flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all shadow-inner">
            <Thermometer size={36} />
          </div>
          <div className="space-y-1">
             <span className="font-black text-slate-900 block">Symptom Scan</span>
             <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">Check Health</span>
          </div>
        </button>

        <button 
          onClick={() => setActiveScreen('NUTRITION')}
          className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 active:scale-95 transition-all flex flex-col items-center justify-center text-center space-y-4 group hover:shadow-xl hover:-translate-y-1"
        >
          <div className="w-20 h-20 bg-green-50 rounded-[1.5rem] flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all shadow-inner">
            <Apple size={36} />
          </div>
          <div className="space-y-1">
             <span className="font-black text-slate-900 block">Nutrition Guide</span>
             <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">Diet Advice</span>
          </div>
        </button>
      </div>

      <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 space-y-6">
          <h4 className="font-black text-xl flex items-center uppercase tracking-[0.2em] text-blue-400"><Info className="mr-3" /> Daily AI Advice</h4>
          <p className="text-2xl font-bold leading-tight italic text-blue-100 tracking-tight">"Drinking warm water with lemon every morning helps boost your immunity naturally."</p>
        </div>
        <Droplets className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 text-blue-400 rotate-12 group-hover:scale-110 transition-all" />
      </div>
    </div>
  );

  const renderSymptoms = () => (
    <div className="p-4 space-y-8 animate-in fade-in slide-in-from-right-10 duration-500">
      {!selectedMember ? (
        <div className="space-y-10 py-10">
          <div className="text-center space-y-3">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Whose Symptoms?</h2>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] leading-relaxed">Select family member to start check</p>
          </div>
          <div className="space-y-4">
            {['Ram Kumar (You)', 'Sita Devi (Wife)', 'Arjun (Son)', 'Priya (Daughter)'].map(m => (
              <button 
                key={m} 
                onClick={() => setSelectedMember(m)}
                className="w-full bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:border-orange-600 hover:shadow-2xl hover:-translate-y-1 transition-all font-black text-2xl text-left flex justify-between items-center group"
              >
                {m}
                <ChevronRight className="text-slate-300 group-hover:text-orange-600 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">What's the issue?</h2>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Select common health issues</p>
          </div>

          <div className="grid grid-cols-3 gap-4 px-2">
            {[
              { icon: '🤒', label: 'Fever', sub: 'बुखार' },
              { icon: '🤮', label: 'Vomiting', sub: 'उल्टी' },
              { icon: '🤧', label: 'Cough', sub: 'खांसी' },
              { icon: '💩', label: 'Diarrhea', sub: 'दस्त' },
              { icon: '🤕', label: 'Injury', sub: 'चोट' },
              { icon: '🦵', label: 'Body Pain', sub: 'दर्द' }
            ].map(item => (
              <button key={item.label} className="bg-white aspect-square rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-1 active:scale-95 hover:shadow-xl hover:border-orange-500 transition-all group">
                <span className="text-5xl group-hover:scale-110 transition-all">{item.icon}</span>
                <span className="font-black text-[10px] text-slate-800 mt-2 uppercase tracking-widest">{item.label}</span>
                <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{item.sub}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center space-y-6">
            <button className="w-32 h-32 bg-orange-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-orange-200 animate-pulse active:scale-90 transition-all">
              <Mic size={48} strokeWidth={3} />
            </button>
            <p className="font-black text-slate-400 uppercase tracking-[0.3em] text-xs">Tap & Describe Symtoms</p>
          </div>

          <div className="pt-10 flex gap-4 px-4 pb-10">
            <Button onClick={() => setSelectedMember(null)} variant="secondary" className="rounded-full py-5 text-sm font-black uppercase tracking-widest shadow-lg">CANCEL</Button>
            <Button variant="warning" className="rounded-full py-5 text-sm font-black uppercase tracking-widest shadow-2xl shadow-orange-200">ANALYSE NOW</Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderNutrition = () => (
    <div className="p-4 space-y-8 animate-in fade-in slide-in-from-right-10 duration-500 pb-20">
       <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl border border-slate-50 text-center space-y-8">
          <div className="w-28 h-28 bg-green-50 rounded-[2rem] mx-auto flex items-center justify-center text-green-600 shadow-inner">
            <Apple size={56} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">Dietary Advice for Arjun</h2>
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">(8 Year Old Child • Growing Stage)</p>
          </div>
          
          <div className="bg-green-50 p-10 rounded-[3rem] border-l-[12px] border-green-600 text-left relative overflow-hidden shadow-inner shadow-green-100/30">
             <div className="absolute top-0 right-0 p-6 opacity-5"><Apple size={100} /></div>
             <p className="text-2xl font-bold leading-relaxed text-green-900 relative z-10 italic">"{advice}"</p>
          </div>
       </div>

       <div className="space-y-6 px-4">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-slate-900 uppercase tracking-[0.2em] text-[10px]">Arjun's Daily Meal Log</h3>
            <button className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 px-3 py-1.5 rounded-full transition-all">+ Add Entry</button>
          </div>
          <Card className="p-8 flex items-center justify-between border-none shadow-sm rounded-[2.5rem] bg-white group hover:shadow-xl transition-all">
            <div className="flex items-center space-x-6">
              <div className="text-4xl bg-slate-50 p-3 rounded-2xl group-hover:scale-110 transition-all">🌅</div>
              <div>
                <p className="font-black text-slate-800 text-lg leading-none">Breakfast Logged</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">2 Multi-Grain Roti + Dal + Glass of Milk</p>
              </div>
            </div>
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-inner">
              <CheckCircle2 size={24} />
            </div>
          </Card>
          <div className="bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2.5rem] p-10 text-center space-y-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-loose">Lunch, Evening Snack, and Dinner<br/>are waiting to be logged</p>
          </div>
       </div>

       <div className="pt-8 px-4">
         <Button onClick={() => setActiveScreen('HOME')} variant="secondary" className="rounded-full py-5 uppercase font-black text-xs tracking-[0.3em] shadow-lg">Back to Portal</Button>
       </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen pb-10 shadow-2xl relative selection:bg-orange-100">
      <Header 
        title={activeScreen === 'HOME' ? 'Arogya Swarm' : activeScreen === 'SYMPTOMS' ? 'Health Check' : 'Nutrition Hub'} 
        subtitle={activeScreen === 'HOME' ? 'Patient Portal • Online' : ''}
        onBack={activeScreen !== 'HOME' ? () => { setActiveScreen('HOME'); setSelectedMember(null); } : onExit}
        rightElement={
          <div className="w-12 h-12 bg-slate-900 text-white rounded-[1.25rem] flex items-center justify-center font-black shadow-xl shadow-black/10">RK</div>
        }
      />
      
      <main className="pb-24">
        {activeScreen === 'HOME' && renderHome()}
        {activeScreen === 'SYMPTOMS' && renderSymptoms()}
        {activeScreen === 'NUTRITION' && renderNutrition()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-10 py-6 flex justify-between items-center max-w-md mx-auto z-40 rounded-t-[3rem] shadow-2xl">
        <button onClick={() => setActiveScreen('HOME')} className={`flex flex-col items-center transition-all active:scale-90 ${activeScreen === 'HOME' ? 'text-orange-600' : 'text-slate-400'}`}>
          <Home size={24} strokeWidth={activeScreen === 'HOME' ? 3 : 2} />
          <span className="text-[10px] mt-1.5 font-black uppercase tracking-widest">Portal</span>
        </button>
        <button className="flex flex-col items-center text-slate-400 active:scale-90 transition-all">
          <Heart size={24} />
          <span className="text-[10px] mt-1.5 font-black uppercase tracking-widest">Health</span>
        </button>
        <button className="flex flex-col items-center text-slate-400 active:scale-90 transition-all">
          <Users size={24} />
          <span className="text-[10px] mt-1.5 font-black uppercase tracking-widest">Family</span>
        </button>
        <button onClick={onExit} className="flex flex-col items-center text-red-400 active:scale-90 transition-all">
          <X size={24} />
          <span className="text-[10px] mt-1.5 font-black uppercase tracking-widest">Logout</span>
        </button>
      </nav>
    </div>
  );
};

export default PatientApp;
