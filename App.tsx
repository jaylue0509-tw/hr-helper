import React, { useState } from 'react';
import { Person, AppMode } from './types';
import { InputSection } from './components/InputSection';
import { LuckyDraw } from './components/LuckyDraw';
import { GroupVisualizer } from './components/GroupVisualizer';
import { AttendanceSection } from './components/AttendanceSection';
import { PublicCheckIn } from './components/PublicCheckIn';
import { syncCheckInToBackend } from './backend';
import { Database, Zap, Users, Gift, QrCode, Lock, Unlock } from 'lucide-react';

const App: React.FC = () => {
  const [candidates, setCandidates] = useState<Person[]>([]);
  const [mode, setMode] = useState<AppMode>(AppMode.INPUT);
  const [isAdmin, setIsAdmin] = useState(false);

  const toggleAdmin = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      const pw = prompt("請輸入管理者密碼：");
      if (pw === '0509') {
        setIsAdmin(true);
      } else if (pw !== null) {
        alert("密碼錯誤！");
      }
    }
  };

  // Check for public check-in mode
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isPublicCheckIn = searchParams?.get('mode') === 'checkin';
  const publicRegion = searchParams?.get('region') || '北區';

  const handleDataLoaded = (data: Person[]) => {
    setCandidates(data);
  };

  const handleCheckIn = (name: string, region: string) => {
    setCandidates(prev => {
      const updated = prev.map(p =>
        p.name.trim() === name.trim()
          ? { ...p, attended: true, checkInTime: Date.now(), region }
          : p
      );

      // Find the updated person and sync to "backend"
      const person = updated.find(p => p.name.trim() === name.trim());
      if (person) syncCheckInToBackend(person);

      return updated;
    });
  };

  // Liquid Background Component
  const LiquidBackground = () => (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
    </div>
  );

  if (isPublicCheckIn) {
    return <PublicCheckIn region={publicRegion} onCheckIn={handleCheckIn} candidates={candidates} />;
  }

  return (
    <div className="min-h-screen font-sans flex flex-col relative">
      <LiquidBackground />

      {/* Header with Blur Effect */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b-0 m-4 rounded-2xl mx-4 md:mx-8">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#1D1D1F] to-[#434344] rounded-xl flex items-center justify-center text-white shadow-lg">
              <Gift size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#1D1D1F]">Pure<span className="text-blue-600">HR</span></h1>
          </div>

          {/* Desktop Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleAdmin}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${isAdmin ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-50 text-gray-400 border border-gray-100 hover:bg-gray-100 hover:text-gray-600'}`}
            >
              {isAdmin ? <Unlock size={14} /> : <Lock size={14} />}
              {isAdmin ? "管理者模式" : "解鎖管理員"}
            </button>
            <nav className="hidden md:flex items-center bg-white/40 backdrop-blur-md p-1.5 rounded-xl border border-white/50 shadow-inner">
              <NavSegment
                active={mode === AppMode.INPUT}
                onClick={() => setMode(AppMode.INPUT)}
                label="名單管理"
              />
              <NavSegment
                active={mode === AppMode.DRAW}
                onClick={() => setMode(AppMode.DRAW)}
                disabled={candidates.length === 0}
                label="幸運抽獎"
              />
              <NavSegment
                active={mode === AppMode.ATTENDANCE}
                onClick={() => setMode(AppMode.ATTENDANCE)}
                disabled={candidates.length === 0}
                label="點名簽到(活動簽到)"
              />
              <NavSegment
                active={mode === AppMode.GROUP}
                onClick={() => setMode(AppMode.GROUP)}
                disabled={candidates.length === 0}
                label="自動分組"
              />
            </nav>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-24"></div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        <div className="h-full">
          {mode === AppMode.INPUT && (
            <div className="animate-fade-in h-full">
              <InputSection
                onDataLoaded={handleDataLoaded}
                currentCount={candidates.length}
                initialCandidates={candidates}
                isAdmin={isAdmin}
              />
            </div>
          )}

          {mode === AppMode.DRAW && (
            <div className="animate-fade-in h-full">
              <LuckyDraw candidates={candidates} />
            </div>
          )}

          {mode === AppMode.GROUP && (
            <div className="animate-fade-in h-full">
              <GroupVisualizer candidates={candidates} />
            </div>
          )}

          {mode === AppMode.ATTENDANCE && (
            <div className="animate-fade-in h-full">
              <AttendanceSection candidates={candidates} onCheckIn={handleCheckIn} onDataLoaded={handleDataLoaded} />
            </div>
          )}
        </div>
      </main>

      {/* Mobile Tab Bar */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
        <div className="glass-panel rounded-2xl p-2 flex justify-around shadow-2xl bg-white/80">
          <MobileNavItem
            active={mode === AppMode.INPUT}
            onClick={() => setMode(AppMode.INPUT)}
            icon={<Database size={24} />}
            label="名單"
          />
          <MobileNavItem
            active={mode === AppMode.ATTENDANCE}
            onClick={() => setMode(AppMode.ATTENDANCE)}
            disabled={candidates.length === 0}
            icon={<QrCode size={24} />}
            label="點名簽到(活動簽到)"
          />
          <MobileNavItem
            active={mode === AppMode.DRAW}
            onClick={() => setMode(AppMode.DRAW)}
            disabled={candidates.length === 0}
            icon={<Zap size={24} />}
            label="抽獎"
          />
          <MobileNavItem
            active={mode === AppMode.GROUP}
            onClick={() => setMode(AppMode.GROUP)}
            disabled={candidates.length === 0}
            icon={<Users size={24} />}
            label="分組"
          />
        </div>
      </div>
    </div>
  );
};

const NavSegment: React.FC<{ active: boolean; onClick: () => void; label: string; disabled?: boolean }> = ({
  active, onClick, label, disabled
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      px-5 py-1.5 text-sm font-bold rounded-lg transition-all duration-300
      ${active
        ? 'bg-white shadow-md text-blue-600 scale-105'
        : 'text-gray-500 hover:text-gray-800 hover:bg-white/30'}
      ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
    `}
  >
    {label}
  </button>
);

const MobileNavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; disabled?: boolean }> = ({
  active, onClick, icon, label, disabled
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col items-center gap-1 p-2 w-full rounded-xl transition-all ${active ? 'text-blue-600 bg-blue-50/50' : 'text-gray-400'} ${disabled ? 'opacity-30' : ''}`}
  >
    {icon}
    <span className="text-[12px] font-medium">{label}</span>
  </button>
)

export default App;
