import React, { useState, useEffect, useMemo } from 'react';
import { Person } from '../types';
import { parseCSV, generateDemoData, BUSINESS_UNITS } from '../utils';
import { Button, Card } from './ui/SciFiElements';
import { Upload, FileText, Trash2, CheckCircle2, Wand2, AlertTriangle, Info, Building2, ChevronDown, Save, RefreshCw } from 'lucide-react';
import { saveAllToBackend } from '../backend';

interface InputSectionProps {
  onDataLoaded: (data: Person[]) => void;
  currentCount: number;
  initialCandidates?: Person[];
  isAdmin?: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onDataLoaded, currentCount, initialCandidates, isAdmin }) => {
  const [textInput, setTextInput] = useState(() => {
    // Initialize from existing candidates if available
    if (initialCandidates && initialCandidates.length > 0) {
      return initialCandidates.map(p => p.department ? `${p.name}, ${p.department}` : p.name).join('\n');
    }
    return '';
  });
  const [selectedUnit, setSelectedUnit] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState<Person[]>([]);

  // Real-time parsing for preview
  useEffect(() => {
    // Pass selectedUnit as the second argument. 
    // Logic in utils.ts: CSV content (parts[1]) takes priority over selectedUnit.
    const parsed = parseCSV(textInput, selectedUnit || undefined);
    setPreviewData(parsed);
    onDataLoaded(parsed);
  }, [textInput, selectedUnit]);

  // Duplicate Logic
  const duplicateInfo = useMemo(() => {
    const keyCount = new Map<string, number>();

    previewData.forEach(p => {
      const namePart = p.name.trim().toLowerCase();
      const deptPart = p.department ? p.department.trim().toLowerCase() : '';
      const key = `${namePart}|${deptPart}`;

      keyCount.set(key, (keyCount.get(key) || 0) + 1);
    });

    const duplicateKeys = new Set(
      Array.from(keyCount.entries())
        .filter(([_, count]) => count > 1)
        .map(([key]) => key)
    );

    return {
      hasDuplicates: duplicateKeys.size > 0,
      duplicateKeys,
      count: duplicateKeys.size
    };
  }, [previewData]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file);
  };

  const processFile = (file?: File) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setTextInput(prev => prev ? `${prev.trim()}\n${content.trim()}` : content.trim());
        // Note: We intentionally do NOT clear selectedUnit here, 
        // allowing the user to bulk-assign a unit to a file of just names.
        // However, parseCSV prioritizes the file's comma-separated units if they exist.
      };
      reader.readAsText(file);
    }
  };

  const handleClear = () => {
    setTextInput('');
  };

  const loadDemoData = () => {
    // When loading demo data (which has mixed units), we clear the dropdown 
    // so it doesn't look like we are forcing a single unit.
    setSelectedUnit('');
    const demo = generateDemoData();
    setTextInput(prev => prev ? `${prev.trim()}\n${demo.trim()}` : demo.trim());
  };

  const removeDuplicates = () => {
    const uniqueKeys = new Set();
    const uniquePeople: Person[] = [];

    previewData.forEach(p => {
      const namePart = p.name.trim().toLowerCase();
      const deptPart = p.department ? p.department.trim().toLowerCase() : '';
      const key = `${namePart}|${deptPart}`;

      if (!uniqueKeys.has(key)) {
        uniqueKeys.add(key);
        uniquePeople.push(p);
      }
    });

    const newText = uniquePeople.map(p => {
      return p.department ? `${p.name}, ${p.department}` : p.name;
    }).join('\n');

    setTextInput(newText);
  };

  const [isSaving, setIsSaving] = useState(false);
  const handleSaveToGAS = async () => {
    if (!window.confirm("確定要把目前的清單同步覆蓋到 Google Sheets 嗎？")) return;
    setIsSaving(true);
    try {
      const success = await saveAllToBackend(previewData);
      if (success) {
        alert("同步成功！資料已寫入 Google Sheets。");
      } else {
        alert("同步失敗，請檢查後端設定。");
      }
    } catch (error) {
      alert("發生錯誤，請稍後再試。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-full items-start">
      {/* Left Column: Input */}
      <div className="flex flex-col gap-6 h-full">
        {/* Custom Header Structure replacing standard Card title */}
        <Card className="flex-1 min-h-[400px] flex flex-col">

          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold tracking-wide text-[#1D1D1F] drop-shadow-sm">名單來源</h3>
              <p className="text-sm text-gray-500 mt-1 font-medium">輸入姓名，或選擇下方事業體來自動歸類</p>
            </div>
            <Button
              onClick={loadDemoData}
              variant="secondary"
              size="sm"
              className="gap-1.5 text-ios-purple border-ios-purple/20 bg-purple-50/30 hover:bg-purple-50/60 transition-colors whitespace-nowrap shadow-sm"
            >
              <Wand2 size={14} /> 模擬名單
            </Button>
          </div>

          {/* Business Unit Selector */}
          <div className="mb-4 relative z-20">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block ml-1 flex items-center gap-1">
              <Building2 size={14} /> 選擇預設事業體 (批次設定)
            </label>
            <div className="relative">
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full bg-white/40 backdrop-blur-sm border border-white/50 text-[#1D1D1F] pl-4 pr-10 py-3 rounded-2xl focus:bg-white/70 appearance-none cursor-pointer shadow-inner font-medium transition-all hover:bg-white/50"
              >
                <option value="">不指定 (或以名單內逗號後為主)</option>
                {BUSINESS_UNITS.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <ChevronDown size={18} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 ml-1 flex items-center gap-1">
              <Info size={12} />
              <span className={selectedUnit ? "text-blue-600 font-medium" : ""}>
                優先順序：CSV檔案內單位 &gt; 此處選擇
              </span>
            </p>
          </div>

          <div className="flex-1 bg-white/30 rounded-2xl p-4 mb-4 border border-white/50 focus-within:bg-white/60 focus-within:shadow-[0_0_20px_rgba(0,122,255,0.1)] transition-all relative">
            {textInput.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-gray-400 text-sm text-center">
                  請輸入姓名，一行一個<br />
                  <span className="text-xs opacity-70 mt-1 block">若需個別指定其他單位請用逗號<br />例：陳小美, {selectedUnit || '行銷部'}</span>
                </p>
              </div>
            )}
            <textarea
              className="w-full h-full bg-transparent border-none resize-none focus:outline-none text-[#1D1D1F] text-base leading-relaxed placeholder:text-gray-400/80"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            {isAdmin && (
              <Button
                onClick={handleSaveToGAS}
                disabled={isSaving || previewData.length === 0}
                variant="primary"
                className="px-6 bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto gap-2"
              >
                {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                儲存至 Google Sheets
              </Button>
            )}
            <Button onClick={handleClear} variant="secondary" className="px-6 text-gray-500 hover:text-red-500 hover:bg-red-50/20 w-full sm:w-auto gap-2">
              <Trash2 size={18} /> 清空目前內容
            </Button>
          </div>
        </Card>

        {/* File Upload Area */}
        <div
          className={`relative group bg-white/30 backdrop-blur-md rounded-3xl p-6 text-center border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden
            ${dragActive
              ? 'border-blue-400 bg-blue-50/40 scale-[1.02]'
              : 'border-white/60 hover:border-blue-400/50 hover:bg-white/40'
            }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            processFile(e.dataTransfer.files[0]);
          }}
        >
          <input
            type="file"
            accept=".csv,.txt"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleFileUpload}
          />
          <div className="flex items-center justify-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm">
              <Upload size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#1D1D1F]">匯入 CSV / TXT</h3>
              <p className="text-xs text-gray-500">優先讀取檔案內的單位，若無則套用上方設定</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Preview & Status */}
      <div className="flex flex-col gap-6 h-full">
        {/* Status Card */}
        <Card className="!p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors duration-500 ${currentCount > 0 ? 'bg-gradient-to-br from-green-100 to-green-50 text-green-600' : 'bg-gradient-to-br from-gray-100 to-gray-50 text-gray-400'}`}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">目前總人數</p>
                <p className="text-2xl font-bold text-[#1D1D1F]">{currentCount} <span className="text-base font-normal text-gray-400">人</span></p>
              </div>
            </div>

            {duplicateInfo.hasDuplicates && (
              <div className="flex flex-col items-end animate-fade-in">
                <span className="flex items-center gap-1 text-red-600 text-sm font-bold bg-red-100/80 px-4 py-1.5 rounded-full mb-2 shadow-sm border border-red-200">
                  <AlertTriangle size={14} /> 發現 {duplicateInfo.count} 組完全重複
                </span>
                <button
                  onClick={removeDuplicates}
                  className="text-xs text-red-500 underline hover:text-red-700 transition-colors"
                >
                  移除所有重複項目
                </button>
              </div>
            )}
          </div>

          {/* Hint about deduplication */}
          <div className="mt-4 pt-4 border-t border-gray-200/50 text-xs text-gray-500 space-y-1">
            <div className="flex items-start gap-2">
              <Info size={14} className="mt-0.5 text-blue-500 flex-shrink-0" />
              <p>若同名同姓為不同人，請加上單位區分（例：王小明, A店）。</p>
            </div>
            {selectedUnit ? (
              <div className="flex items-start gap-2 animate-fade-in">
                <CheckCircle2 size={14} className="mt-0.5 text-green-500 flex-shrink-0" />
                <p>批次設定啟用中：純姓名資料將自動歸類為 <span className="font-bold text-gray-700">{selectedUnit}</span></p>
              </div>
            ) : (
              <div className="flex items-start gap-2 animate-fade-in opacity-60">
                <Info size={14} className="mt-0.5 text-gray-400 flex-shrink-0" />
                <p>小提示：選擇上方「事業體」可批次為純姓名名單加入單位。</p>
              </div>
            )}
          </div>
        </Card>

        {/* Preview List */}
        <Card title="名單預覽" className="flex-1 overflow-hidden flex flex-col min-h-[300px] bg-white/40 border-white/60">
          <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-2 scrollbar-hide pr-2">
            {previewData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                <FileText size={48} strokeWidth={1} />
                <p className="mt-2">暫無資料</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {previewData.map((p, i) => {
                  const namePart = p.name.trim().toLowerCase();
                  const deptPart = p.department ? p.department.trim().toLowerCase() : '';
                  const key = `${namePart}|${deptPart}`;
                  const isDup = duplicateInfo.duplicateKeys.has(key);

                  // Check if the displayed department comes from the dropdown (default) or the text itself
                  // We can infer this: if text has comma, it's explicit. 
                  // Simplified check: if selectedUnit is active and matches department, highlight it as auto-assigned?
                  // Actually, let's just show it.

                  return (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${isDup ? 'bg-red-50/90 border-red-300 shadow-md transform scale-[1.01]' : 'bg-white/60 border-white/50 hover:bg-white/80'}`}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${isDup ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {i + 1}
                        </div>
                        <div className="truncate">
                          <p className={`text-sm font-medium truncate ${isDup ? 'text-red-800' : 'text-gray-800'}`}>{p.name}</p>
                          {p.department && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md truncate ml-1 ${p.department === selectedUnit ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-200 text-gray-600'}`}>
                              {p.department}
                            </span>
                          )}
                        </div>
                      </div>
                      {isDup && <AlertTriangle size={16} className="text-red-500 flex-shrink-0 animate-pulse" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
