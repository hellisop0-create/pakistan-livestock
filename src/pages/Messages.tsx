import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  collection, query, where, orderBy, onSnapshot, 
  limit, doc, writeBatch, getDocs, getDoc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { sendMessage } from '../lib/chat-service';
import { 
  Send, ChevronLeft, MessageCircle, 
  MoreVertical, Check, CheckCheck, ExternalLink,
  Ban, LogOut, ShieldAlert, Trash2, ShoppingBag, Tag, Inbox
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function Messages() {
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [activeAd, setActiveAd] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [chatFilter, setChatFilter] = useState<'all' | 'buying' | 'selling'>('all');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // --- 1. MEMOIZED COOLDOWN LOGIC ---
  const cooldown = useMemo(() => {
    if (!activeChat?.leftAt?.[user?.uid]) return { isRestricted: false, remainingHours: 0 };

    const leftTime = new Date(activeChat.leftAt[user.uid]).getTime();
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    const now = Date.now();
    const diff = now - leftTime;
    
    return {
      isRestricted: diff < TWELVE_HOURS,
      remainingHours: Math.ceil((TWELVE_HOURS - diff) / (1000 * 60 * 60))
    };
  }, [activeChat, user?.uid]);

  // --- 2. LEAVE CHAT WITH POPUP ---
  const handleLeaveChat = async () => {
    if (!activeChat || !user) return;
    
    // The warning you requested
    const warning = "After leaving the chat, you won't be able to chat this person for 12 hours. Do you want to proceed?";
    
    if (!window.confirm(warning)) return;
    
    try {
      await updateDoc(doc(db, 'chats', activeChat.id), {
        [`leftAt.${user.uid}`]: new Date().toISOString()
      });
      
      setShowMenu(false);
      setActiveChat(null); // Close chat immediately to refresh view
      toast.success("You left the chat. 12h cooldown applied.");
    } catch (error) {
      toast.error("Failed to leave chat");
    }
  };

  // Firestore Listeners
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(data);
      // Update active chat if data changes (e.g., status or leftAt)
      if (activeChat) {
        const updated = data.find(c => c.id === activeChat.id);
        if (updated) setActiveChat(updated);
      }
    });
  }, [user, activeChat?.id]);

  useEffect(() => {
    if (!activeChat) return;
    const q = query(collection(db, 'chats', activeChat.id, 'messages'), orderBy('timestamp', 'asc'), limit(50));
    return onSnapshot(q, (s) => setMessages(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [activeChat?.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || cooldown.isRestricted) return;
    const text = inputText; 
    setInputText('');
    await sendMessage(activeChat.id, user!.uid, text);
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 flex bg-white z-40">
      {/* Sidebar */}
      <div className={`w-full md:w-[380px] border-r flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b">
          <h1 className="text-2xl font-black mb-4">Messages</h1>
          <div className="flex bg-gray-100 p-1 rounded-xl">
             {['all', 'buying', 'selling'].map((type) => (
               <button 
                key={type}
                onClick={() => setChatFilter(type as any)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize ${chatFilter === type ? 'bg-white shadow-sm' : 'text-gray-500'}`}
               >
                 {type}
               </button>
             ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {chats.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => setActiveChat(chat)}
              className={`p-4 mb-2 rounded-2xl cursor-pointer ${activeChat?.id === chat.id ? 'bg-green-50 ring-1 ring-green-100' : 'hover:bg-gray-50'}`}
            >
              <h3 className="font-bold text-sm truncate">{chat.adTitle}</h3>
              <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-gray-50 ${!activeChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* Header */}
            <div className="bg-white border-b p-4 flex justify-between items-center relative z-50">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="md:hidden"><ChevronLeft /></button>
                <div className="font-black">{activeChat.sellerName || "Chat"}</div>
              </div>
              
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded-full">
                  <MoreVertical size={20} />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-xl z-20 py-2">
                      <button onClick={handleLeaveChat} className="w-full px-4 py-2 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <LogOut size={16} /> Leave Chat
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-2xl max-w-[75%] shadow-sm ${msg.senderId === user.uid ? 'bg-green-700 text-white' : 'bg-white border'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Cooldown or Input */}
            {cooldown.isRestricted ? (
              <div className="p-6 bg-amber-50 border-t border-amber-100 flex flex-col items-center">
                <ShieldAlert className="text-amber-600 mb-2" />
                <p className="text-xs font-black uppercase text-amber-900">Cooldown Active</p>
                <p className="text-[10px] text-amber-700">You can message this person again in {cooldown.remainingHours} hours.</p>
              </div>
            ) : (
              <div className="p-4 bg-white border-t">
                <form onSubmit={handleSend} className="flex gap-2">
                  <input 
                    value={inputText} 
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-50 border rounded-xl px-4 py-2 outline-none"
                  />
                  <button type="submit" className="bg-green-700 text-white p-3 rounded-xl"><Send size={20}/></button>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="text-gray-400 font-bold">Select a conversation</div>
        )}
      </div>
    </div>
  );
}