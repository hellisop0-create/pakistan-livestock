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
  const [openSidebarMenu, setOpenSidebarMenu] = useState<string | null>(null);
  const [chatFilter, setChatFilter] = useState<'all' | 'buying' | 'selling'>('all');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // FIXED COOLDOWN LOGIC: Handles potential nulls and date formats safely
  const getCooldownStatus = (chat: any) => {
    if (!chat?.leftAt || !user?.uid || !chat.leftAt[user.uid]) {
      return { isRestricted: false, remainingHours: 0 };
    }
    
    const userLeftAt = chat.leftAt[user.uid];
    const leftTime = new Date(userLeftAt).getTime();
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    const now = Date.now();
    
    const diff = now - leftTime;
    const isRestricted = diff < TWELVE_HOURS;
    const remainingHours = Math.ceil((TWELVE_HOURS - diff) / (1000 * 60 * 60));

    return { isRestricted, remainingHours: remainingHours > 0 ? remainingHours : 0 };
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (!window.confirm("Delete this chat permanently?")) return;

    try {
      const messagesSnapshot = await getDocs(collection(db, 'chats', chatId, 'messages'));
      const batch = writeBatch(db);
      messagesSnapshot.docs.forEach((msg) => batch.delete(msg.ref));
      await batch.commit();
      await deleteDoc(doc(db, 'chats', chatId));
      if (activeChat?.id === chatId) setActiveChat(null);
      setOpenSidebarMenu(null);
      toast.success("Chat deleted");
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const handleBlockChat = async () => {
    if (!activeChat || !user) return;
    if (!window.confirm("Block this user?")) return;
    try {
      await updateDoc(doc(db, 'chats', activeChat.id), { 
        status: 'blocked', 
        blockedBy: user.uid 
      });
      setShowMenu(false);
      toast.error("User Blocked");
    } catch (error) { toast.error("Action failed"); }
  };

  const handleLeaveChat = async () => {
    if (!activeChat || !user) return;
    if (!window.confirm("Leave chat? You cannot message for 12 hours.")) return;
    
    try {
      // Use Firestore dot notation for nested map update
      await updateDoc(doc(db, 'chats', activeChat.id), {
        [`leftAt.${user.uid}`]: new Date().toISOString()
      });
      setShowMenu(false);
      toast.success("12h Cooldown started");
    } catch (error) {
      toast.error("Failed to leave chat");
    }
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const allChats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(allChats);
      
      if (activeChat) {
        const updatedActive = allChats.find(c => c.id === activeChat.id);
        if (updatedActive) setActiveChat(updatedActive);
      }
    });
  }, [user, activeChat?.id]);

  useEffect(() => {
    if (!activeChat?.adId) { setActiveAd(null); return; }
    getDoc(doc(db, 'ads', activeChat.adId)).then(s => s.exists() && setActiveAd(s.data()));
  }, [activeChat?.adId]);

  useEffect(() => {
    if (!activeChat?.id) return;
    const q = query(collection(db, 'chats', activeChat.id, 'messages'), orderBy('timestamp', 'asc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [activeChat?.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const { isRestricted } = getCooldownStatus(activeChat);
    if (!inputText.trim() || isRestricted || activeChat?.status === 'blocked') return;

    const text = inputText; 
    setInputText('');
    await sendMessage(activeChat.id, user.uid, text);
  };

  const filteredChats = chats.filter(chat => {
    if (!user) return false;
    const isSeller = chat.sellerId === user.uid;
    if (chatFilter === 'selling') return isSeller;
    if (chatFilter === 'buying') return !isSeller;
    return true;
  });

  if (!user) return null;

  return (
    <div className="fixed inset-0 flex bg-white z-40 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <div className={`w-full md:w-[380px] border-r border-gray-100 flex flex-col bg-white h-full ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="pt-6 px-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-5">Messages</h1>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setChatFilter('all')} className={`flex-1 py-2 text-[11px] font-black uppercase rounded-lg transition-all ${chatFilter === 'all' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>All</button>
            <button onClick={() => setChatFilter('buying')} className={`flex-1 py-2 text-[11px] font-black uppercase rounded-lg transition-all ${chatFilter === 'buying' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>Buying</button>
            <button onClick={() => setChatFilter('selling')} className={`flex-1 py-2 text-[11px] font-black uppercase rounded-lg transition-all ${chatFilter === 'selling' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>Selling</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredChats.map(chat => (
            <div key={chat.id} onClick={() => setActiveChat(chat)} className={`p-4 mx-3 my-1.5 rounded-2xl cursor-pointer flex gap-4 transition-all ${activeChat?.id === chat.id ? 'bg-green-50 ring-1 ring-green-100' : 'hover:bg-gray-50'}`}>
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold uppercase">{chat.adTitle?.charAt(0) || "C"}</div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className="font-bold truncate text-sm text-gray-900">{chat.adTitle}</h3>
                <p className="text-xs truncate text-gray-500">{chat.lastMessage || "Start a chat"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className={`flex-1 flex flex-col bg-gray-50 h-full relative ${!activeChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {activeChat ? (
          <>
            <div className="bg-white border-b border-gray-100 z-30 flex-shrink-0">
              <div className="px-4 py-3 flex items-center justify-between relative">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveChat(null)} className="md:hidden p-2 -ml-2 text-gray-500"><ChevronLeft /></button>
                  <div className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center font-bold">{(activeChat.sellerName || "S").charAt(0)}</div>
                  <div>
                    <h3 className="font-black text-gray-900 text-sm">{activeChat.sellerName || "User"}</h3>
                    <p className="text-[10px] text-green-600 font-bold uppercase">Online</p>
                  </div>
                </div>
                
                {/* MENU TRIGGER */}
                <div className="relative">
                  <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 relative z-50">
                    <MoreVertical size={20} />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 z-[100]">
                      <button onClick={handleLeaveChat} className="w-full px-4 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                        <LogOut size={16} /> Leave Chat
                      </button>
                      <button onClick={handleBlockChat} className="w-full px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors">
                        <Ban size={16} /> Block User
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isMe = msg.senderId === user.uid;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${isMe ? 'bg-green-700 text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm'}`}>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT / COOLDOWN VIEW */}
            <div className="flex-shrink-0">
              {getCooldownStatus(activeChat).isRestricted ? (
                <div className="p-6 bg-amber-50 border-t flex flex-col items-center">
                  <ShieldAlert className="text-amber-600 mb-2" />
                  <p className="text-xs font-black text-amber-800 uppercase tracking-widest">Cooldown Active</p>
                  <p className="text-[10px] text-amber-700 font-bold mt-1">
                    Available in {getCooldownStatus(activeChat).remainingHours} hours.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-white border-t border-gray-100">
                  <form onSubmit={handleSend} className="flex gap-2">
                    <input 
                      value={inputText} 
                      onChange={(e) => setInputText(e.target.value)} 
                      placeholder="Type a message..." 
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-100 transition-all" 
                    />
                    <button type="submit" disabled={!inputText.trim()} className="bg-green-700 text-white p-3 rounded-xl disabled:bg-gray-200">
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center opacity-40">
            <MessageCircle size={48} className="mx-auto mb-4" />
            <p className="font-bold">Select a chat to begin</p>
          </div>
        )}
      </div>
    </div>
  );
}