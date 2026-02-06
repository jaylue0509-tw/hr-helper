import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Person, Group, Node } from '../types';
import { Button, Input, Card } from './ui/SciFiElements';
import { chunkArray, shuffleArray, downloadGroupsCSV } from '../utils';
import { LayoutGrid, Download, RefreshCw, Move, Sofa, School, Users, Square, Presentation, MonitorPlay, Info, ThumbsUp, AlertTriangle, Lightbulb } from 'lucide-react';

interface GroupVisualizerProps {
  candidates: Person[];
}

type RoomStyle = 'cluster' | 'classroom' | 'u-shape' | 'hollow' | 'theater';

interface RoomConfig {
  id: RoomStyle;
  name: string;
  icon: React.ReactNode;
  desc: string;
  pros: string;
  cons: string;
  capacity: string;
  scenario: string;
}

const ROOM_CONFIGS: RoomConfig[] = [
  {
    id: 'cluster',
    name: '分組討論型 (魚骨型)',
    icon: <Users size={18} />,
    desc: '以小組為單位圍桌坐，或是桌子成斜角排列。',
    capacity: '任何人數',
    scenario: '工作坊、腦力激盪、小組競賽',
    pros: '極佳的互動性與團隊凝聚力',
    cons: '部分學員可能需要轉身才能看到講師'
  },
  {
    id: 'classroom',
    name: '教室型',
    icon: <School size={18} />,
    desc: '學員面對講台成排坐開，每人都有桌子。',
    capacity: '中到大型（20人以上）',
    scenario: '講授式課程、需大量筆記或筆電',
    pros: '空間利用率最高，視野統一',
    cons: '缺乏互動，後排距離感強'
  },
  {
    id: 'u-shape',
    name: 'U 字型',
    icon: <Sofa size={18} />, 
    desc: '桌子排列成「U」字形，開口朝向講師。',
    capacity: '小型（15-25人）',
    scenario: '技能演示、講師需頻繁走入互動',
    pros: '眼神交流佳，講師可照顧每個人',
    cons: '極度佔空間，不適合人數過多的場合'
  },
  {
    id: 'hollow',
    name: '中空矩形',
    icon: <Square size={18} />,
    desc: '桌子圍成封閉的正方形或長方形，中間留空。',
    capacity: '中小型（12-30人）',
    scenario: '高階主管會議、圓桌論壇',
    pros: '展現平等氛圍，適合深入的對話',
    cons: '講師難以「主導」全場'
  },
  {
    id: 'theater',
    name: '劇院型',
    icon: <Presentation size={18} />,
    desc: '只有椅子，沒有桌子，整齊排列。',
    capacity: '極大型（50人以上）',
    scenario: '短期演講、產品發表會',
    pros: '極大化收容人數',
    cons: '學員完全處於被動接收狀態'
  }
];

