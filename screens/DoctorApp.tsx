
import React, { useState, useEffect } from 'react';
import { Header, Card, Button } from '../components/UI';
import { 
  Users, Stethoscope, Bell, ArrowRight,
  MessageSquare, Send, Volume2, User, X, CheckCircle2, Clock, Activity, Calendar,
  Loader2, Home, FileText
} from 'lucide-react';
import { subscribeToInquiries, respondToInquiry, DoctorInquiry } from '../services/dataService';

const DoctorApp: React.FC<{ onExit: () => void; user: any; lang: 'hi' | 'en' }> = ({ onExit, user, lang }) => {
  const [activeTab, setActiveTab] = useState<'HOME' | 'INQUIRIES' | 'DETAIL'>('HOME');
  const [inquiries, setInquiries] = useState<DoctorInquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<DoctorInquiry | null>(null);
  const [responseMsg, setResponseMsg] = useState('');
  const [prescriptionMsg, setPrescriptionMsg] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const unsub = subscribeToInquiries(setInquiries);
    return unsub;
  }, []);

  const handleRespond = async () => {
    if (!selectedInquiry || (!responseMsg && !prescriptionMsg)) return;
    setIsSending(true);
    await respondToInquiry(selectedInquiry.id, responseMsg, prescriptionMsg, user.name);
    setResponseMsg('');
    setPrescriptionMsg('');
    setIsSending(false);
    setSelectedInquiry(null);
    setActiveTab('HOME');
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
       window.speechSynthesis.cancel();
       const utterance = new SpeechSynthesisUtterance(text);
       utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
       window.speechSynthesis.speak(utterance);
    }
  };

  const pendingCount = inquiries.filter(i => i.status === 'PENDING').length;

  const renderHome = () => (
    <div className="p-4 space-y-6 animate-in fade-in duration-700 pb-24">
      <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black tracking-tight leading-none">Dr. {user?.name?.split(' ')[0] || 'Doctor'}</h2>
            <p className="text-blue-200 font-bold uppercase tracking-widest text-[9px] mt-2">Medical Officer</p>
          </div>
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
            <Stethoscope size={20} />
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
            <p className="text-[9px] font-black uppercase tracking-widest text-blue-200">Consulted</p>
            <div className="flex items-end justify-between mt-1">
              <span className="text-xl font-black">{inquiries.filter(i => i.status === 'RESPONDED').length}</span>
              <CheckCircle2 size={16} className="mb-1 text-blue-300" />
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
            <p className="text-[9px] font-black uppercase tracking-widest text-blue-200">Pending</p>
            <div className="flex items-end justify-between mt-1">
              <span className="text-xl font-black">{pendingCount}</span>
              <Bell size={16} className={`mb-1 ${pendingCount > 0 ? 'text-yellow-400 animate-pulse' : 'text-blue-300'}`} />
            </div>
          </div>
        </div>
      </div>

      {pendingCount > 0 ? (
        <section className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-black text-slate-400 uppercase text-[9px] tracking-widest">Active Patient Cases</h3>
          </div>
          <div className="space-y-2">
            {inquiries.filter(i => i.status === 'PENDING').map(inquiry => (
              <Card 
                key={inquiry.id} 
                borderColor="#1976D2"
                className="p-5 border-none shadow-sm hover:shadow-md transition-all rounded-xl bg-white cursor-pointer group"
              >
                <div className="flex justify-between items-center" onClick={() => { setSelectedInquiry(inquiry); setActiveTab('DETAIL'); }}>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mr-4 text-blue-600">
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 leading-tight">{inquiry.patient_name}</h3>
                      <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1.5">Awaiting Advice</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg text-slate-300 group-hover:text-blue-600 transition-colors">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : (
        <div className="py-20 text-center space-y-4 opacity-40">
           <MessageSquare size={40} className="mx-auto text-slate-300" />
           <p className="font-black text-slate-400 uppercase text-[9px] tracking-widest">Clear Queue</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button className="bg-white border border-slate-100 p-5 rounded-xl flex items-center space-x-3 shadow-sm active:scale-95 transition-all">
          <div className="bg-green-50 p-2.5 rounded-lg text-green-600"><Users size={18} /></div>
          <p className="font-black text-slate-900 text-[10px] uppercase tracking-tighter">Directory</p>
        </button>
        <button className="bg-white border border-slate-100 p-5 rounded-xl flex items-center space-x-3 shadow-sm active:scale-95 transition-all">
          <div className="bg-purple-50 p-2.5 rounded-lg text-purple-600"><Calendar size={18} /></div>
          <p className="font-black text-slate-900 text-[10px] uppercase tracking-tighter">Schedule</p>
        </button>
      </div>
    </div>
  );

  const renderDetail = () => {
    if (!selectedInquiry) return null;
    return (
      <div className="p-4 space-y-4 animate-in fade-in duration-500 pb-24">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
           <div className="flex items-center justify-between border-b border-slate-50 pb-5">
              <div className="flex items-center space-x-4">
                 <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><User size={28} /></div>
                 <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedInquiry.patient_name}</h2>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{selectedInquiry.phone}</p>
                 </div>
              </div>
           </div>

           <div className="space-y-4">
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-3">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Problem Description</p>
                 <p className="text-base font-bold text-slate-800 italic leading-relaxed">"{selectedInquiry.problem_desc}"</p>
                 <button 
                  onClick={() => speakText(selectedInquiry.problem_desc)}
                  className="flex items-center text-blue-600 font-black text-[9px] uppercase tracking-widest hover:bg-blue-100/50 px-2 py-1.5 rounded-lg transition-colors"
                 >
                   <Volume2 size={14} className="mr-2" /> Voice Audio
                 </button>
              </div>

              {selectedInquiry.follow_up_answers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Follow-up Answers</p>
                  {selectedInquiry.follow_up_answers.map((ans, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-sm font-bold text-slate-600 italic">"{ans}"</p>
                    </div>
                  ))}
                </div>
              )}
           </div>

           <div className="space-y-5 pt-4 border-t border-slate-50">
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes / Medical Advice</p>
                <textarea 
                  placeholder="Type advice or notes here..." 
                  className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  rows={3}
                  value={responseMsg}
                  onChange={e => setResponseMsg(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Prescription / Medication Details</p>
                <textarea 
                  placeholder="Medicine, Dosage, Duration..." 
                  className="w-full bg-blue-50/30 p-4 rounded-xl border border-blue-100 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20 resize-none text-blue-900"
                  rows={3}
                  value={prescriptionMsg}
                  onChange={e => setPrescriptionMsg(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                 <Button onClick={handleRespond} variant="info" className="py-3.5 rounded-xl flex-1 shadow-md shadow-blue-50 text-sm" disabled={(!responseMsg && !prescriptionMsg) || isSending}>
                    {isSending ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} className="mr-2" /> Send Response</>}
                 </Button>
                 <button 
                  onClick={() => speakText(responseMsg + ". Prescription: " + prescriptionMsg)}
                  className="bg-slate-100 text-slate-400 p-3.5 rounded-xl hover:bg-blue-100 hover:text-blue-600 transition-all active:scale-95"
                  disabled={!responseMsg && !prescriptionMsg}
                 >
                   <Volume2 size={20} />
                 </button>
              </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen shadow-2xl overflow-x-hidden border-x border-slate-100 font-sans">
      <Header 
        title={activeTab === 'HOME' ? 'Doctor View' : activeTab === 'DETAIL' ? 'Case Review' : 'Inquiries'} 
        subtitle="Rampur District"
        onBack={activeTab !== 'HOME' ? () => setActiveTab('HOME') : onExit}
        rightElement={
          <div className="w-9 h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black shadow-md text-sm">
            {user?.name ? user.name[0] : 'D'}
          </div>
        }
      />

      <main>
        {activeTab === 'HOME' && renderHome()}
        {activeTab === 'DETAIL' && renderDetail()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-10 py-5 flex justify-between items-center max-w-md mx-auto z-[60] rounded-t-3xl shadow-lg">
        <button onClick={() => setActiveTab('HOME')} className={`flex flex-col items-center transition-all ${activeTab === 'HOME' ? 'text-blue-700' : 'text-slate-300'}`}>
          <Home size={22} strokeWidth={activeTab === 'HOME' ? 3 : 2} />
          <span className="text-[8px] mt-1.5 font-black uppercase tracking-widest">Home</span>
        </button>
        <button className="flex flex-col items-center text-slate-300 group transition-all">
          <Users size={22} />
          <span className="text-[8px] mt-1.5 font-black uppercase tracking-widest">Patients</span>
        </button>
        <button onClick={onExit} className="flex flex-col items-center text-slate-400 group active:scale-90 transition-all">
          <X size={22} strokeWidth={3} />
          <span className="text-[8px] mt-1.5 font-black uppercase tracking-widest">Exit</span>
        </button>
      </nav>
    </div>
  );
};

export default DoctorApp;
