import React, { useState, useEffect, useRef } from 'react';
import { Person, DrawHistoryItem } from '../types';
import { Button, Card } from './ui/SciFiElements';
import { shuffleArray } from '../utils';
import { Trophy, RotateCcw, Play, Square, Sparkles, PartyPopper, Zap, LayoutGrid, Aperture, Code2, Disc, MoveVertical } from 'lucide-react';

interface LuckyDrawProps {
  candidates: Person[];
}

type DrawStyle = 'cyber' | 'slot' | 'matrix' | 'radar' | 'galaxy' | 'pulse';

interface DrawStyleConfig {
  id: DrawStyle;
  name: string;
  icon: React.ReactNode;
  desc: string;
}

const DRAW_STYLES: DrawStyleConfig[] = [
  { id: 'cyber', name: '賽博雜訊', icon: <Zap size={16} />, desc: '經典的高速閃爍與故障風格' },
  { id: 'slot', name: '光速拉霸', icon: <MoveVertical size={16} />, desc: '垂直高速滾動鎖定' },
  { id: 'matrix', name: '矩陣解碼', icon: <Code2 size={16} />, desc: '數位亂碼逐字解密' },
  { id: 'radar', name: '戰術雷達', icon: <LayoutGrid size={16} />, desc: '多目標掃描鎖定' },
  { id: 'galaxy', name: '星際軌道', icon: <Disc size={16} />, desc: '3D 環繞旋轉選擇' },
  { id: 'pulse', name: '量子脈衝', icon: <Aperture size={16} />, desc: '強烈聚焦與心跳節奏' },
];

// Simple Particle Component for visual impact
const Particles = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {[...Array(20)].map((_, i) => (
                <div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-blob"
                    style={{
                        top: '50%',
                        left: '50%',
                        backgroundColor: ['#FFD700', '#FF4500', '#00BFFF', '#32CD32'][i % 4],
                        animation: `flyOut 1s ease-out forwards`,
                        animationDelay: `${Math.random() * 0.1}s`,
                        transform: `rotate(${Math.random() * 360}deg) translate(0, 0)`,
                        // @ts-ignore
                        '--tw-translate-x': `${(Math.random() - 0.5) * 600}px`,
                        // @ts-ignore
                        '--tw-translate-y': `${(Math.random() - 0.5) * 600}px`,
                    }}
                ></div>
            ))}
            <style>{`
                @keyframes flyOut {
                    0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5); }
                    100% { opacity: 0; transform: translate(var(--tw-translate-x), var(--tw-translate-y)) scale(1.5); }
                }
            `}</style>
        </div>
    );
};

