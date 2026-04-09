import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function ChatFAB() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // STICK TO HOME PAGE ONLY:
  // 1. Hide if not on the Home page ('/')
  // 2. Hide if user is not logged in
  if (location.pathname !== '/' || !user) return null;

  return (
    <motion.div 
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-24 right-6 z-[50] md:bottom-10 md:right-10"
    >
      <button
        onClick={() => navigate('/messages')}
        className="group relative flex items-center gap-3 bg-green-700 text-white px-5 py-4 rounded-2xl shadow-[0_20px_50px_rgba(21,128,61,0.3)] hover:bg-green-800 transition-all border border-green-600/20"
      >
        {/* Animated Notification Ring */}
        <div className="relative">
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
        
        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Negotiations</span>
          <span className="font-black text-sm">Open Chats</span>
        </div>

        {/* Shine effect on hover */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
        </div>
      </button>
    </motion.div>
  );
}