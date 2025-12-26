
import React, { useState } from 'react';
import { Header, Card, Button } from '../components/UI';
import { 
  BarChart3, Users, PhoneCall, FileText, 
  Search, Bell, Activity, ArrowRight,
  TrendingUp, AlertCircle, Trash2, Plus, Home, Menu, X, Play, Camera, Clipboard,
  MapPin, ArrowLeft, Package, Map as MapIcon, Stethoscope, Clock,
  // Fix: Added missing icons
  CheckCircle2, AlertTriangle
} from 'lucide-react';
import { RiskLevel } from '../types';
import { ArogyaLogo } from '../components/Logo';

const DoctorApp: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [activeView, setActiveView] = useState<'DASH' | 'CASE' | 'MAP' | 'STOCK'>('DASH');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const mockQueue = [
    { id: '1', name: 'Sita Devi', age: 28, risk: RiskLevel.HIGH, symptom: 'Fever (3 days), Severe Cough', asha: 'Sunita' },
    { id: '2', name: 'Kamla Devi', age: 55, risk: RiskLevel.MEDIUM, symptom: 'Joint Pain, High BP', asha: 'Anita' },
    { id: '3', name: 'Ram Kumar', age: 42, risk: RiskLevel.LOW, symptom: 'Follow-up for TB', asha: 'Sunita' },
  ];

  const handleSelectCase = (id: string) => {
    setSelectedCaseId(id);
    setActiveView('CASE');
  };

  const renderDashboard = () => (
    <div className="p-6 lg:p-12 space-y-10 max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* Premium Header Profile Card */}
      <div className="bg-white p-10 rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col md:flex-row items-center justify-between group">
        <div className="flex items-center space-x-10 text-center md:text-left flex-col md:flex-row">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2rem] flex items-center justify-center text-white shadow-2xl group-hover:scale-105 transition-transform">
             <Stethoscope size={48} />
          </div>
          <div className="mt-4 md:mt-0">
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight">Welcome, Dr. Sharma</h2>
            <div className="flex items-center justify-center md:justify-start space-x-3 mt-3">
               <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.25em]">District Hospital</span>
               <span className="bg-slate-50 text-slate-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.25em]">Rampur PHC</span>
            </div>
          </div>
        </div>
        <div className="hidden lg:flex items-center space-x-8 border-l border-slate-100 pl-10 ml-10">
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Current Shift</p>
              <p className="font-black text-slate-700 text-lg flex items-center mt-1"><Clock className="w-4 h-4 mr-2 text-blue-600" /> 08:00 - 16:00</p>
           </div>
           <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          {/* Detailed Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-50 group hover:shadow-xl hover:border-blue-100 transition-all cursor-default">
              <div className="flex justify-between items-start">
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">In Waiting</p>
                 <Users className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-5xl font-black text-slate-900 mt-2 tracking-tighter leading-none">12</p>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-4 flex items-center">
                 <TrendingUp className="w-3 h-3 mr-1 text-green-500" /> Avg. 12m wait time
              </p>
            </div>
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-50 group hover:shadow-xl hover:border-green-100 transition-all cursor-default">
              <div className="flex justify-between items-start">
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Completed</p>
                 <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-5xl font-black text-green-600 mt-2 tracking-tighter leading-none">08</p>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-4">Total Consultation Revenue: ₹400</p>
            </div>
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-50 group hover:shadow-xl hover:border-red-100 transition-all cursor-default relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><AlertCircle size={80} /></div>
              <div className="flex justify-between items-start">
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">High Risk</p>
                 <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
              </div>
              <p className="text-5xl font-black text-red-600 mt-2 tracking-tighter leading-none">03</p>
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-4">Prioritized in queue</p>
            </div>
          </div>

          <section className="space-y-6">
            <div className="flex justify-between items-end px-4">
              <h2 className="text-2xl font-black flex items-center text-slate-900 tracking-tight">
                <Users className="w-6 h-6 mr-3 text-blue-600" /> Patient Consultation Queue
              </h2>
              <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">History View →</button>
            </div>
            
            <div className="space-y-4">
              {mockQueue.map(item => (
                <Card key={item.id} borderColor={item.risk === RiskLevel.HIGH ? '#D32F2F' : '#F57C00'} className="p-8 border-none shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-2xl cursor-pointer transition-all active:scale-[0.99] rounded-[2.5rem] bg-white group flex flex-col sm:flex-row sm:items-center justify-between">
                  <div className="flex-1 min-w-0" onClick={() => handleSelectCase(item.id)}>
                    <div className="flex items-center space-x-3">
                      <h3 className="font-black text-2xl text-slate-800 tracking-tight leading-none group-hover:text-blue-600 transition-colors">{item.name}, {item.age}F</h3>
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${item.risk === RiskLevel.HIGH ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>{item.risk} RISK</span>
                    </div>
                    <p className="text-sm font-bold text-slate-400 mt-2 leading-relaxed italic">" {item.symptom} "</p>
                    <div className="flex items-center mt-5 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
                      <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center mr-3 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all"><Users size={12} /></div>
                      Ref by: ASHA {item.asha} • Ward 3
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 mt-6 sm:mt-0 sm:ml-10">
                    <button className="p-5 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm active:scale-90">
                      <PhoneCall size={24} />
                    </button>
                    <button className="hidden sm:flex p-5 bg-slate-50 text-slate-300 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-all active:scale-90">
                      <ArrowRight size={24} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Intelligence Panel */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl space-y-8 relative overflow-hidden group">
             <div className="absolute -top-10 -right-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
               <TrendingUp size={240} />
             </div>
             <div className="relative z-10 space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-2xl tracking-tight flex items-center"><Activity className="mr-3 text-red-500" /> Surveillance</h3>
                  <div className="bg-red-500/20 px-4 py-1 rounded-full text-[9px] font-black tracking-widest uppercase text-red-400 border border-red-500/30">Active Outbreak</div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-inner group-hover:bg-white/10 transition-colors">
                    <p className="text-red-400 font-black text-4xl tracking-tighter">↑ 40%</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2">Gastroenteritis Spike (Ward 3)</p>
                    <div className="mt-6 flex gap-2">
                       <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recommended: Water Chlorination</p>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setActiveView('MAP')} 
                  className="w-full bg-white text-slate-900 py-5 rounded-[1.5rem] text-xs font-black shadow-xl hover:bg-slate-100 transition-all uppercase tracking-[0.2em] active:scale-95 flex items-center justify-center"
                >
                  <MapIcon className="mr-3 w-4 h-4" /> Open Outbreak Map
                </button>
             </div>
          </div>

          <Card className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-50 relative overflow-hidden group">
             <div className="absolute -bottom-10 -right-10 p-4 opacity-5 group-hover:-translate-x-5 transition-transform"><Package size={140} /></div>
             <div className="flex justify-between items-center mb-10 relative z-10">
                <h3 className="font-black text-slate-900 flex items-center uppercase tracking-widest text-xs leading-none">
                  <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mr-3"><Package size={16} /></div>
                  Primary Health Stock
                </h3>
                <button onClick={() => setActiveView('STOCK')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Manage Kit</button>
             </div>
             
             <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest">ORS Packets</span>
                    <span className="text-[10px] font-black text-red-600 bg-red-50 px-3 py-1 rounded-full uppercase">Critical: 15</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                     <div className="h-full bg-red-500 w-[15%]" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Paracetamol 500</span>
                    <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full uppercase">Low: 45</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                     <div className="h-full bg-orange-500 w-[35%]" />
                  </div>
                </div>
             </div>
             
             <div className="mt-10 pt-8 border-t border-slate-50">
                <button className="text-[10px] font-black text-slate-400 hover:text-slate-900 transition-colors flex items-center uppercase tracking-widest">
                   <AlertCircle size={14} className="mr-2" /> 2 Items Expiring this month
                </button>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderCaseDetail = () => (
    <div className="max-w-7xl mx-auto p-6 lg:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-right-20 duration-700 pb-32">
      {/* LEFT PANEL: Medical History & Vitals */}
      <div className="space-y-10">
        <div className="flex items-center space-x-8">
          <div className="w-28 h-28 bg-gradient-to-br from-blue-600 to-blue-900 rounded-[2.5rem] flex items-center justify-center text-white font-black text-4xl shadow-2xl border-4 border-white">SD</div>
          <div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Sita Devi, 28F</h2>
            <div className="flex items-center space-x-3 mt-4">
               <span className="bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center">
                 <MapPin className="w-3 h-3 mr-2" /> Rampur • Ward 3
               </span>
               <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Case ID: #1024</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="text-center p-8 bg-red-50/50 rounded-[2.5rem] border border-red-100 shadow-sm transition-transform hover:-translate-y-1">
            <p className="text-[10px] text-red-600 font-black uppercase tracking-[0.3em] mb-2">Current Temp</p>
            <p className="text-4xl font-black text-slate-900">101°F</p>
          </div>
          <div className="text-center p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm transition-transform hover:-translate-y-1">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-2">Blood Pressure</p>
            <p className="text-3xl font-black text-slate-900">120/80</p>
          </div>
          <div className="text-center p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm transition-transform hover:-translate-y-1">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-2">Pulse Rate</p>
            <p className="text-4xl font-black text-slate-900">88</p>
          </div>
        </div>

        {/* AI Chart Insight */}
        <Card className="p-10 bg-slate-900 text-white border-none rounded-[3.5rem] shadow-2xl space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform"><Activity size={160} /></div>
          <div className="relative z-10 space-y-4">
             <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-600 rounded-2xl shadow-lg"><Activity size={24} className="text-white" /></div>
                <h3 className="font-black text-2xl tracking-tight leading-none uppercase text-blue-400 tracking-[0.2em]">Arogya Swarm AI Assessment</h3>
             </div>
             <p className="text-4xl font-black text-white leading-tight tracking-tighter pt-4">"Likely Upper Respiratory Infection (URI)"</p>
             <div className="space-y-3 pt-6">
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/10">
                   <div className="h-full bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.6)] w-[78%] transition-all duration-1000" />
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">AI Diagnostic Confidence Score</span>
                  <span className="text-xs font-black text-blue-400">78% Match</span>
                </div>
             </div>
          </div>
        </Card>

        {/* Case Narrative */}
        <section className="space-y-6">
           <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] px-4">Field Examination Evidence</h4>
           <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-10">
              <div className="flex items-start space-x-8">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shrink-0 shadow-inner"><Clipboard size={28} /></div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ASHA Narrative • Sunita Rampur</p>
                   <p className="text-xl font-bold text-slate-800 leading-relaxed italic">"Patient reports a heavy cough for the last 72 hours. High fever develops specifically at night. I observed no chest congestion but redness in the throat."</p>
                </div>
              </div>
              
              <div className="bg-slate-50/50 p-8 rounded-[2.5rem] flex items-center justify-between border border-slate-100 group">
                <div className="flex items-center space-x-6">
                   <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all cursor-pointer hover:bg-blue-500"><Play size={24} fill="white" className="ml-1" /></div>
                   <div>
                      <p className="text-lg font-black text-slate-900 leading-none">Voice Symptom Note</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Duration: 0:45 • Rural Dialect Detected</p>
                   </div>
                </div>
                <button className="text-blue-600 font-black text-[10px] uppercase tracking-widest border-2 border-blue-100 px-6 py-3 rounded-2xl hover:bg-white transition-all shadow-sm">TRANSCRIPT</button>
              </div>
           </div>
        </section>
      </div>

      {/* RIGHT PANEL: Clinical Actions */}
      <div className="space-y-8">
        <div className="bg-slate-900 text-white p-12 rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.15)] space-y-12 sticky top-32 border border-white/5">
          <div className="space-y-10">
            <div className="flex justify-between items-center border-b border-white/10 pb-10">
              <h3 className="text-4xl font-black tracking-tighter leading-none">Clinical Intervention</h3>
              <div className="bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full flex items-center space-x-3">
                 <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                 <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Active Scan</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Button variant="info" className="py-10 rounded-[2.5rem] shadow-2xl shadow-blue-600/10 hover:shadow-blue-600/20 active:scale-95 transition-all text-sm uppercase tracking-[0.2em]" icon={PhoneCall}>VIDEO CONSULT</Button>
              <Button variant="secondary" className="bg-white/5 text-white border-2 border-white/10 py-10 rounded-[2.5rem] hover:bg-white/10 active:scale-95 transition-all shadow-xl text-sm uppercase tracking-[0.2em] shadow-black/10">VOICE ONLY</Button>
            </div>

            <div className="space-y-6 pt-6">
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Draft E-Prescription</span>
                <button className="text-blue-400 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors flex items-center bg-white/5 px-4 py-2 rounded-full border border-white/10"><Plus size={14} className="mr-2" /> New Medicine</button>
              </div>
              <div className="bg-white/5 p-12 rounded-[3rem] flex flex-col items-center justify-center border-2 border-dashed border-white/10 space-y-6 hover:bg-white/[0.07] transition-colors cursor-pointer group">
                <div className="p-5 bg-white/5 rounded-3xl group-hover:scale-110 transition-transform"><FileText className="text-slate-600 group-hover:text-blue-400 transition-colors" size={48} strokeWidth={1.5} /></div>
                <div className="text-center">
                   <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em]">Patient Medical Chart Empty</p>
                   <p className="text-slate-600 text-[10px] font-bold mt-2">Add diagnosis or medicines to start drafting</p>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button className="w-full bg-green-600 text-white py-8 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-green-600/30 active:scale-95 hover:bg-green-500 transition-all uppercase tracking-tighter tracking-tight">AUTHORIZE & SIGN RX</button>
              <p className="text-center text-[9px] font-black text-slate-600 uppercase tracking-widest mt-6 opacity-50 italic">Digital Signature will be applied automatically</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-x-hidden selection:bg-blue-100 font-sans">
      <nav className={`fixed inset-y-0 left-0 bg-slate-900 text-white transition-all duration-700 ease-in-out z-50 flex flex-col shadow-2xl
        ${isSidebarOpen ? 'w-80' : 'w-0 lg:w-80'} overflow-hidden`}>
        <div className="p-12 flex items-center justify-between">
          <div className="flex items-center space-x-4 group cursor-pointer">
            <ArogyaLogo className="w-14 h-14 group-hover:rotate-12 transition-transform" color="#4ade80" />
            <div>
               <div className="font-black text-3xl tracking-tighter text-white">AS.</div>
               <div className="text-[8px] font-black text-slate-500 tracking-[0.4em] uppercase">Rural Intelligence</div>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-4 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-2xl">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 space-y-4 px-8 mt-12 font-black uppercase tracking-[0.2em] text-[10px]">
          <button onClick={() => { setActiveView('DASH'); setSelectedCaseId(null); }} className={`w-full flex items-center p-6 rounded-[2rem] transition-all duration-300 ${activeView === 'DASH' ? 'bg-blue-600 text-white shadow-2xl' : 'hover:bg-white/5 text-slate-500'}`}><Home className="mr-6 w-6 h-6" /><span>Home Portal</span></button>
          <button onClick={() => setActiveView('MAP')} className={`w-full flex items-center p-6 rounded-[2rem] transition-all duration-300 ${activeView === 'MAP' ? 'bg-red-600 text-white shadow-2xl' : 'hover:bg-white/5 text-slate-500'}`}><MapIcon className="mr-6 w-6 h-6" /><span>Disease Monitoring</span></button>
          <button onClick={() => setActiveView('STOCK')} className={`w-full flex items-center p-6 rounded-[2rem] transition-all duration-300 ${activeView === 'STOCK' ? 'bg-orange-600 text-white shadow-2xl' : 'hover:bg-white/5 text-slate-500'}`}><Package className="mr-6 w-6 h-6" /><span>Supply Chain</span></button>
          <button className="w-full flex items-center p-6 rounded-[2rem] hover:bg-white/5 text-slate-500 transition-all duration-300"><BarChart3 className="mr-6 w-6 h-6" /><span>Health Analytics</span></button>
        </div>
        
        <div className="p-12 mt-auto border-t border-white/5 bg-black/20">
          <button onClick={onExit} className="w-full text-left p-6 text-slate-600 hover:text-red-400 transition-colors text-[10px] font-black uppercase tracking-[0.3em] flex items-center group">
             <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mr-6 group-hover:bg-red-500/10 group-hover:text-red-400 transition-all"><ArrowRight className="w-5 h-5 rotate-180" /></div>
             Sign Out
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col min-w-0 lg:ml-80 transition-all duration-700 ease-in-out">
        <header className="h-28 bg-white/80 backdrop-blur-3xl border-b border-slate-100 flex items-center justify-between px-10 lg:px-16 sticky top-0 z-40">
          <div className="flex items-center">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="mr-8 lg:hidden p-4 text-slate-600 hover:bg-slate-50 rounded-2xl transition-all shadow-sm">
                <Menu size={28} />
              </button>
            )}
            {activeView !== 'DASH' && (
              <button onClick={() => { setActiveView('DASH'); setSelectedCaseId(null); }} className="mr-8 p-4 text-slate-400 hover:text-slate-900 bg-slate-50 rounded-2xl transition-all active:scale-90 shadow-sm border border-slate-100">
                <ArrowLeft size={28} />
              </button>
            )}
            <div>
              <h1 className="font-black text-3xl lg:text-4xl text-slate-900 tracking-tighter leading-none">
                {activeView === 'CASE' ? 'Patient Review' : activeView === 'MAP' ? 'Disease Heatmap' : activeView === 'STOCK' ? 'PHC Inventory' : 'Arogya Swarm Doctor'}
              </h1>
              <div className="flex items-center mt-3 ml-0.5 space-x-3">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live System Status: Normal</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <button className="relative p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
              <Bell size={24} />
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-black text-slate-900 leading-none">Dr. Sharma</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">District Hospital</p>
            </div>
            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black shadow-xl">DS</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {activeView === 'DASH' && renderDashboard()}
          {activeView === 'CASE' && renderCaseDetail()}
          {(activeView === 'MAP' || activeView === 'STOCK') && (
            <div className="p-20 text-center space-y-6">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                {activeView === 'MAP' ? <MapIcon size={48} /> : <Package size={48} />}
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">{activeView === 'MAP' ? 'Disease Heatmap' : 'PHC Inventory'}</h3>
                <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-xs">Module under maintenance / development</p>
              </div>
              <Button onClick={() => setActiveView('DASH')} variant="secondary" className="w-auto px-10 rounded-full">Return to Dashboard</Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DoctorApp;