export const GroupVisualizer: React.FC<GroupVisualizerProps> = ({ candidates }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [groupSize, setGroupSize] = useState<number>(5);
  const [groups, setGroups] = useState<Group[]>([]);
  const [roomStyle, setRoomStyle] = useState<RoomStyle>('cluster');
  
  // Ref to keep track of current groups in D3 event loop
  const groupsRef = useRef<Group[]>([]);
  
  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

  const currentRoomConfig = useMemo(() => ROOM_CONFIGS.find(r => r.id === roomStyle)!, [roomStyle]);

  const generateGroups = () => {
    if (groupSize < 1) return;
    const shuffled = shuffleArray(candidates);
    const chunks = chunkArray(shuffled, groupSize);
    
    const newGroups = chunks.map((chunk, idx) => ({
      id: idx + 1,
      name: `第 ${idx + 1} 組`,
      members: chunk
    }));
    
    setGroups(newGroups);
  };

  const handleExport = () => {
      downloadGroupsCSV(groups);
  };

  const moveMember = (personId: string, targetGroupId: number) => {
    setGroups(prevGroups => {
        const newGroups = prevGroups.map(g => ({...g, members: [...g.members]}));
        let person: Person | undefined;
        
        for (const g of newGroups) {
            const idx = g.members.findIndex(m => m.id === personId);
            if (idx !== -1) {
                person = g.members[idx];
                g.members.splice(idx, 1);
                break;
            }
        }

        if (person) {
            const targetGroup = newGroups.find(g => g.id === targetGroupId);
            if (targetGroup) {
                targetGroup.members.push(person);
            }
        }
        return newGroups;
    });
  };

  // --- Layout Calculation Logic ---
  const calculateLayout = (width: number, height: number, groupCount: number) => {
      const padding = 20;
      const zones: { [key: number]: { x: number, y: number, w: number, h: number, color: string } } = {};
      const colors = ["#5AC8FA", "#AF52DE", "#FF2D55", "#5856D6", "#FF9500", "#34C759", "#00C7BE", "#FFCC00"];
      
      const usableW = width - padding * 2;
      const usableH = height - padding * 2;
      const stageHeight = 60; // Reduced stage visual height for calculation (visual is separate)
      
      const assign = (idx: number, x: number, y: number, w: number, h: number) => {
          if (idx < groups.length) {
              zones[groups[idx].id] = {
                  x: x + padding,
                  y: y + padding,
                  w,
                  h,
                  color: colors[idx % colors.length]
              };
          }
      };

      if (roomStyle === 'cluster') {
          // Grid Layout
          const cols = Math.max(1, Math.floor(usableW / 260)); 
          const rows = Math.ceil(groupCount / cols);
          const w = usableW / cols;
          const h = usableH / rows; 
          
          for (let i = 0; i < groupCount; i++) {
              const col = i % cols;
              const row = Math.floor(i / cols);
              assign(i, col * w, row * h, w, h);
          }

      } else if (roomStyle === 'classroom' || roomStyle === 'theater') {
          const availableH = usableH - stageHeight;
          const minCardW = roomStyle === 'theater' ? 180 : 240;
          const cols = Math.max(1, Math.floor(usableW / minCardW)); 
          const rows = Math.ceil(groupCount / cols);
          
          const w = usableW / cols;
          const h = availableH / rows;

          for (let i = 0; i < groupCount; i++) {
              const col = i % cols;
              const row = Math.floor(i / cols);
              assign(i, col * w, stageHeight + row * h, w, h);
          }

      } else if (roomStyle === 'u-shape') {
          if (groupCount <= 3) {
             const w = usableW / 3;
             const h = usableH - stageHeight;
             if(groupCount > 0) assign(0, 0, stageHeight, w, h); // Left
             if(groupCount > 1) assign(1, w, stageHeight + h*0.4, w, h*0.6); // Bottom center
             if(groupCount > 2) assign(2, w*2, stageHeight, w, h); // Right
          } else {
             const sideCount = Math.ceil((groupCount - 1) / 2);
             const bottomCount = Math.max(1, groupCount - (sideCount * 2));
             
             const colW = usableW * 0.25; 
             const bottomRowY = usableH - (usableH / (sideCount + 1)); 
             const rowH = (bottomRowY - stageHeight) / sideCount;
             
             let currentIdx = 0;
             // Left Column
             for(let i=0; i<sideCount && currentIdx < groupCount; i++) {
                 assign(currentIdx++, 0, stageHeight + i * rowH, colW, rowH);
             }
             // Bottom Row
             const centerW = usableW * 0.5;
             const bottomW = centerW / bottomCount;
             const bottomH = usableH - bottomRowY;
             for(let i=0; i<bottomCount && currentIdx < groupCount; i++) {
                 assign(currentIdx++, colW + i*bottomW, bottomRowY, bottomW, bottomH);
             }
             // Right Column
             for(let i=0; i<sideCount && currentIdx < groupCount; i++) {
                 assign(currentIdx++, usableW - colW, stageHeight + i * rowH, colW, rowH);
             }
          }

      } else if (roomStyle === 'hollow') {
          const gridSize = Math.ceil(Math.sqrt(groupCount + 1)); 
          const w = usableW / gridSize;
          const h = usableH / gridSize;
          
          let placed = 0;
          for(let row=0; row<gridSize; row++) {
              for(let col=0; col<gridSize; col++) {
                  const isCenter = (row > 0 && row < gridSize-1) && (col > 0 && col < gridSize-1);
                  if (!isCenter && placed < groupCount) {
                      assign(placed++, col * w, row * h, w, h);
                  }
              }
          }
      }

      return zones;
  };

  useEffect(() => {
    if (!groups.length || !svgRef.current || !containerRef.current) return;

    // 1. Determine Dimensions based on Content
    const parentWidth = containerRef.current.clientWidth;
    const parentMinHeight = containerRef.current.clientHeight;
    
    // Constants for sizing
    const cardHeight = 220; 
    const theaterHeight = 140; 
    const stageOffset = 60;
    
    let requiredHeight = parentMinHeight;
    
    // Calculate required height to prevent squashing
    if (roomStyle === 'cluster') {
        const cols = Math.max(1, Math.floor(parentWidth / 260));
        const rows = Math.ceil(groups.length / cols);
        requiredHeight = Math.max(parentMinHeight, rows * (cardHeight + 20) + 40);
    } else if (roomStyle === 'classroom') {
        const cols = Math.max(1, Math.floor(parentWidth / 240));
        const rows = Math.ceil(groups.length / cols);
        requiredHeight = Math.max(parentMinHeight, stageOffset + rows * (cardHeight + 20) + 40);
    } else if (roomStyle === 'theater') {
        const cols = Math.max(1, Math.floor(parentWidth / 180));
        const rows = Math.ceil(groups.length / cols);
        requiredHeight = Math.max(parentMinHeight, stageOffset + rows * (theaterHeight + 10) + 40);
    } else if (roomStyle === 'u-shape') {
        const sideCount = Math.ceil((groups.length - 1) / 2);
        requiredHeight = Math.max(parentMinHeight, stageOffset + sideCount * cardHeight + 40);
    } else if (roomStyle === 'hollow') {
        const gridSize = Math.ceil(Math.sqrt(groups.length + 1));
        requiredHeight = Math.max(parentMinHeight, gridSize * 200 + 40);
    }

    // Apply dimensions to SVG
    const width = parentWidth;
    const height = requiredHeight;

    // Clear SVG
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height]);

    // 2. Calculate Zones with new dimensions
    const zones = calculateLayout(width, height, groups.length);

    // 3. Nodes Data
    let nodes: Node[] = [];
    groups.forEach(g => {
        const zone = zones[g.id];
        if (!zone) return;
        
        g.members.forEach(m => {
            nodes.push({
                id: m.id,
                group: g.id,
                name: m.name,
                r: roomStyle === 'theater' ? 14 : 18, 
                x: zone.x + zone.w/2 + (Math.random()-0.5)*10,
                y: zone.y + zone.h/2 + (Math.random()-0.5)*10,
            });
        });
    });

    // 4. Force Simulation
    const simulation = d3.forceSimulation(nodes)
        .force("x", d3.forceX((d: any) => {
            const z = zones[d.group];
            return z ? z.x + z.w / 2 : width/2;
        }).strength(0.08))
        .force("y", d3.forceY((d: any) => {
            const z = zones[d.group];
            return z ? z.y + z.h / 2 : height/2;
        }).strength(0.08))
        .force("collide", d3.forceCollide().radius((d: any) => d.r + 2).iterations(2))
        .force("charge", d3.forceManyBody().strength(-10))
        .alphaDecay(0.02);

    // 5. Draw Layout (Zones)
    const zoneGroup = svg.append("g").attr("class", "zones");
    
    groups.forEach(g => {
        const z = zones[g.id];
        if (!z) return;

        const margin = 8;
        const cardX = z.x + margin;
        const cardY = z.y + margin;
        const cardW = Math.max(0, z.w - margin * 2);
        const cardH = Math.max(0, z.h - margin * 2);

        const gGroup = zoneGroup.append("g");

        // Card Background
        gGroup.append("rect")
            .attr("x", cardX)
            .attr("y", cardY)
            .attr("width", cardW)
            .attr("height", cardH)
            .attr("rx", 12)
            .attr("ry", 12)
            .attr("fill", "white")
            .attr("fill-opacity", 0.1)
            .attr("stroke", z.color)
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", roomStyle === 'theater' ? "4 2" : "none");

        // Header
        gGroup.append("path")
            .attr("d", `M${cardX},${cardY + 12} v-12 a12,12 0 0 1 12,-12 h${cardW - 24} a12,12 0 0 1 12,12 v12 Z`)
            .attr("fill", z.color)
            .attr("fill-opacity", 0.3);

        // Label
        gGroup.append("text")
            .attr("x", cardX + cardW / 2)
            .attr("y", cardY + 20)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .attr("fill", "#1D1D1F")
            .text(g.name);
            
        gGroup.append("text")
            .attr("x", cardX + cardW - 10)
            .attr("y", cardY + cardH - 10)
            .attr("text-anchor", "end")
            .attr("font-size", "10px")
            .attr("fill", "gray")
            .text(`${g.members.length}`);
    });

    // 6. Drag
    function drag(simulation: any) {
        function dragstarted(event: any) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
            d3.select(this).select("circle").attr("stroke", "#007AFF").attr("stroke-width", 3);
        }

        function dragged(event: any) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event: any) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
            d3.select(this).select("circle").attr("stroke", "white").attr("stroke-width", 2);

            const d = event.subject as Node;
            let targetGroupId: number | null = null;
            
            groups.forEach(g => {
                const z = zones[g.id];
                if (!z) return;
                if (event.x >= z.x && event.x <= z.x + z.w &&
                    event.y >= z.y && event.y <= z.y + z.h) {
                    targetGroupId = g.id;
                }
            });

            if (targetGroupId && targetGroupId !== d.group) {
                moveMember(d.id, targetGroupId);
            }
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    const node = svg.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .call(drag(simulation) as any)
        .style("cursor", "grab");

    node.append("circle")
        .attr("r", (d: any) => d.r)
        .attr("fill", d => zones[d.group!]?.color || "#ccc")
        .attr("fill-opacity", 0.9)
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .attr("filter", "drop-shadow(0px 2px 3px rgba(0,0,0,0.2))");

    node.append("text")
        .text(d => d.name) // Full Name
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em") // Vertically centered
        .attr("fill", "white")
        .attr("font-weight", "bold")
        .attr("font-size", (d: any) => {
             const len = d.name?.length || 0;
             if (len > 4) return "7px"; 
             if (len > 3) return "9px";
             return "11px";
        })
        .style("pointer-events", "none")
        .style("text-shadow", "0px 1px 2px rgba(0,0,0,0.3)");
        
    node.append("title").text(d => `${d.name}`);

    simulation.on("tick", () => {
        node.attr("transform", (d: any) => {
             const z = zones[d.group];
             if (z) {
                // Keep inside card
                d.x = Math.max(z.x + d.r, Math.min(z.x + z.w - d.r, d.x));
                d.y = Math.max(z.y + d.r + 20, Math.min(z.y + z.h - d.r, d.y));
             }
             return `translate(${d.x},${d.y})`;
        });
    });

    return () => simulation.stop();
  }, [groups, roomStyle]);

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Controls Bar */}
      <Card className="flex flex-col xl:flex-row items-end xl:items-center gap-6 py-4 flex-shrink-0">
        <div className="flex gap-4 w-full xl:w-auto">
            <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block ml-1">每組人數</label>
                <Input 
                    type="number" 
                    min={1} 
                    value={groupSize} 
                    onChange={(e) => setGroupSize(parseInt(e.target.value) || 1)} 
                    className="w-full min-w-[100px]"
                />
            </div>
            
            <div className="flex-1 min-w-[180px]">
                 <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block ml-1">桌型配置</label>
                 <div className="relative">
                    <select 
                        value={roomStyle}
                        onChange={(e) => setRoomStyle(e.target.value as RoomStyle)}
                        className="w-full bg-white/40 backdrop-blur-sm border border-white/50 text-[#1D1D1F] px-4 py-3 rounded-2xl focus:bg-white/70 appearance-none cursor-pointer pr-10 shadow-inner"
                    >
                        {ROOM_CONFIGS.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <Move size={16} />
                    </div>
                 </div>
            </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto xl:ml-auto">
            {groups.length > 0 && (
                <Button onClick={handleExport} variant="secondary" className="gap-2 whitespace-nowrap">
                    <Download size={18} /> <span className="hidden sm:inline">匯出 CSV</span>
                </Button>
            )}

            <Button onClick={generateGroups} size="lg" className="flex-1 xl:flex-none gap-2 whitespace-nowrap">
              {groups.length > 0 ? <RefreshCw size={18} /> : <LayoutGrid size={18} />} 
              {groups.length > 0 ? "重新分組" : "開始分組"}
            </Button>
        </div>
      </Card>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Visualization Area */}
        <Card className="lg:col-span-2 h-full flex flex-col p-0 overflow-hidden border-0 bg-white/20 relative" title="">
            
            {/* Header Area */}
            <div className="px-6 py-4 bg-white/40 backdrop-blur-md border-b border-white/50 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                    <h3 className="text-lg font-bold text-[#1D1D1F] flex items-center gap-2">
                        {currentRoomConfig.icon} {currentRoomConfig.name}
                    </h3>
                    <p className="text-sm text-gray-500">{currentRoomConfig.desc}</p>
                </div>
            </div>

            {/* Detailed Info Panel (The Requested Visualization Fields) */}
            <div className="px-6 py-3 bg-white/30 border-b border-white/30 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div className="flex items-start gap-2">
                    <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="font-bold text-gray-700 whitespace-nowrap">建議人數:</span>
                    <span className="text-gray-600">{currentRoomConfig.capacity}</span>
                </div>
                <div className="flex items-start gap-2">
                    <Lightbulb size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="font-bold text-gray-700 whitespace-nowrap">適用場景:</span>
                    <span className="text-gray-600">{currentRoomConfig.scenario}</span>
                </div>
                <div className="flex items-start gap-2">
                    <ThumbsUp size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="font-bold text-green-700 whitespace-nowrap">優點:</span>
                    <span className="text-gray-600">{currentRoomConfig.pros}</span>
                </div>
                <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="font-bold text-orange-600 whitespace-nowrap">缺點:</span>
                    <span className="text-gray-600">{currentRoomConfig.cons}</span>
                </div>
            </div>
            
            <div className="flex-1 relative overflow-y-auto custom-scrollbar bg-gradient-to-b from-white/10 to-transparent" ref={containerRef}>
                {/* Stage Indicator */}
                {(roomStyle === 'classroom' || roomStyle === 'u-shape' || roomStyle === 'theater') && (
                    <div className="sticky top-0 left-0 right-0 flex justify-center z-20 mb-4 pt-4 pointer-events-none">
                        <div className="bg-white/80 backdrop-blur-md border border-white/60 text-gray-700 px-6 py-2 rounded-full flex items-center gap-2 shadow-sm animate-fade-in">
                            <MonitorPlay size={18} className="text-ios-blue" />
                            <span className="text-xs font-bold tracking-widest uppercase">Stage / Screen</span>
                        </div>
                    </div>
                )}
                
                {groups.length === 0 && (
                     <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <p>請設定人數並點擊開始分組</p>
                     </div>
                )}
                <div className="w-full min-h-full">
                    <svg ref={svgRef} className="w-full block cursor-default"></svg>
                </div>
            </div>
        </Card>

        {/* List View */}
        <Card className="h-full overflow-hidden flex flex-col p-0 border-0 bg-white/40">
           <div className="p-6 pb-2 border-b border-white/40 bg-white/30 backdrop-blur-sm flex justify-between items-center">
               <h3 className="text-lg font-bold text-[#1D1D1F]">分組明細</h3>
           </div>
           <div className="overflow-y-auto p-4 space-y-4 flex-1">
             {groups.length === 0 ? (
               <div className="text-gray-400 text-center mt-10 text-sm">
                 <p>尚未產生分組</p>
               </div>
             ) : (
               groups.map((group) => (
                 <div key={group.id} className="bg-white/60 p-4 rounded-2xl shadow-sm border border-white/50 hover:bg-white/80 transition-colors">
                   <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-[#1D1D1F]">{group.name}</h4>
                      <span className="text-xs bg-white text-gray-600 px-2 py-1 rounded-full shadow-sm border border-gray-100">{group.members.length} 人</span>
                   </div>
                   <ul className="grid grid-cols-2 gap-2">
                     {group.members.map(m => (
                       <li key={m.id} className="text-gray-700 text-sm flex items-center gap-2 overflow-hidden">
                         <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0"></div>
                         <span className="truncate" title={m.name}>{m.name}</span>
                       </li>
                     ))}
                   </ul>
                 </div>
               ))
             )}
           </div>
        </Card>
      </div>
    </div>
  );
};
