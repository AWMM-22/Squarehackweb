
import React, { useState, useEffect } from 'react';
import { Header, Card, Button } from '../components/UI';
import { 
  Heart, Users, Thermometer, Droplets, 
  Stethoscope, FileText, Apple, Bell,
  ChevronRight, Mic, CheckCircle2, UserPlus, X, Info, Home,
  User, Activity, BookOpen
} from 'lucide-react';
import { getNutritionAdvice } from '../services/geminiService';

const PatientApp: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [activeScreen, setActiveScreen] = useState<'HOME' | 'SYMPTOMS' | 'REPORTS' | 'NUTRITION'>('HOME');
  const [advice, setAdvice] = useState('लोड हो रहा है... (Loading...)');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  useEffect(() => {
    if (activeScreen === 'NUTRITION') {
      getNutritionAdvice('Arjun', 8).then(setAdvice);
    }
  }, [activeScreen]);

  const renderHome = () => (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Dynamic Welcome & Quick Access */}
      <div className="py-6 px-4">
        <div className="flex justify-between items-center">
           <div className="space-y-1">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Namaste, Ram! 🙏</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Village Rampur • Ward 3</p>
           </div>
           <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 relative">
              <Bell className="text-slate-400" />
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
           </div>
        </div>
      </div>

      {/* Family Section - Highly Visual Cards */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em]">Family Dashboard</h3>
          <button className="text-orange-600 text-[10px] font-black uppercase tracking-widest flex items-center hover:bg-orange-50 px-4 py-2 rounded-full transition-all active:scale-95 border border-orange-100 shadow-sm"><UserPlus size={14} className="mr-2" /> Add Member</button>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <Card className="p-0 overflow-hidden shadow-xl border-none rounded-[2.5rem] bg-white group hover:shadow-2xl transition-all">
            <div className="p-8 flex items-center justify-between border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer group">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-blue-100 rounded-[1.5rem] flex items-center justify-center text-blue-600 font-black text-2xl shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">RK</div>
                <div>
                  <p className="font-black text-slate-900 text-xl leading-none">Ram Kumar (You)</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="bg-green-50 text-green-600 px-3 py-0.5 rounded-lg text-[10px] font-black uppercase">Vitals Normal</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Last Checked: Yesterday</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="text-slate-300 group-hover:text-slate-900 transition-all" />
            </div>
            
            <div className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-colors cursor-pointer group">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-pink-100 rounded-[1.5rem] flex items-center justify-center text-pink-600 font-black text-2xl shadow-inner group-hover:bg-pink-600 group-hover:text-white transition-all">SD</div>
                <div>
                  <p className="font-black text-slate-900 text-xl leading-none">Sita Devi (Wife)</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="bg-orange-50 text-orange-600 px-3 py-0.5 rounded-lg text-[10px] font-black uppercase">Month 8 Scan Due</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">ASHA Visit: Tomorrow</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="text-slate-300 group-hover:text-slate-900 transition-all" />
            </div>
          </Card>
        </div>
      </section>

      {/* Main Grid Utilization */}
      <div className="grid grid-cols-2 gap-4 pt-4">
        <button 
          onClick={() => setActiveScreen('SYMPTOMS')}
          className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 active:scale-95 transition-all flex flex-col items-center justify-center text-center space-y-4 group hover:shadow-2xl hover:-translate-y-2"
        >
          <div className="w-20 h-20 bg-red-50 rounded-[1.75rem] flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all shadow-inner border border-red-100/50">
            <Thermometer size={40} />
          </div>
          <div className="space-y-1">
             <span className="font-black text-slate-900 text-lg block leading-none">Health Check</span>
             <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] block">Symptom Scan</span>
          </div>
        </button>

        <button 
          onClick={() => setActiveScreen('NUTRITION')}
          className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 active:scale-95 transition-all flex flex-col items-center justify-center text-center space-y-4 group hover:shadow-2xl hover:-translate-y-2"
        >
          <div className="w-20 h-20 bg-green-50 rounded-[1.75rem] flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all shadow-inner border border-green-100/50">
            <Apple size={40} />
          </div>
          <div className="space-y-1">
             <span className="font-black text-slate-900 text-lg block leading-none">Nutrition Guide</span>
             <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] block">Dietary Advice</span>
          </div>
        </button>
      </div>

      {/* Daily Advice Card - Bold Branding */}
      <div className="bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl -mr-24 -mt-24 group-hover:bg-blue-600/40 transition-all" />
        <div className="relative z-10 space-y-6">
          <div className="flex items-center space-x-3 text-blue-400">
             <Activity className="w-6 h-6 animate-pulse" />
             <h4 className="font-black text-xl uppercase tracking-[0.25em]">Health Insight</h4>
          </div>
          <p className="text-2xl font-bold leading-relaxed italic text-blue-100 tracking-tight">"Fresh green vegetables like Palak are available this week in the Rampur market. They are great for building iron!"</p>
          <div className="pt-4 flex items-center space-x-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
             <Info size={12} />
             <span>AI Insight Generated for your village</span>
          </div>
        </div>
      </div>

      {/* Educational Resources Tile */}
      <Card className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-xl transition-all cursor-pointer">
        <div className="flex items-center space-x-5">
           <div className="p-4 bg-orange-50 text-orange-600 rounded-[1.25rem] shadow-inner group-hover:scale-110 transition-transform">
              <BookOpen size={24} />
           </div>
           <div>
              <p className="font-black text-slate-900 text-lg leading-none">Village Library</p>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Pregnancy & Child Care Guide</p>
           </div>
        </div>
        <ChevronRight className="text-slate-300" />
      </Card>
    </div>
  );

  const renderSymptoms = () => (
    <div className="p-4 space-y-8 animate-in fade-in slide-in-from-right-10 duration-500 pb-20">
      {!selectedMember ? (
        <div className="space-y-12 py-10">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Who's Feeling Unwell?</h2>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] leading-relaxed">Select family member to start the AI Symptom Scan</p>
          </div>
          <div className="space-y-4 px-2">
            {['Ram Kumar (You)', 'Sita Devi (Wife)', 'Arjun (Son)', 'Priya (Daughter)'].map(m => (
              <button 
                key={m} 
                onClick={() => setSelectedMember(m)}
                className="w-full bg-white p-10 rounded-[3rem] shadow-sm border-2 border-slate-100 hover:border-orange-600 hover:shadow-2xl hover:-translate-y-2 transition-all font-black text-3xl text-left flex justify-between items-center group active:scale-95"
              >
                {m}
                <div className="w-12 h-12 rounded-full border-2 border-slate-50 flex items-center justify-center group-hover:bg-orange-600 group-hover:border-orange-600 transition-all">
                   <ChevronRight className="text-slate-300 group-hover:text-white" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Current Symptoms</h2>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">What is wrong with {selectedMember.split(' ')[0]}?</p>
          </div>

          <div className="grid grid-cols-3 gap-6 px-4">
            {[
              { icon: '🤒', label: 'Fever', sub: 'बुखार' },
              { icon: '🤮', label: 'Vomiting', sub: 'उल्टी' },
              { icon: '🤧', label: 'Cough', sub: 'खांसी' },
              { icon: '💩', label: 'Diarrhea', sub: 'दस्त' },
              { icon: '🤕', label: 'Injury', sub: 'चोट' },
              { icon: '🦵', label: 'Body Pain', sub: 'दर्द' }
            ].map(item => (
              <button key={item.label} className="bg-white aspect-square rounded-[3rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-2 active:scale-90 hover:shadow-2xl hover:border-orange-500 transition-all group relative overflow-hidden">
                <span className="text-5xl group-hover:scale-125 transition-all z-10">{item.icon}</span>
                <span className="font-black text-[11px] text-slate-800 uppercase tracking-widest z-10">{item.label}</span>
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest z-10">{item.sub}</span>
                <div className="absolute inset-0 bg-orange-50 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center space-y-8 pt-6">
            <button className="w-40 h-40 bg-orange-600 rounded-full flex items-center justify-center text-white shadow-[0_20px_60px_rgba(234,88,12,0.4)] animate-pulse active:scale-90 transition-all relative group">
              <div className="absolute inset-0 bg-orange-600 rounded-full animate-ping opacity-20" />
              <Mic size={64} strokeWidth={3} className="relative z-10 group-hover:scale-110 transition-transform" />
            </button>
            <div className="text-center">
               <p className="font-black text-slate-900 uppercase tracking-[0.3em] text-xs">Tap to Speak Symptoms</p>
               <p className="text-slate-400 font-bold text-[10px] mt-2 italic">Arogya Swarm will listen to your description</p>
            </div>
          </div>

          <div className="pt-10 flex gap-6 px-8 pb-10">
            <Button onClick={() => setSelectedMember(null)} variant="secondary" className="rounded-full py-6 text-sm font-black uppercase tracking-[0.2em] shadow-lg border-none bg-slate-100 text-slate-500">CANCEL</Button>
            <Button variant="warning" className="rounded-full py-6 text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-orange-200">ANALYSE NOW</Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderNutrition = () => (
    <div className="p-4 space-y-10 animate-in fade-in slide-in-from-right-10 duration-500 pb-24">
       <div className="bg-white rounded-[4rem] p-12 shadow-2xl border border-slate-50 text-center space-y-10 relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-48 h-48 bg-green-50 rounded-full blur-3xl opacity-50" />
          <div className="w-32 h-32 bg-green-50 rounded-[2.5rem] mx-auto flex items-center justify-center text-green-600 shadow-inner border border-green-100 relative z-10 group hover:scale-110 transition-transform">
            <Apple size={64} />
          </div>
          <div className="space-y-3 relative z-10">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Arjun's Diet Guide</h2>
            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">(Personalized Nutrition for 8y Child)</p>
          </div>
          
          <div className="bg-green-50/50 p-12 rounded-[3.5rem] border-l-[16px] border-green-600 text-left relative overflow-hidden shadow-inner border border-green-100/30">
             <div className="absolute top-0 right-0 p-8 opacity-5"><Apple size={120} /></div>
             <p className="text-3xl font-bold leading-relaxed text-green-900 relative z-10 italic tracking-tight">"{advice}"</p>
          </div>
       </div>

       <div className="space-y-6 px-6">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-slate-900 uppercase tracking-[0.3em] text-[11px]">Today's Meal History</h3>
            <button className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 px-4 py-2 rounded-full transition-all border border-blue-50">+ Log Meal</button>
          </div>
          
          <Card className="p-10 flex items-center justify-between border-none shadow-sm rounded-[3rem] bg-white group hover:shadow-2xl transition-all cursor-pointer">
            <div className="flex items-center space-x-8">
              <div className="text-5xl bg-slate-50 p-4 rounded-3xl group-hover:scale-110 transition-all border border-slate-100 shadow-sm">🌅</div>
              <div>
                <p className="font-black text-slate-800 text-2xl leading-none">Breakfast Logged</p>
                <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-3 leading-relaxed">2 Multi-Grain Roti + Dal + Glass of Fresh Milk</p>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-inner border border-green-200">
              <CheckCircle2 size={28} strokeWidth={3} />
            </div>
          </Card>
          
          <div className="bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3.5rem] p-12 text-center space-y-4">
            <div className="flex justify-center space-x-4 opacity-30">
              <div className="text-4xl">☀️</div>
              <div className="text-4xl">🌙</div>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-loose">Lunch and Dinner logs are<br/>currently missing for today</p>
          </div>
       </div>

       <div className="pt-8 px-6">
         <Button onClick={() => setActiveScreen('HOME')} variant="secondary" className="rounded-full py-6 uppercase font-black text-xs tracking-[0.4em] shadow-xl border-none bg-white text-slate-400 hover:text-slate-900">Return to Hub</Button>
       </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen pb-28 shadow-2xl relative selection:bg-orange-100 border-x border-slate-100 overflow-hidden">
      <Header 
        title={activeScreen === 'HOME' ? 'Arogya Swarm' : activeScreen === 'SYMPTOMS' ? 'Health Check' : 'Nutrition'} 
        subtitle={activeScreen === 'HOME' ? 'Family Health Hub' : 'Personal Guide'}
        onBack={activeScreen !== 'HOME' ? () => { setActiveScreen('HOME'); setSelectedMember(null); } : onExit}
        rightElement={
          <div className="w-14 h-14 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center font-black shadow-2xl shadow-black/20 border-2 border-white/10 group active:scale-95 transition-all">RK</div>
        }
      />
      
      <main className="pb-10">
        {activeScreen === 'HOME' && renderHome()}
        {activeScreen === 'SYMPTOMS' && renderSymptoms()}
        {activeScreen === 'NUTRITION' && renderNutrition()}
      </main>

      {/* Modern Floating Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-slate-100 px-12 py-8 flex justify-between items-center max-w-md mx-auto z-[70] rounded-t-[4rem] shadow-[0_-20px_60px_rgba(0,0,0,0.06)]">
        <button onClick={() => { setActiveScreen('HOME'); setSelectedMember(null); }} className={`flex flex-col items-center transition-all active:scale-90 ${activeScreen === 'HOME' ? 'text-orange-600 scale-125' : 'text-slate-300 hover:text-slate-500'}`}>
          <Home size={24} strokeWidth={activeScreen === 'HOME' ? 3 : 2} />
          <span className="text-[9px] mt-2 font-black uppercase tracking-[0.2em]">Hub</span>
        </button>
        <button className="flex flex-col items-center text-slate-300 active:scale-90 transition-all hover:text-slate-500">
          <Heart size={24} />
          <span className="text-[9px] mt-2 font-black uppercase tracking-[0.2em]">Health</span>
        </button>
        <button className="flex flex-col items-center text-slate-300 active:scale-90 transition-all hover:text-slate-500">
          <Users size={24} />
          <span className="text-[9px] mt-2 font-black uppercase tracking-[0.2em]">Family</span>
        </button>
        <button onClick={onExit} className="flex flex-col items-center text-red-300 group active:scale-90 transition-all hover:text-red-500">
          <X size={24} className="group-hover:rotate-90 transition-transform" />
          <span className="text-[9px] mt-2 font-black uppercase tracking-[0.2em]">Exit</span>
        </button>
      </nav>
    </div>
  );
};

export default PatientApp;
