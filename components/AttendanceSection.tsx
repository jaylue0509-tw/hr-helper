import React, { useState, useMemo } from 'react';
import { Person } from '../types';
import { Button, Card, Input } from './ui/SciFiElements';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    QrCode, UserCheck, Clock, CheckCircle2, AlertCircle,
    MapPin, Navigation2, Compass, Copy, ExternalLink,
    ChevronRight, ArrowRight, Upload, RefreshCw, Download
} from 'lucide-react';
import { parseCSV } from '../utils';
import { fetchCandidatesFromBackend } from '../backend';

interface AttendanceSectionProps {
    candidates: Person[];
    onCheckIn: (name: string, region: string) => void;
    onDataLoaded?: (data: Person[]) => void;
}

type Region = '北區' | '中區' | '南區';

const REGIONS: { id: Region, color: string, glow: string, icon: any }[] = [
    { id: '北區', color: 'bg-indigo-600', glow: 'shadow-indigo-500/20', icon: MapPin },
    { id: '中區', color: 'bg-emerald-600', glow: 'shadow-emerald-500/20', icon: Navigation2 },
    { id: '南區', color: 'bg-amber-600', glow: 'shadow-amber-500/20', icon: Compass },
];

export const AttendanceSection: React.FC<AttendanceSectionProps> = ({ candidates, onCheckIn, onDataLoaded }) => {
    const [activeRegion, setActiveRegion] = useState<Region>('北區');
    const [signName, setSignName] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [customBaseUrl, setCustomBaseUrl] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.location.origin + window.location.pathname;
        }
        return '';
    });

    const activeColor = REGIONS.find(r => r.id === activeRegion)?.color || 'bg-blue-600';
    const activeGlow = REGIONS.find(r => r.id === activeRegion)?.glow || '';

    // Append region to URL for scanning logic (simulated)
    const scanUrl = `${customBaseUrl.split('?')[0]}?mode=checkin&region=${encodeURIComponent(activeRegion)}`;

    const handleCheckIn = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!signName.trim()) return;

        const person = candidates.find(p => p.name.trim() === signName.trim());

        if (!person) {
            setMessage({ type: 'error', text: `找不到「${signName}」，請檢查名單或聯繫 HR` });
            return;
        }

        if (person.attended) {
            setMessage({ type: 'success', text: `${person.name} 已經簽到過了哦！` });
            setSignName('');
            return;
        }

        onCheckIn(signName, activeRegion);
        setMessage({ type: 'success', text: `${person.name} 簽到成功！(${activeRegion})` });
        setSignName('');

        setTimeout(() => setMessage(null), 3000);
    };

    const handleSync = async () => {
        if (!onDataLoaded) return;
        setIsSyncing(true);
        setMessage({ type: 'success', text: '正在從 Google Sheets 同步資料...' });

        try {
            const data = await fetchCandidatesFromBackend();
            if (data && data.length > 0) {
                onDataLoaded(data);
                setMessage({ type: 'success', text: `同步完成！共載入 ${data.length} 筆資料。` });
            } else {
                setMessage({ type: 'error', text: '同步失敗：找不到資料或網址錯誤。' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: '同步發生錯誤，請檢查後端設定。' });
        } finally {
            setIsSyncing(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleExport = () => {
        if (candidates.length === 0) {
            setMessage({ type: 'error', text: '目前名單為空，無法匯出。' });
            return;
        }

        // CSV Header
        let csvContent = "\ufeff"; // BOM for Excel UTF-8
        csvContent += "姓名,部門,是否報到,報到時間,報到區域\n";

        // CSV Rows
        candidates.forEach(p => {
            const checkInTime = p.checkInTime ? new Date(p.checkInTime).toLocaleString() : "";
            const attended = p.attended ? "是" : "否";
            csvContent += `${p.name},${p.department || ""},${attended},${checkInTime},${p.region || ""}\n`;
        });

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `點名報表_${new Date().toLocaleDateString()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setMessage({ type: 'success', text: '報表匯出成功！' });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const csvContent = event.target?.result as string;
                const parsedData = parseCSV(csvContent);
                // Append and notify
                onDataLoaded?.([...candidates, ...parsedData]);
                setMessage({ type: 'success', text: `成功累計匯入 ${parsedData.length} 筆資料！` });
            } catch (error) {
                console.error("Error parsing CSV:", error);
                setMessage({ type: 'error', text: "匯入失敗，請檢查檔案格式。" });
            } finally {
                // Clear the file input value to allow re-uploading the same file
                e.target.value = '';
            }
        };
        reader.onerror = () => {
            setMessage({ type: 'error', text: "檔案讀取失敗。" });
            e.target.value = '';
        };
        reader.readAsText(file);
    };

    const regionStats = useMemo(() => {
        return REGIONS.map(r => ({
            id: r.id,
            count: candidates.filter(p => p.attended && p.region === r.id).length
        }));
    }, [candidates]);

    const activeList = useMemo(() => {
        return candidates
            .filter(p => p.attended && p.region === activeRegion)
            .sort((a, b) => (b.checkInTime || 0) - (a.checkInTime || 0));
    }, [candidates, activeRegion]);

    const copyUrl = () => {
        navigator.clipboard.writeText(scanUrl);
        // Could add a toast here
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in px-4 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-[#1D1D1F] tracking-tight">點名系統</h2>
                    <p className="text-gray-500 font-medium mt-1">請選擇報到區域並出示 QR Code 進行掃描</p>
                </div>

                {/* Region Switcher */}
                <div className="bg-gray-100/80 backdrop-blur-md p-1.5 rounded-2xl flex gap-1 border border-white">
                    {REGIONS.map((region) => (
                        <button
                            key={region.id}
                            onClick={() => setActiveRegion(region.id)}
                            className={`
                                relative px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-500
                                ${activeRegion === region.id ? 'text-white' : 'text-gray-500 hover:text-gray-700'}
                            `}
                        >
                            {activeRegion === region.id && (
                                <motion.div
                                    layoutId="active-pill"
                                    className={`absolute inset-0 ${region.color} rounded-xl shadow-lg ${region.glow}`}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10">{region.id}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left Column: QR Focus (4 Cols) */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="!p-0 overflow-hidden relative group">
                        <div className={`h-2 w-full transition-colors duration-500 ${activeColor}`} />
                        <div className="p-8 flex flex-col items-center">
                            <div className="mb-6 text-center">
                                <span className={`text-xs font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full text-white ${activeColor}`}>
                                    {activeRegion} 入口
                                </span>
                            </div>

                            <div className="relative p-6 bg-white rounded-[2rem] shadow-2xl border border-gray-100 group-hover:scale-[1.02] transition-transform duration-500">
                                {/* Scanner corner markers */}
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gray-200 rounded-tl-xl" />
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gray-200 rounded-tr-xl" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gray-200 rounded-bl-xl" />
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gray-200 rounded-br-xl" />

                                <div className="p-2">
                                    <QRCodeSVG value={scanUrl} size={220} level="H" includeMargin={false} />
                                </div>

                                <motion.div
                                    className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/80 to-transparent shadow-[0_0_15px_rgba(255,255,255,0.8)] z-10`}
                                    animate={{ top: ['0%', '100%', '0%'] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                />
                            </div>

                            <div className="mt-4 w-full">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">伺服器 IP 設定 (手機掃描必填)</label>
                                <Input
                                    value={customBaseUrl}
                                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                                    placeholder="例如 http://192.168.1.100:3001/hr-helper/"
                                    className="!text-[10px] !py-2 !px-3 mt-1 !bg-gray-50/50 !border-gray-100"
                                />
                                <p className="text-[9px] text-gray-400 mt-1 ml-1 leading-tight">
                                    註：若要用手機掃描，請將 localhost 改為您電腦的區域網路 IP，並確保手機與電腦連接同一 WiFi。
                                </p>
                            </div>

                            <a
                                href={scanUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-6 flex items-center gap-2 group/btn cursor-pointer py-2 px-4 rounded-xl hover:bg-gray-50 transition-colors w-full justify-center border border-dashed border-gray-200"
                            >
                                <code className="text-[10px] text-blue-500 font-mono truncate max-w-[200px]">{scanUrl}</code>
                                <ExternalLink size={14} className="text-blue-300 group-hover/btn:text-blue-600 transition-colors" />
                            </a>
                        </div>
                    </Card>

                    <Card title="快速簽到" subtitle="或是由管理員手動輸入">
                        <form onSubmit={handleCheckIn} className="space-y-4">
                            <div className="relative">
                                <Input
                                    placeholder="輸入參加者姓名"
                                    value={signName}
                                    onChange={(e) => setSignName(e.target.value)}
                                    className="!rounded-2xl !bg-gray-50/50 !border-gray-100 focus:!bg-white pr-12"
                                />
                                <UserCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                            </div>

                            <AnimatePresence mode="wait">
                                {message && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className={`p-4 rounded-2xl flex items-center gap-3 border shadow-sm ${message.type === 'success'
                                            ? 'bg-green-50 text-green-700 border-green-100'
                                            : 'bg-red-50 text-red-700 border-red-100'
                                            }`}
                                    >
                                        {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                        <span className="text-sm font-bold">{message.text}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Button onClick={handleCheckIn} className={`w-full py-4 text-lg font-bold !rounded-2xl transition-all duration-500 ${activeColor} border-none shadow-xl hover:scale-[0.98]`}>
                                完成簽到
                            </Button>
                        </form>
                    </Card>
                </div>

                {/* Right Column: Statistics & List (8 Cols) */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        {REGIONS.map(r => (
                            <Card key={r.id} className="!p-5 relative overflow-hidden group">
                                <div className={`absolute top-0 left-0 bottom-0 w-1 transition-colors duration-500 ${activeRegion === r.id ? r.color : 'bg-gray-100'}`} />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{r.id}</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-2xl font-black ${activeRegion === r.id ? 'text-[#1D1D1F]' : 'text-gray-400'}`}>
                                            {regionStats.find(s => s.id === r.id)?.count || 0}
                                        </span>
                                        <span className="text-[10px] text-gray-300 font-bold">已簽到</span>
                                    </div>
                                </div>
                                <r.icon className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-500 ${activeRegion === r.id ? 'text-gray-200 scale-125 opacity-100' : 'text-gray-100 scale-100 opacity-50'}`} size={40} strokeWidth={1.5} />
                            </Card>
                        ))}
                    </div>

                    {/* Check-in List */}
                    <Card className="flex flex-col h-[600px] !p-0 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-[#1D1D1F] flex items-center gap-2">
                                    {activeRegion} 簽到名單
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${activeColor}`}>LIVE</span>
                                </h3>
                                <p className="text-xs text-gray-400 font-medium">即時更新報到狀態</p>
                            </div>
                            <div className="flex gap-2">
                                {onDataLoaded && (
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".csv,.txt"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={handleFileUpload}
                                        />
                                        <Button variant="ghost" className="text-ios-purple !px-4 !py-2 rounded-xl bg-purple-50/50 hover:bg-purple-100/50">
                                            名單匯入.csv <Upload size={14} className="ml-2" />
                                        </Button>
                                    </div>
                                )}
                                <Button
                                    onClick={handleSync}
                                    disabled={isSyncing}
                                    variant="ghost"
                                    className="text-emerald-600 !px-4 !py-2 rounded-xl bg-emerald-50/50 hover:bg-emerald-100/50"
                                >
                                    從 Google Sheets 同步名單 <RefreshCw size={14} className={`ml-2 ${isSyncing ? 'animate-spin' : ''}`} />
                                </Button>
                                <Button
                                    onClick={handleExport}
                                    variant="ghost"
                                    className="text-blue-600 !px-4 !py-2 rounded-xl bg-blue-50/50 hover:bg-blue-100/50"
                                >
                                    匯出報表 <Download size={14} className="ml-2" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                            <AnimatePresence mode="popLayout">
                                {activeList.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="h-full flex flex-col items-center justify-center text-gray-300 py-20"
                                    >
                                        <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                                            <Clock size={32} strokeWidth={1} />
                                        </div>
                                        <p className="font-bold">目前區域尚無人簽到</p>
                                    </motion.div>
                                ) : (
                                    activeList.map((p, i) => (
                                        <motion.div
                                            key={p.id}
                                            layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="group flex items-center justify-between p-4 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg transition-colors duration-500 ${activeColor} shadow-lg shadow-blue-500/10`}>
                                                    {p.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-lg">{p.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{p.department || 'GENERAL'}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-200" />
                                                        <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                                                            <MapPin size={10} /> {p.region}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-[#1D1D1F]">
                                                        {new Date(p.checkInTime || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-green-500 flex items-center gap-1 justify-end uppercase tracking-widest">
                                                        <CheckCircle2 size={10} /> Success
                                                    </p>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                    <ChevronRight size={16} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Summary Footer */}
                        <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between px-8">
                            <div className="flex gap-4">
                                <span className="text-xs font-bold text-gray-400">總計簽到: {candidates.filter(p => p.attended).length} 人</span>
                                <span className="text-xs font-bold text-gray-400">剩餘名額: {candidates.length - candidates.filter(p => p.attended).length} 人</span>
                            </div>
                            <div className="h-1.5 w-32 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                    className={`h-full ${activeColor}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(candidates.filter(p => p.attended).length / candidates.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
