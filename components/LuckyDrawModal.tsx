import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Person } from '../types';
import { X, Trophy, Sparkles, Wand2 } from 'lucide-react';

interface LuckyDrawModalProps {
    isOpen: boolean;
    winner: Person | null;
    onClose: () => void;
}

export const LuckyDrawModal: React.FC<LuckyDrawModalProps> = ({ isOpen, winner, onClose }) => {
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (isOpen && winner) {
            setShowConfetti(true);
            // Trigger confetti burst
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#FFD700', '#FF4500', '#00BFFF', '#FF00FF']
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#FFD700', '#FF4500', '#00BFFF', '#FF00FF']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();

            // Big initial burst
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                gravity: 1.2,
                scalar: 1.2,
            });

        } else {
            setShowConfetti(false);
        }
    }, [isOpen, winner]);

    // Text Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        },
        exit: { opacity: 0 }
    };

    const itemVariants = {
        hidden: { y: 50, opacity: 0, scale: 0.8 },
        visible: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: { type: "spring" as const, stiffness: 300, damping: 20 }
        }
    };

    const nameVariants = {
        hidden: { scale: 0.5, opacity: 0, rotateX: -90 },
        visible: {
            scale: 1,
            opacity: 1,
            rotateX: 0,
            transition: { type: "spring" as const, stiffness: 200, damping: 15 }
        }
    };

    if (!winner) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center isolate"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop with heavy blur and gradient overlay */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-3xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Animated Background Elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <motion.div
                            className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[100px]"
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.6, 0.3],
                                x: [0, 50, 0],
                                y: [0, 30, 0]
                            }}
                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div
                            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/30 rounded-full blur-[100px]"
                            animate={{
                                scale: [1.2, 1, 1.2],
                                opacity: [0.3, 0.6, 0.3],
                                x: [0, -50, 0],
                                y: [0, -30, 0]
                            }}
                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </div>

                    {/* Modal Content */}
                    <motion.div
                        className="relative z-10 w-full max-w-4xl p-8 flex flex-col items-center justify-center text-center"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Winner Badge */}
                        <motion.div variants={itemVariants} className="mb-8 relative">
                            <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-50 animate-pulse rounded-full"></div>
                            <div className="relative bg-gradient-to-br from-yellow-300 to-yellow-600 p-4 rounded-full shadow-[0_0_50px_rgba(255,215,0,0.6)] border-4 border-white/90">
                                <Trophy size={64} className="text-white drop-shadow-md" strokeWidth={1.5} />
                            </div>
                        </motion.div>

                        {/* "THE WINNER IS" Label */}
                        <motion.div variants={itemVariants} className="mb-4">
                            <span className="text-xl md:text-2xl font-bold tracking-[0.5em] text-blue-200 uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                                Congratulations
                            </span>
                        </motion.div>

                        {/* Huge Name Display */}
                        <motion.div variants={itemVariants} className="mb-6 relative perspective-[1000px]">
                            <motion.h1
                                className="font-black text-8xl md:text-[10rem] leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-blue-200 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                                style={{ textShadow: '0 0 80px rgba(255,255,255,0.5)' }}
                                variants={nameVariants}
                            >
                                {winner.name}
                            </motion.h1>

                            {/* Reflection/Glow underneath */}
                            <motion.h1
                                className="absolute top-full left-0 right-0 font-black text-8xl md:text-[10rem] leading-none text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-transparent blur-sm scale-y-[-0.5] origin-top pointer-events-none select-none"
                                variants={nameVariants}
                            >
                                {winner.name}
                            </motion.h1>
                        </motion.div>

                        {/* Department / Details */}
                        {winner.department && (
                            <motion.div variants={itemVariants} className="mb-12">
                                <div className="inline-flex items-center gap-3 px-8 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg">
                                    <Sparkles className="text-yellow-400" size={20} />
                                    <span className="text-2xl font-bold text-white tracking-wide">{winner.department}</span>
                                </div>
                            </motion.div>
                        )}

                        {/* Action Button */}
                        <motion.div variants={itemVariants} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <button
                                onClick={onClose}
                                className="group relative px-12 py-5 bg-white text-black font-black text-xl rounded-full shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] transition-all overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    CONTINUE <Wand2 size={24} className="group-hover:rotate-45 transition-transform duration-300" />
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                                <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-40 group-hover:animate-shine" />
                            </button>
                        </motion.div>

                    </motion.div>

                    {/* Close Icon (Top Right) */}
                    <motion.button
                        onClick={onClose}
                        className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors border border-white/10"
                        initial={{ opacity: 0, rotate: -90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0 }}
                        whileHover={{ rotate: 90 }}
                    >
                        <X size={32} />
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
