import React, { useState, useEffect, useRef } from 'react';
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
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

export default function Messages() {
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [activeAd, setActiveAd] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [openSidebarMenu, setOpenSidebarMenu] = useState<string | null>(null);
  const [chatFilter, setChatFilter] = useState<'all' | 'buying' | 'selling'>('all');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // --- 1. COOLDOWN LOGIC (Ensuring 'user' is accessible) ---
  const getCooldownStatus = (chat: any) => {
    if (!chat?.leftAt || !user?.uid || !chat.leftAt[user.uid]) {
      return { isRestricted: false, remainingHours: 0 };
    }

    const leftTime = new Date(chat.leftAt[user.uid]).getTime();
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    const now = Date.now();
    
    const diff = now - leftTime;
    const isRestricted = diff < TWELVE_HOURS;
    const remainingHours = Math.ceil((TWELVE_HOURS - diff) / (1000 * 60 * 60));

    return { isRestricted, remainingHours };
  };

  // --- 2. LEAVE CHAT WITH POPUP WARNING ---
  const handleLeaveChat = async () => {
    if (!activeChat || !user) return;
    
    const warningText = "After leaving the chat, you won't be able to chat this person for 12 hours. Do you want to proceed?";
    
    if (window.confirm(warningText)) {
      try {
        await updateDoc(doc(db, 'chats', activeChat.id), {
          [`leftAt.${user.uid}`]: new Date().toISOString()
        });
        setActiveChat(null);
        setShowMenu(false);
        toast.success("You left the chat. 12h cooldown active.");
      } catch (error) {
        toast.error("Action failed. Check database permissions.");
      }
    }
  };

  const handleBlockChat = async () => {
    if (!activeChat || !user) return;
    if (!window.confirm("Block this user?")) return;
    try {
      await updateDoc(doc(db, 'chats', activeChat.id), { status: 'blocked', blockedBy: user.uid });
      toast.error("User Blocked");
      setShowMenu(false);
    } catch (error) { toast.error("Action failed"); }
  };

  // Firestore Sync
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const updatedChats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(updatedChats);
      // Update active chat details in real-time if it changes in DB
      if (activeChat) {
        const current = updatedChats.find(c => c.id === activeChat.id);
        if (current) setActiveChat(current);
      }
    });
  }, [user, activeChat?.id]);

  useEffect(() => {
    if (!activeChat?.adId) { setActiveAd(null); return; }
    getDoc(doc(db, 'ads', activeChat.adId)).then(s => s.exists() && setActiveAd(s.data()));
  }, [activeChat?.adId]);

  useEffect(() => {
    if (!activeChat) return;
    const q = query(collection(db, 'chats', activeChat.id, 'messages'), orderBy('timestamp', 'asc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [activeChat?.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const { isRestricted } = getCooldownStatus(activeChat);
    if (!inputText.trim() || isRestricted || activeChat.status === 'blocked') return;
    const text = inputText; 
    setInputText('');
    await sendMessage(activeChat.id, user!.uid, text);
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 flex bg-white z-40 font-sans">
      {/* Sidebar */}
      <div className={`w-full md:w-[380px] border-r border-gray-100 flex flex-col bg-white h-full ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="pt-6 px-6 pb-4 border-b border-gray-100">
          <h1 className="text-2xl font-black text-gray-900 mb-5">Messages</h1>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setChatFilter('all')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${chatFilter === 'all' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>All</button>
            <button onClick={() => setChatFilter('buying')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${chatFilter === 'buying' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Buying</button>
            <button onClick={() => setChatFilter('selling')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${chatFilter === 'selling' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Selling</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map(chat => (
            <div key={chat.id} onClick={() => setActiveChat(chat)} className={`p-4 mx-3 my-1 cursor-pointer rounded-2xl ${activeChat?.id === chat.id ? 'bg-green-50' : ''}`}>
              <p className="font-bold text-sm truncate">{chat.adTitle}</p>
              <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-gray-50 h-full ${!activeChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-100 p-4 flex justify-between items-center z-50">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="md:hidden"><ChevronLeft /></button>
                <div className="font-bold">{activeChat.sellerName || "Chat"}</div>
              </div>
              
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded-full">
                  <MoreVertical size={20} />
                </button>
                
                {/* THIS IS THE MENU SECTION */}
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-[70] py-2">
                      <button onClick={handleLeaveChat} className="w-full px-4 py-2 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <LogOut size={16} /> Leave Chat
                      </button>
                      <button onClick={handleBlockChat} className="w-full px-4 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100">
                        <Ban size={16} /> Block User
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-2xl max-w-[70%] ${msg.senderId === user.uid ? 'bg-green-700 text-white' : 'bg-white border border-gray-200'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* --- INPUT AREA & COOLDOWN BAR --- */}
            {activeChat.status === 'blocked' ? (
              <div className="p-5 bg-red-50 text-red-700 text-center font-bold text-xs uppercase border-t border-red-100">
                <ShieldAlert size={16} className="inline mr-2" /> Chat is blocked
              </div>
            ) : getCooldownStatus(activeChat).isRestricted ? (
              <div className="p-5 bg-amber-50 border-t border-amber-100 flex flex-col items-center">
                <ShieldAlert size={20} className="text-amber-600 mb-1" />
                <p className="text-xs font-black text-amber-900 uppercase">Cooldown Active</p>
                <p className="text-[10px] text-amber-700">
                  Try again in {getCooldownStatus(activeChat).remainingHours} hours.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSend} className="flex gap-2">
                  <input 
                    value={inputText} 
                    onChange={(e) => setInputText(e.target.value)} 
                    placeholder="Type a message..." 
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none"
                  />
                  <button type="submit" className="bg-green-700 text-white p-3 rounded-xl"><Send size={20}/></button>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="text-gray-400">Select a chat to begin</div>
        )}
      </div>
    </div>
  );
}