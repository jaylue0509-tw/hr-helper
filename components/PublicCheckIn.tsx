import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, UserCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button, Input } from './ui/SciFiElements';
import { Person } from '../types';

interface PublicCheckInProps {
    region: string;
    onCheckIn: (name: string, region: string) => void;
    candidates: Person[];
}

export const PublicCheckIn: React.FC<PublicCheckInProps> = ({ region, onCheckIn, candidates }) => {
    const [name, setName] = useState('');
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const person = candidates.find(p => p.name.trim() === name.trim());

        if (!person) {
            setStatus('error');
            setMessage(`找不到「${name}」，請確認姓名或聯繫現場工作人員。`);
            return;
        }

        if (person.attended) {
            setStatus('success');
            setMessage(`${person.name}，您先前已經完成簽到了哦！`);
            return;
        }

        onCheckIn(name, region);
        setStatus('success');
        setMessage(`報到成功！歡迎參加活動。`);
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6 font-sans">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 border border-gray-100 relative overflow-hidden"
            >
                {/* Visual Accent */}
                <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${region === '北區' ? 'from-indigo-500 to-blue-500' :
                        region === '中區' ? 'from-emerald-500 to-teal-500' :
                            'from-amber-500 to-orange-500'
                    }`} />

                <div className="flex flex-col items-center text-center mt-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 text-gray-400">
                        <UserCheck size={32} />
                    </div>

                    <h1 className="text-3xl font-black text-[#1D1D1F]">活動報到</h1>
                    <p className="text-gray-500 font-medium mt-2">
                        歡迎抵達 <span className="text-blue-600 font-bold">{region}</span>
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {status === 'idle' ? (
                        <motion.form
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onSubmit={handleSubmit}
                            className="mt-10 space-y-6"
                        >
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">您的姓名</label>
                                <Input
                                    placeholder="請輸入完整姓名"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="!rounded-2xl !py-4 !px-6 !bg-gray-50/50 !border-gray-100 !text-lg"
                                    autoFocus
                                />
                            </div>

                            <Button
                                onClick={handleSubmit}
                                className="w-full py-5 text-xl font-black !rounded-2xl shadow-xl hover:scale-[0.98] transition-all"
                            >
                                確認報到
                            </Button>
                        </motion.form>
                    ) : (
                        <motion.div
                            key="status"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-10 flex flex-col items-center text-center"
                        >
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${status === 'success' ? 'bg-green-50 text-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)]' : 'bg-red-50 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                                }`}>
                                {status === 'success' ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
                            </div>
                            <p className={`text-lg font-bold ${status === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                                {message}
                            </p>

                            <button
                                onClick={() => setStatus('idle')}
                                className="mt-8 text-gray-400 font-bold flex items-center gap-2 hover:text-gray-600 transition-colors"
                            >
                                <ArrowLeft size={16} /> 返回重新輸入
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <p className="mt-8 text-gray-400 text-xs font-medium uppercase tracking-[0.2em]">Powered by PureHR System</p>
        </div>
    );
};