export const LuckyDraw: React.FC<LuckyDrawProps> = ({ candidates }) => {
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [currentPool, setCurrentPool] = useState<Person[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [displayPerson, setDisplayPerson] = useState<Person | null>(null);
  const [history, setHistory] = useState<DrawHistoryItem[]>([]);
  const [drawStyle, setDrawStyle] = useState<DrawStyle>('cyber');
  
  // States for specific animations
  const [slotOffset, setSlotOffset] = useState(0);
  const [matrixText, setMatrixText] = useState("");
  const [radarGrid, setRadarGrid] = useState<Person[]>([]);
  const [galaxyRotation, setGalaxyRotation] = useState(0);

  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (currentPool.length === 0 && candidates.length > 0 && history.length === 0) {
        setCurrentPool(shuffleArray(candidates));
    }
  }, [candidates]);

  // Matrix Effect Helper
  const generateMatrixText = (target: string, progress: number) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&*";
    return target.split('').map((char, index) => {
        if (index < target.length * progress) return char;
        return chars[Math.floor(Math.random() * chars.length)];
    }).join('');
  };

  const startDraw = () => {
    if (currentPool.length === 0) return;
    setIsRolling(true);
    setIsWinner(false);
    startTimeRef.current = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      
      // Common: Pick a random candidate for "state" (some styles use this, some use visual tricks)
      const randomIndex = Math.floor(Math.random() * currentPool.length);
      const person = currentPool[randomIndex];
      
      // Style Specific Logic during Rolling
      switch (drawStyle) {
          case 'matrix':
              // Keep text fully scrambled
              setMatrixText(generateMatrixText(person.name, 0)); 
              setDisplayPerson(person);
              break;
          case 'slot':
              // Increase offset continuously
              setSlotOffset(prev => prev + 50); 
              setDisplayPerson(person); // Tracking logic
              break;
          case 'radar':
              // Shuffle grid every 200ms
              if (Math.floor(elapsed / 100) % 2 === 0) {
                 setRadarGrid(shuffleArray(currentPool).slice(0, 9));
              }
              setDisplayPerson(person);
              break;
          case 'galaxy':
              setGalaxyRotation(prev => prev + 10);
              setDisplayPerson(person);
              break;
          default:
              // Cyber & Pulse: Just fast switching
              setDisplayPerson(person);
              break;
      }

      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const stopDraw = () => {
    if (!animationRef.current) return;
    cancelAnimationFrame(animationRef.current);
    
    // Determine Winner
    const winnerIndex = Math.floor(Math.random() * currentPool.length);
    const winner = currentPool[winnerIndex];
    
    setDisplayPerson(winner);
    setIsRolling(false);
    setIsWinner(true);
    
    // Finalize Visuals
    if (drawStyle === 'matrix') setMatrixText(winner.name);
    if (drawStyle === 'slot') setSlotOffset(0); // Reset or snap? Let's snap visually in CSS
    
    setHistory(prev => [{ timestamp: Date.now(), winner }, ...prev]);

    if (!allowDuplicates) {
      setCurrentPool(prev => prev.filter(p => p.id !== winner.id));
    }
  };

  const resetHistory = () => {
    setHistory([]);
    setCurrentPool(shuffleArray(candidates));
    setDisplayPerson(null);
    setIsWinner(false);
    setMatrixText("");
  };

  // --- RENDERERS FOR EACH STYLE ---

  const renderCyber = () => (
    <div className={`transform transition-all duration-300 ${isWinner ? 'scale-110' : ''}`}>
        <h1 className={`
            font-black tracking-tight leading-tight transition-all
            ${isRolling 
                ? 'text-7xl md:text-8xl text-[#1D1D1F] opacity-50 blur-[2px] animate-pulse skew-x-12' 
                : 'text-7xl md:text-9xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 drop-shadow-2xl'
            }
        `}>
            {displayPerson?.name}
        </h1>
    </div>
  );

  const renderSlot = () => (
    <div className="relative h-[200px] w-full overflow-hidden mask-linear-fade">
        {/* We simulate a reel by rendering a long list that moves */}
        <div className={`flex flex-col items-center transition-all duration-[2000ms] ease-out ${isWinner ? 'translate-y-0' : ''}`}
             style={{ transform: isRolling ? `translateY(-${slotOffset % 1000}px)` : 'translateY(0)' }}>
            {isWinner ? (
                <div className="h-[200px] flex items-center justify-center">
                     <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-orange-600 drop-shadow-lg">
                        {displayPerson?.name}
                     </h1>
                </div>
            ) : (
                // Fake list for motion blur effect
                [...Array(20)].map((_, i) => (
                    <div key={i} className="h-[200px] flex items-center justify-center opacity-50 blur-[2px]">
                         <span className="text-6xl font-bold text-gray-400">
                             {currentPool[i % currentPool.length]?.name || "Loading"}
                         </span>
                    </div>
                ))
            )}
        </div>
        {/* Overlay Gradients to simulate glass curve */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-white/80 pointer-events-none z-10"></div>
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-red-500/50 z-20"></div>
    </div>
  );

  const renderMatrix = () => (
    <div className="font-mono text-center">
        <h1 className={`
            font-bold tracking-widest transition-all
            ${isRolling ? 'text-green-500 text-6xl md:text-7xl opacity-80' : 'text-8xl md:text-9xl text-[#1D1D1F]'}
        `}>
            {isRolling ? matrixText : displayPerson?.name}
        </h1>
        {isRolling && <p className="text-green-400/50 mt-4 text-sm animate-pulse">DECRYPTING_TARGET_DATA...</p>}
    </div>
  );

  const renderRadar = () => {
    if (isWinner) return renderCyber(); // Show big name when won
    return (
        <div className="grid grid-cols-3 gap-4 w-[300px] h-[300px] mx-auto relative">
            {/* Radar Sweep Line */}
            <div className="absolute inset-0 rounded-xl border-2 border-green-500/30 overflow-hidden pointer-events-none">
                 <div className="w-full h-1 bg-green-400/50 shadow-[0_0_20px_rgba(74,222,128,0.8)] animate-[scan_2s_linear_infinite]"></div>
            </div>
            {radarGrid.map((p, i) => (
                <div key={i} className={`
                    flex items-center justify-center rounded-lg border border-green-500/20 bg-green-500/5 p-2
                    ${i === 4 ? 'bg-green-500/20 border-green-500 animate-pulse' : ''}
                `}>
                    <span className="text-green-700 font-mono text-sm font-bold truncate">{p?.name}</span>
                </div>
            ))}
            <style>{`@keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(300px); } }`}</style>
        </div>
    );
  };

  const renderGalaxy = () => {
      if (isWinner) return renderCyber();
      return (
          <div className="perspective-[1000px] w-full h-[300px] flex items-center justify-center overflow-hidden">
               <div className="relative w-[200px] h-[200px]" style={{ transformStyle: 'preserve-3d', transform: `rotateY(${galaxyRotation}deg) rotateX(10deg)` }}>
                   {[0, 1, 2, 3, 4, 5].map((i) => (
                       <div key={i} 
                            className="absolute inset-0 flex items-center justify-center bg-white/80 border border-blue-400/30 backdrop-blur-sm rounded-xl shadow-lg"
                            style={{ 
                                transform: `rotateY(${i * 60}deg) translateZ(250px)`,
                                backfaceVisibility: 'visible' 
                            }}>
                           <span className="text-2xl font-bold text-blue-900">
                               {currentPool[(Math.floor(galaxyRotation/60) + i) % currentPool.length]?.name}
                           </span>
                       </div>
                   ))}
               </div>
          </div>
      );
  };

  const renderPulse = () => (
    <div className={`transform transition-all duration-100 ${isRolling ? 'animate-[ping_0.5s_cubic-bezier(0,0,0.2,1)_infinite]' : ''}`}>
         <h1 className={`
            font-black tracking-tight leading-tight
            ${isWinner 
                ? 'text-8xl md:text-9xl text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 drop-shadow-2xl'
                : 'text-7xl md:text-8xl text-gray-800 opacity-80'
            }
        `}>
            {displayPerson?.name}
        </h1>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Left Panel: Settings & History */}
      <div className="lg:col-span-4 flex flex-col gap-6 order-2 lg:order-1">
        <Card title="抽獎設定" className="flex-shrink-0">
          <div className="space-y-6">
             <div className="flex items-center justify-between p-4 bg-white/40 rounded-2xl border border-white/50">
               <span className="text-gray-600 font-medium">抽獎池人數</span>
               <span className="text-2xl font-bold text-[#1D1D1F]">{currentPool.length}</span>
             </div>

             <div className="flex items-center justify-between px-2">
                <div className="flex flex-col">
                    <span className="text-gray-600 font-medium">允許重複中獎</span>
                    <span className={`text-xs mt-0.5 transition-colors duration-300 ${allowDuplicates ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                        {allowDuplicates ? '已開啟：可重複中獎' : '已關閉：中獎後移除'}
                    </span>
                </div>
                <button 
                  onClick={() => setAllowDuplicates(!allowDuplicates)}
                  className={`w-14 h-8 rounded-full transition-all duration-300 relative border border-white/20 shadow-inner ${allowDuplicates ? 'bg-green-400' : 'bg-gray-200/50'}`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300 ${allowDuplicates ? 'translate-x-6' : ''}`} />
                </button>
             </div>
             
             {/* Animation Style Selector */}
             <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block ml-1">動畫風格</label>
                <div className="grid grid-cols-2 gap-2">
                    {DRAW_STYLES.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => !isRolling && setDrawStyle(style.id)}
                            disabled={isRolling}
                            className={`
                                flex items-center gap-2 p-3 rounded-xl border text-left transition-all
                                ${drawStyle === style.id 
                                    ? 'bg-blue-50/80 border-blue-400 text-blue-700 shadow-sm ring-1 ring-blue-400/30' 
                                    : 'bg-white/30 border-white/40 text-gray-600 hover:bg-white/50'
                                }
                                ${isRolling ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            <div className={`p-1.5 rounded-full ${drawStyle === style.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                {style.icon}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold">{style.name}</span>
                            </div>
                        </button>
                    ))}
                </div>
             </div>

             <div className="pt-4 border-t border-white/30">
               <Button onClick={resetHistory} disabled={isRolling} variant="ghost" className="w-full gap-2 text-gray-500 hover:text-red-500 hover:bg-red-50/50">
                 <RotateCcw size={16} /> 重置抽獎紀錄
               </Button>
             </div>
          </div>
        </Card>

        {/* History List */}
        <Card title="中獎名單" className="flex-1 overflow-hidden flex flex-col min-h-[300px]">
           <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-2 scrollbar-hide">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 opacity-60">
                   <Trophy size={48} strokeWidth={1} />
                   <p>尚無中獎者</p>
                </div>
              ) : (
                history.map((h, i) => (
                  <div key={h.timestamp} className="flex items-center p-3 bg-white/40 border border-white/40 rounded-2xl animate-fade-in shadow-sm hover:bg-white/60 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 text-white flex items-center justify-center text-xs font-bold shadow-md mr-3 border border-white/30">
                      #{history.length - i}
                    </div>
                    <div>
                      <p className="font-bold text-[#1D1D1F]">{h.winner.name}</p>
                      <p className="text-xs text-gray-500">{new Date(h.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              )}
           </div>
        </Card>
      </div>

      {/* Center Stage: The Draw */}
      <div className="lg:col-span-8 flex flex-col h-full order-1 lg:order-2">
        <Card className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-white/30 border-white/40 shadow-2xl backdrop-blur-xl group">
           
           {/* Dynamic Background Effects based on style */}
           <div className="absolute inset-0 pointer-events-none transition-all duration-500">
              {/* Rolling Focus Ring */}
              {(drawStyle === 'cyber' || drawStyle === 'pulse') && (
                  <>
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border-[1px] border-blue-400/20 transition-all duration-300 ${isRolling ? 'scale-100 opacity-100 animate-[spin_3s_linear_infinite]' : 'scale-50 opacity-0'}`}></div>
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border-[1px] border-purple-400/20 transition-all duration-300 ${isRolling ? 'scale-100 opacity-100 animate-[spin_4s_linear_infinite_reverse]' : 'scale-50 opacity-0'}`}></div>
                  </>
              )}
              
              {/* Matrix Background */}
              {drawStyle === 'matrix' && isRolling && (
                  <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                       <div className="w-full h-full bg-[url('https://upload.wikimedia.org/wikipedia/commons/1/17/Matrix_digital_rain.gif')] bg-cover opacity-10 mix-blend-overlay"></div>
                  </div>
              )}

              {/* Radar Background */}
              {drawStyle === 'radar' && (
                  <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,0,0.1)_0,transparent_70%)] transition-opacity ${isRolling ? 'opacity-100' : 'opacity-0'}`}></div>
              )}

              {/* Winner Glow */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 transition-opacity duration-1000 ${isWinner ? 'opacity-100' : 'opacity-0'}`}></div>
           </div>

           {/* Particles on Win */}
           {isWinner && <Particles />}

           <div className="relative z-10 w-full max-w-4xl text-center space-y-16 px-4">
             <div className="min-h-[300px] flex items-center justify-center perspective-[1000px]">
                {displayPerson ? (
                  <div className="w-full">
                    
                    {/* Winner Crown / Icon */}
                    {isWinner && (
                        <div className="mb-6 flex justify-center animate-[bounce_1s_infinite]">
                            <div className="bg-yellow-400/20 p-3 rounded-full backdrop-blur-md border border-yellow-400/50">
                                <Sparkles size={40} className="text-yellow-500 fill-yellow-200" />
                            </div>
                        </div>
                    )}

                    {/* RENDER THE SELECTED STYLE */}
                    {drawStyle === 'cyber' && renderCyber()}
                    {drawStyle === 'slot' && renderSlot()}
                    {drawStyle === 'matrix' && renderMatrix()}
                    {drawStyle === 'radar' && renderRadar()}
                    {drawStyle === 'galaxy' && renderGalaxy()}
                    {drawStyle === 'pulse' && renderPulse()}

                    {/* Department Tag */}
                    {(displayPerson.department && (isWinner || !isRolling || drawStyle === 'slot')) && (
                      <div className={`mt-6 transition-all duration-300 ${isRolling ? 'opacity-50 blur-sm scale-90' : 'opacity-100 scale-100'}`}>
                        <span className={`
                            inline-block px-6 py-2 rounded-full font-bold text-xl shadow-lg border
                            ${isWinner 
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent' 
                                : 'bg-white/60 text-gray-600 border-white/50'
                            }
                        `}>
                          {displayPerson.department}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center opacity-40">
                    <div className="w-32 h-32 rounded-full border-4 border-dashed border-gray-400 flex items-center justify-center mb-4 animate-[spin_10s_linear_infinite]">
                        <PartyPopper size={48} />
                    </div>
                    <div className="text-gray-500 font-bold text-3xl tracking-widest">READY</div>
                  </div>
                )}
             </div>

             {/* Action Buttons */}
             <div className="flex justify-center pt-8">
               {!isRolling ? (
                 <Button 
                   onClick={startDraw} 
                   disabled={currentPool.length === 0}
                   size="lg"
                   className={`
                        w-64 h-20 text-2xl rounded-full shadow-[0_10px_40px_-10px_rgba(0,122,255,0.5)] 
                        hover:shadow-[0_20px_60px_-10px_rgba(0,122,255,0.7)] hover:-translate-y-1 
                        transform transition-all duration-300 group
                        ${isWinner ? 'animate-[pulse_2s_infinite]' : ''}
                   `}
                 >
                   <span className="relative z-10 flex items-center">
                     <Play size={28} className="mr-3 fill-current group-hover:scale-110 transition-transform" /> 
                     {isWinner ? "下一位" : "開始抽獎"}
                   </span>
                 </Button>
               ) : (
                 <Button 
                   onClick={stopDraw} 
                   variant="secondary"
                   size="lg"
                   className="w-64 h-20 text-2xl rounded-full bg-white/90 backdrop-blur-xl text-red-500 border-2 border-red-100 shadow-xl hover:scale-95 hover:bg-red-50"
                 >
                   <Square size={28} className="mr-3 fill-current animate-pulse" /> 停止
                 </Button>
               )}
             </div>
           </div>
        </Card>
      </div>
    </div>
  );
};