
import React, { useState, useEffect } from 'react';
import { Header, Card, Button } from '../components/UI';
// Fixed: Added missing Loader2 and Home imports from lucide-react
import { 
  Users, Stethoscope, Bell, ArrowRight,
  MessageSquare, Send, Volume2, User, X, CheckCircle2, Clock, Activity, Calendar,
  Loader2, Home
} from 'lucide-react';
import { subscribeToInquiries, respondToInquiry, DoctorInquiry } from '../services/dataService';

const DoctorApp: React.FC<{ onExit: () => void; user: any; lang: 'hi' | 'en' }> = ({ onExit, user, lang }) => {
  const [activeTab, setActiveTab] = useState<'HOME' | 'INQUIRIES' | 'DETAIL'>('HOME');
  const [inquiries, setInquiries] = useState<DoctorInquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<DoctorInquiry | null>(null);
  const [responseMsg, setResponseMsg] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const unsub = subscribeToInquiries(setInquiries);
    return unsub;
  }, []);

  const handleRespond = async () => {
    if (!selectedInquiry || !responseMsg) return;
    setIsSending(true);
    await respondToInquiry(selectedInquiry.id, responseMsg, user.name);
    setResponseMsg('');
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
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24">
      {/* Doctor Profile Header */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-black tracking-tight leading-none">Dr. {user?.name?.split(' ')[0] || 'Sharma'}</h2>
            <p className="text-blue-200 font-bold uppercase tracking-widest text-[10px] mt-2">District General Hospital</p>
          </div>
          <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-md">
            <Stethoscope className="w-5 h-5" />
          </div>
        </div>
        
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">Consults Today</p>
            <div className="flex items-end justify-between mt-1">
              <span className="text-2xl font-black">{inquiries.filter(i => i.status === 'RESPONDED').length}</span>
              <Activity className="w-4 h-4 mb-1 text-blue-300" />
            </div>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">Pending</p>
            <div className="flex items-end justify-between mt-1">
              <span className="text-2xl font-black">{pendingCount}</span>
              <Bell className={`w-4 h-4 mb-1 ${pendingCount > 0 ? 'text-yellow-400 animate-pulse' : 'text-blue-300'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Direct Consult Notifications */}
      {pendingCount > 0 ? (
        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-widest">New Patient Cases</h3>
          </div>
          <div className="space-y-3">
            {inquiries.filter(i => i.status === 'PENDING').map(inquiry => (
              <Card 
                key={inquiry.id} 
                borderColor="#1976D2"
                className="p-6 border-none shadow-md hover:shadow-xl transition-all rounded-[2.5rem] bg-white cursor-pointer group"
              >
                <div className="flex justify-between items-center" onClick={() => { setSelectedInquiry(inquiry); setActiveTab('DETAIL'); }}>
                  <div className="flex items-center">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mr-4 shadow-inner text-blue-600">
                      <User size={28} />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-slate-900 leading-tight">{inquiry.patient_name}</h3>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Direct Consultation</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl text-slate-300 group-hover:text-blue-600 transition-colors">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : (
        <div className="py-20 text-center space-y-4 opacity-40">
           <MessageSquare size={48} className="mx-auto text-slate-300" />
           <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest">No New Inquiries</p>
        </div>
      )}

      {/* General Stats/Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button className="bg-white border border-slate-100 p-6 rounded-[2rem] flex items-center space-x-4 shadow-sm active:scale-95 transition-all">
          <div className="bg-green-50 p-3 rounded-xl text-green-600"><Users size={20} /></div>
          <div className="text-left">
            <p className="font-black text-slate-900 text-xs uppercase tracking-tighter">My Patients</p>
          </div>
        </button>
        <button className="bg-white border border-slate-100 p-6 rounded-[2rem] flex items-center space-x-4 shadow-sm active:scale-95 transition-all">
          <div className="bg-purple-50 p-3 rounded-xl text-purple-600"><Calendar size={20} /></div>
          <div className="text-left">
            <p className="font-black text-slate-900 text-xs uppercase tracking-tighter">Schedule</p>
          </div>
        </button>
      </div>
    </div>
  );

  const renderDetail = () => {
    if (!selectedInquiry) return null;
    return (
      <div className="p-4 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-24">
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-50 space-y-8">
           <div className="flex items-center justify-between border-b border-slate-50 pb-6">
              <div className="flex items-center space-x-4">
                 <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><User size={32} /></div>
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedInquiry.patient_name}</h2>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{selectedInquiry.phone}</p>
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Patient Problem (Voice Transcript)</p>
                 <p className="text-lg font-bold text-slate-800 italic leading-relaxed">"{selectedInquiry.problem_desc}"</p>
                 <button 
                  onClick={() => speakText(selectedInquiry.problem_desc)}
                  className="flex items-center text-blue-600 font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                 >
                   <Volume2 size={16} className="mr-2" /> Play Voice Input
                 </button>
              </div>

              {selectedInquiry.follow_up_answers.map((ans, idx) => (
                 <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Answer {idx + 1}</p>
                    <p className="text-base font-bold text-slate-700 italic">"{ans}"</p>
                 </div>
              ))}
           </div>

           <div className="space-y-4 pt-4 border-t border-slate-50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Your Recommendation</p>
              <textarea 
                 placeholder="Type your advice here..." 
                 className="w-full bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 font-bold text-base outline-none focus:ring-4 focus:ring-blue-500/10 resize-none"
                 rows={4}
                 value={responseMsg}
                 onChange={e => setResponseMsg(e.target.value)}
              />
              <div className="flex gap-3">
                 <Button onClick={handleRespond} variant="info" className="py-4 rounded-2xl flex-1 shadow-lg shadow-blue-100" disabled={!responseMsg || isSending}>
                    {isSending ? <Loader2 className="animate-spin" /> : <><Send size={18} className="mr-3" /> Send Response</>}
                 </Button>
                 <button 
                  onClick={() => speakText(responseMsg)}
                  className="bg-slate-100 text-slate-400 p-4 rounded-2xl hover:bg-blue-100 hover:text-blue-600 transition-all"
                  disabled={!responseMsg}
                 >
                   <Volume2 size={24} />
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
        title={activeTab === 'HOME' ? 'Doctor Portal' : activeTab === 'DETAIL' ? 'Review Inquiry' : 'Patient Inquiries'} 
        subtitle="Rampur Health Post"
        onBack={activeTab !== 'HOME' ? () => setActiveTab('HOME') : onExit}
        rightElement={
          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black shadow-lg">
            {user?.name ? user.name[0] : 'D'}
          </div>
        }
      />

      <main>
        {activeTab === 'HOME' && renderHome()}
        {activeTab === 'DETAIL' && renderDetail()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-slate-100 px-12 py-8 flex justify-between items-center max-w-md mx-auto z-[60] rounded-t-[4rem] shadow-lg">
        <button onClick={() => setActiveTab('HOME')} className={`flex flex-col items-center transition-all ${activeTab === 'HOME' ? 'text-blue-700 scale-110' : 'text-slate-300'}`}>
          <Home size={24} strokeWidth={activeTab === 'HOME' ? 3 : 2} />
          <span className="text-[9px] mt-2 font-black uppercase tracking-widest">Home</span>
        </button>
        <button className="flex flex-col items-center text-slate-300 group transition-all">
          <Users size={24} />
          <span className="text-[9px] mt-2 font-black uppercase tracking-widest">Patients</span>
        </button>
        <button onClick={onExit} className="flex flex-col items-center text-slate-400 group active:scale-90 transition-all">
          <X size={24} />
          <span className="text-[9px] mt-2 font-black uppercase tracking-widest">Exit</span>
        </button>
      </nav>
    </div>
  );
};

export default DoctorApp;
