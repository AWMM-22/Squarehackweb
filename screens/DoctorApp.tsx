
import React, { useState } from 'react';
import { Header, Card, Button } from '../components/UI';
import { 
  BarChart3, Users, PhoneCall, FileText, 
  Search, Bell, Activity, ArrowRight,
  TrendingUp, AlertCircle, Trash2, Plus, Home, Menu, X, Play, Camera, Clipboard,
  MapPin, ArrowLeft, Package, Map as MapIcon, Stethoscope
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
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex items-center justify-between mb-8">
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl">
             {/* Fix: Added Stethoscope to lucide-react imports */}
             <Stethoscope size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Welcome, Dr. Sharma</h2>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mt-1">District Hospital • PHC Rampur</p>
          </div>
        </div>
        <div className="hidden md:flex space-x-4">
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Shift</p>
              <p className="font-bold text-slate-800">08:00 AM - 04:00 PM</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-blue-500 transition-all">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">In Queue</p>
              <p className="text-3xl font-black text-slate-900 mt-1">12</p>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-green-500 transition-all">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Completed</p>
              <p className="text-3xl font-black text-green-600 mt-1">8</p>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-red-500 transition-all">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Urgent</p>
              <p className="text-3xl font-black text-red-600 mt-1">3</p>
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-black flex items-center text-slate-900 tracking-tight px-2">
              <AlertCircle className="w-5 h-5 mr-2 text-red-600" /> Current Queue
            </h2>
            <div className="space-y-3">
              {mockQueue.map(item => (
                <Card key={item.id} borderColor={item.risk === RiskLevel.HIGH ? '#D32F2F' : '#F57C00'} className="p-6 border-none shadow-sm hover:shadow-xl cursor-pointer transition-all active:scale-[0.99] rounded-[2rem] bg-white group">
                  <div className="flex justify-between items-center" onClick={() => handleSelectCase(item.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-black text-lg text-slate-800">{item.name}, {item.age}F</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.risk === RiskLevel.HIGH ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>{item.risk} RISK</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1 truncate font-medium">{item.symptom}</p>
                      <div className="flex items-center mt-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Users className="w-3.5 h-3.5 mr-1.5" /> ASHA: {item.asha}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <PhoneCall size={20} />
                      </button>
                      <button className="hidden sm:block p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:text-slate-900 transition-all">
                        <ArrowRight size={20} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl space-y-6 relative overflow-hidden">
             <div className="absolute -top-10 -right-10 opacity-5">
               <TrendingUp size={200} />
             </div>
             <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-xl tracking-tight flex items-center"><TrendingUp className="mr-3 text-red-400" /> Monitoring</h3>
                  <span className="bg-slate-800 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">Live</span>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-inner">
                    <p className="text-red-400 font-black text-3xl tracking-tighter">↑ 40% Spike</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gastroenteritis (Ward 3)</p>
                </div>
                <button onClick={() => setActiveView('MAP')} className="w-full bg-white text-slate-900 py-4 rounded-2xl text-sm font-black shadow-lg hover:bg-slate-100 transition-all uppercase tracking-widest">Open Map Analysis</button>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-slate-900 flex items-center uppercase tracking-widest text-xs"><Package className="mr-2 text-orange-500" /> PHC Stock</h3>
                <button onClick={() => setActiveView('STOCK')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Inventory</button>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-600">ORS Packets</span>
                  <span className="text-xs font-black text-red-600 bg-red-50 px-2 py-0.5 rounded uppercase">CRITICAL: 15</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-600">PCM 500mg</span>
                  <span className="text-xs font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded uppercase">LOW: 45</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMap = () => (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center">
          <MapIcon className="mr-3 text-red-600" /> Disease Heatmap
        </h2>
        <div className="flex gap-2">
          <button className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest">WARD VIEW</button>
          <button className="bg-white border-2 border-slate-100 text-slate-600 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest">VILLAGE VIEW</button>
        </div>
      </div>
      
      <div className="bg-slate-200 aspect-[16/9] lg:aspect-[21/9] rounded-[3.5rem] shadow-inner relative overflow-hidden flex items-center justify-center border-4 border-white">
        <div className="absolute inset-0 bg-[url('https://api.placeholder.com/1200/600')] bg-cover opacity-20 grayscale" />
        <div className="relative w-full h-full">
           <div className="absolute top-1/4 left-1/3 w-20 h-20 bg-red-500/30 rounded-full animate-ping" />
           <div className="absolute top-1/4 left-1/3 w-8 h-8 bg-red-600 rounded-full border-4 border-white shadow-xl" />
           <div className="absolute bottom-1/3 right-1/4 w-12 h-12 bg-orange-500/30 rounded-full animate-pulse" />
           <div className="absolute bottom-1/3 right-1/4 w-6 h-6 bg-orange-500 rounded-full border-2 border-white" />
        </div>
        
        <div className="absolute bottom-10 right-10 bg-white p-8 rounded-[2rem] shadow-2xl border border-slate-100 max-w-xs space-y-4">
           <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Concentration Legend</h4>
           <div className="space-y-3">
             <div className="flex items-center space-x-3 text-xs font-bold text-slate-600"><div className="w-3 h-3 bg-red-600 rounded-full" /> <span>High (15+ cases)</span></div>
             <div className="flex items-center space-x-3 text-xs font-bold text-slate-600"><div className="w-3 h-3 bg-orange-500 rounded-full" /> <span>Moderate (5-14 cases)</span></div>
             <div className="flex items-center space-x-3 text-xs font-bold text-slate-600"><div className="w-3 h-3 bg-green-500 rounded-full" /> <span>Low (1-4 cases)</span></div>
           </div>
        </div>
      </div>

      <Card className="p-10 rounded-[2.5rem] shadow-sm border-none bg-white">
        <h3 className="font-black text-xl mb-6 text-slate-900">Recommended Intervention</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-4 p-5 bg-red-50 rounded-2xl">
            <span className="bg-red-600 text-white w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-1">1</span>
            <p className="font-bold text-slate-800">Immediately deploy additional ORS and Zinc batches to Ward 3 ASHA teams.</p>
          </div>
          <div className="flex items-start space-x-4 p-5 bg-blue-50 rounded-2xl">
            <span className="bg-blue-600 text-white w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-1">2</span>
            <p className="font-bold text-slate-800">Initiate mandatory water source chlorination testing in Rampur Village North sector.</p>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderStockDashboard = () => (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">PHC Inventory Control</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Medical Supply Chain Tracking</p>
        </div>
        <Button variant="info" icon={Plus} className="w-auto px-8 rounded-full py-3.5 shadow-blue-200 shadow-xl">ADD STOCK</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Critical', count: 3, color: 'bg-red-50 text-red-600 border-red-100' },
          { title: 'Low Stock', count: 8, color: 'bg-orange-50 text-orange-600 border-orange-100' },
          { title: 'Near Expiry', count: 12, color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
          { title: 'In Stock', count: 156, color: 'bg-green-50 text-green-600 border-green-100' }
        ].map(stat => (
          <div key={stat.title} className={`${stat.color} p-8 rounded-[2rem] border-2 flex flex-col justify-between shadow-sm hover:shadow-md transition-all`}>
             <span className="font-black uppercase tracking-widest text-[10px] opacity-70">{stat.title}</span>
             <span className="text-4xl font-black mt-2">{stat.count}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b">
            <tr>
              <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Medicine & Strength</th>
              <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Stock Status</th>
              <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Expiry</th>
              <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {[
              { name: 'ORS Packets (75g)', stock: 15, total: 200, exp: '12/2026', status: 'CRITICAL' },
              { name: 'Paracetamol 500mg', stock: 45, total: 500, exp: '10/2026', status: 'LOW' },
              { name: 'Amoxicillin 250mg', stock: 120, total: 150, exp: '05/2026', status: 'OK' },
              { name: 'Iron & Folic Acid', stock: 400, total: 1000, exp: '08/2026', status: 'OK' }
            ].map(med => (
              <tr key={med.name} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-8 font-black text-slate-800">{med.name}</td>
                <td className="p-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div className={`h-full ${med.status === 'CRITICAL' ? 'bg-red-500' : med.status === 'LOW' ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${(med.stock/med.total)*100}%` }} />
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${med.status === 'CRITICAL' ? 'text-red-600 bg-red-50' : med.status === 'LOW' ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50'}`}>{med.stock}/{med.total}</span>
                  </div>
                </td>
                <td className="p-8 font-bold text-slate-500 text-sm tracking-widest">{med.exp}</td>
                <td className="p-8">
                  <button className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">REORDER</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCaseDetail = () => (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-right-10 duration-500 pb-20">
      <div className="space-y-8">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white font-black text-4xl shadow-2xl shadow-blue-200">SD</div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Sita Devi, 28F</h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2 flex items-center">
              <MapPin className="w-4 h-4 mr-2" /> Rampur • Ward 3 • Case #1024
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="text-center p-6 bg-red-50 rounded-[2rem] border border-red-100 shadow-sm">
            <p className="text-[10px] text-red-600 font-black uppercase tracking-[0.2em] mb-1">Temp</p>
            <p className="text-3xl font-black text-slate-900">101°F</p>
          </div>
          <div className="text-center p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Blood Pressure</p>
            <p className="text-2xl font-black text-slate-900">120/80</p>
          </div>
          <div className="text-center p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Heart Rate</p>
            <p className="text-3xl font-black text-slate-900">88</p>
          </div>
        </div>

        <Card className="p-10 bg-slate-50 border-none rounded-[3rem] shadow-inner space-y-6">
          <div className="flex items-center space-x-4 text-slate-900">
             <div className="p-3 bg-white rounded-2xl shadow-sm"><Activity size={28} className="text-blue-600" /></div>
             <h3 className="font-black text-2xl tracking-tight leading-none">AI Health Scan</h3>
          </div>
          <p className="text-slate-800 font-black text-3xl leading-tight tracking-tighter">"Likely Upper Respiratory Infection (URI)"</p>
          <div className="space-y-2">
            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
               <div className="h-full bg-blue-600 w-[78%] shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confidence Score</span>
              <span className="text-xs font-black text-blue-600">78% ACCURACY</span>
            </div>
          </div>
        </Card>

        <section className="space-y-4">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Diagnostic Evidence</h4>
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
              <div className="flex items-start space-x-5">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shrink-0 shadow-inner"><Clipboard size={24} /></div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ASHA Field Note</p>
                   <p className="text-lg font-bold text-slate-800 leading-snug">"Persistent cough for 3 days. High fever reported at night. No breathing difficulty observed."</p>
                </div>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-3xl flex items-center justify-between border border-slate-100">
                <div className="flex items-center space-x-4">
                   <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all"><Play size={20} fill="white" /></div>
                   <div><p className="text-sm font-black text-slate-900">Patient Symptom Recording</p><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Recorded via ASHA Mic</p></div>
                </div>
                <button className="text-blue-600 font-black text-xs uppercase tracking-widest border-2 border-blue-100 px-5 py-2.5 rounded-2xl hover:bg-white transition-all">LISTEN</button>
              </div>
           </div>
        </section>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl space-y-12 sticky top-32">
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-8">
              <h3 className="text-3xl font-black tracking-tight leading-none">Intervention</h3>
              <div className="bg-slate-800 px-4 py-2 rounded-full flex items-center space-x-2">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Case</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Button variant="info" className="py-8 rounded-[2.5rem] shadow-2xl shadow-blue-500/10 active:scale-95" icon={PhoneCall}>VIDEO CONSULT</Button>
              <Button variant="secondary" className="bg-slate-800 text-white border-none py-8 rounded-[2.5rem] hover:bg-slate-700 active:scale-95 shadow-xl shadow-black/10">VOICE ONLY</Button>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Quick Prescription</span>
                <button className="text-blue-400 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors flex items-center"><Plus size={14} className="mr-1" /> Add Medicine</button>
              </div>
              <div className="bg-slate-800/50 p-8 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-slate-700 space-y-3">
                <FileText className="text-slate-700" size={40} />
                <p className="text-slate-500 font-black text-xs uppercase tracking-widest">No medications drafted</p>
              </div>
            </div>

            <div className="pt-6">
              <button className="w-full bg-green-600 text-white py-6 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-green-500/20 active:scale-95 hover:bg-green-500 transition-all uppercase tracking-tighter">FINALIZE & SIGN RX</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-x-hidden selection:bg-blue-100">
      <nav className={`fixed inset-y-0 left-0 bg-slate-900 text-white transition-all duration-500 z-50 flex flex-col shadow-2xl
        ${isSidebarOpen ? 'w-72' : 'w-0 lg:w-72'} overflow-hidden`}>
        <div className="p-10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ArogyaLogo className="w-12 h-12" color="#4ade80" />
            <div className="font-black text-3xl tracking-tighter text-white">AS.</div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-3 text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 space-y-4 px-6 mt-10 font-black uppercase tracking-widest text-[10px]">
          <button onClick={() => { setActiveView('DASH'); setSelectedCaseId(null); }} className={`w-full flex items-center p-5 rounded-3xl transition-all ${activeView === 'DASH' ? 'bg-blue-600 text-white shadow-xl' : 'hover:bg-slate-800 text-slate-500'}`}><Home className="mr-5 w-5 h-5" /><span>Dashboard</span></button>
          <button onClick={() => setActiveView('MAP')} className={`w-full flex items-center p-5 rounded-3xl transition-all ${activeView === 'MAP' ? 'bg-red-600 text-white shadow-xl' : 'hover:bg-slate-800 text-slate-500'}`}><MapIcon className="mr-5 w-5 h-5" /><span>Outbreak Heatmap</span></button>
          <button onClick={() => setActiveView('STOCK')} className={`w-full flex items-center p-5 rounded-3xl transition-all ${activeView === 'STOCK' ? 'bg-orange-600 text-white shadow-xl' : 'hover:bg-slate-800 text-slate-500'}`}><Package className="mr-5 w-5 h-5" /><span>PHC Inventory</span></button>
        </div>
        
        <div className="p-10 mt-auto border-t border-slate-800/50">
          <button onClick={onExit} className="w-full text-left p-4 text-slate-500 hover:text-red-400 transition-colors text-[10px] font-black uppercase tracking-[0.2em] flex items-center">
             <ArrowRight className="w-5 h-5 mr-5 rotate-180" /> Logout Portal
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col min-w-0 lg:ml-72 transition-all duration-500">
        <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-40">
          <div className="flex items-center">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="mr-6 lg:hidden p-3 text-slate-600 hover:bg-slate-100 rounded-2xl transition-all">
                <Menu size={24} />
              </button>
            )}
            {activeView !== 'DASH' && (
              <button onClick={() => { setActiveView('DASH'); setSelectedCaseId(null); }} className="mr-6 p-3 text-slate-400 hover:text-slate-900 bg-slate-50 rounded-2xl transition-all active:scale-90">
                <ArrowLeft size={24} />
              </button>
            )}
            <div>
              <h1 className="font-black text-2xl lg:text-3xl text-slate-900 tracking-tighter leading-none">
                {activeView === 'CASE' ? 'Patient Consultation' : activeView === 'MAP' ? 'Surveillance Heatmap' : activeView === 'STOCK' ? 'Inventory Control' : 'Arogya Swarm Doctor'}
              </h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2 ml-0.5">District West Primary Health Center</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 lg:space-x-6">
            <div className="hidden md:flex relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-all" />
              <input type="text" placeholder="Patient search..." className="bg-slate-100 border-2 border-transparent focus:border-blue-500/20 focus:bg-white pl-14 pr-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest w-64 lg:w-80 outline-none transition-all" />
            </div>
            <button className="relative p-4 bg-slate-50 rounded-2xl text-slate-600 hover:bg-slate-100 transition-all active:scale-95">
              <Bell size={20} />
              <span className="absolute top-3.5 right-3.5 w-3 h-3 bg-red-500 border-4 border-white rounded-full"></span>
            </button>
          </div>
        </header>

        <main className="flex-1">
          {activeView === 'DASH' && renderDashboard()}
          {activeView === 'CASE' && renderCaseDetail()}
          {activeView === 'MAP' && renderMap()}
          {activeView === 'STOCK' && renderStockDashboard()}
        </main>
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
};

export default DoctorApp;
