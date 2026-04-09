import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, query, where, orderBy, onSnapshot, 
  limit, doc, writeBatch, getDocs, getDoc, updateDoc, arrayRemove 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { sendMessage } from '../lib/chat-service';
import { 
  Send, ChevronLeft, MessageCircle, Search, 
  MoreVertical, Check, CheckCheck, ExternalLink, MapPin,
  Ban, LogOut, ShieldAlert
} from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

export default function Messages() {
  const { user } = useAuth();
  const location = useLocation();
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [activeAd, setActiveAd] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false); // Controls the 3-dot dropdown
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // --- MODERATION ACTIONS ---

  const handleBlockChat = async () => {
    if (!activeChat || !user) return;
    if (!window.confirm("Block this user? You won't receive further messages from them in this chat.")) return;
    
    try {
      await updateDoc(doc(db, 'chats', activeChat.id), {
        status: 'blocked',
        blockedBy: user.uid
      });
      toast.error("User Blocked");
      setShowMenu(false);
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const handleLeaveChat = async () => {
    if (!activeChat || !user) return;
    if (!window.confirm("Leave this conversation? It will be hidden from your list.")) return;

    try {
      await updateDoc(doc(db, 'chats', activeChat.id), {
        participants: arrayRemove(user.uid)
      });
      setActiveChat(null);
      toast.success("Conversation removed");
      setShowMenu(false);
    } catch (error) {
      toast.error("Action failed");
    }
  };

  // --- DATA SYNC ---

  useEffect(() => {
    if (!activeChat || !user) return;
    const markAsRead = async () => {
      const q = query(
        collection(db, 'chats', activeChat.id, 'messages'),
        where('senderId', '!=', user.uid),
        where('status', '!=', 'seen')
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return;
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => batch.update(d.ref, { status: 'seen' }));
      await batch.commit();
    };
    markAsRead();
  }, [activeChat, messages, user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(list);
      const stateId = location.state?.selectedChatId;
      if (stateId && !activeChat) {
        const target = list.find(c => c.id === stateId);
        if (target) setActiveChat(target);
      }
    });
  }, [user, location.state]);

  useEffect(() => {
    if (!activeChat?.adId) { setActiveAd(null); return; }
    const fetchAd = async () => {
      const adDoc = await getDoc(doc(db, 'ads', activeChat.adId));
      if (adDoc.exists()) setActiveAd({ id: adDoc.id, ...adDoc.data() });
    };
    fetchAd();
  }, [activeChat]);

  useEffect(() => {
    if (!activeChat) return;
    const q = query(collection(db, 'chats', activeChat.id, 'messages'), orderBy('timestamp', 'asc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [activeChat]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat || !user || activeChat.status === 'blocked') return;
    const text = inputText; setInputText('');
    await sendMessage(activeChat.id, user.uid, text);
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 flex bg-white z-40">
      {/* Sidebar */}
      <div className={`w-full md:w-[380px] border-r flex flex-col bg-white h-full ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b"><h1 className="text-2xl font-black mb-6">Messages</h1></div>
        <div className="flex-1 overflow-y-auto">
          {chats.map(chat => (
            <div key={chat.id} onClick={() => setActiveChat(chat)} className={`p-4 mx-2 my-1 rounded-2xl cursor-pointer flex gap-4 ${activeChat?.id === chat.id ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center font-bold text-green-700 uppercase">{chat.adTitle?.charAt(0)}</div>
              <div className="flex-1 min-w-0"><h3 className="font-bold truncate text-sm">{chat.adTitle}</h3><p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-gray-50 h-full ${!activeChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* STICKY HEADER WITH 3-DOT MENU */}
            <div className="bg-white border-b shadow-sm z-30">
              <div className="px-6 py-3 border-b flex items-center justify-between relative">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveChat(null)} className="md:hidden p-2 -ml-2"><ChevronLeft /></button>
                  <div className="w-9 h-9 rounded-lg bg-green-700 text-white flex items-center justify-center font-bold">{(activeChat.sellerName || "S").charAt(0)}</div>
                  <h3 className="font-black text-gray-900 leading-none">{activeChat.sellerName || "Seller"}</h3>
                </div>

                {/* 3-Dot Dropdown Trigger */}
                {/* 3-Dot Dropdown Trigger */}
<div className="relative">
  <button 
    onClick={(e) => {
      e.stopPropagation(); // Prevents clicking the button from immediately closing the menu via the parent onClick
      setShowMenu(!showMenu);
    }} 
    className="p-2 hover:bg-gray-100 rounded-full transition-colors relative z-40"
  >
    <MoreVertical className="w-5 h-5 text-gray-400" />
  </button>
  
  {showMenu && (
    <>
      {/* Invisible Overlay to close menu when clicking anywhere else */}
      <div 
        className="fixed inset-0 z-[90]" 
        onClick={() => setShowMenu(false)} 
      />
      
      {/* The Actual Dropdown Box */}
      <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-2xl py-2 z-[100] overflow-hidden">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleLeaveChat();
          }} 
          className="w-full px-4 py-3 text-left text-sm font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-colors"
        >
          <LogOut size={16} className="text-gray-400" /> 
          Leave Conversation
        </button>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleBlockChat();
          }} 
          className="w-full px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 border-t border-gray-100 transition-colors"
        >
          <Ban size={16} className="text-red-500" /> 
          Block User
        </button>
      </div>
    </>
  )}
</div>

              {/* Rich Ad Preview */}
              {activeAd && (
                <div className="px-6 py-4 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                      <img src={activeAd.images?.[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-gray-900 truncate uppercase tracking-tighter">{activeAd.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-lg font-black text-green-700 leading-none">Rs. {activeAd.price?.toLocaleString()}</span>
                        <span className="text-[10px] flex items-center gap-0.5 text-gray-400 font-bold uppercase"><MapPin size={10} /> {activeAd.city}</span>
                      </div>
                    </div>
                  </div>
                  <Link 
                    to={`/ad/${activeAd.id}`} 
                    className="bg-green-700 text-white px-4 py-2.5 rounded-xl text-[10px] font-black flex items-center gap-2 shadow-lg shadow-green-100 hover:scale-105 transition-all"
                  >
                    VIEW FULL AD <ExternalLink size={12} />
                  </Link>
                </div>
              )}
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4" onClick={() => setShowMenu(false)}>
              {messages.map((msg) => {
                const isMe = msg.senderId === user.uid;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl ${isMe ? 'bg-green-700 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-sm'}`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className={`text-[9px] font-bold ${isMe ? 'text-green-100' : 'text-gray-400'}`}>
                          {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          msg.status === 'seen' ? <CheckCheck size={14} className="text-blue-400" /> : <Check size={14} className="text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUTBAR OR BLOCKED STATUS */}
            {activeChat.status === 'blocked' ? (
              <div className="p-6 bg-red-50 text-red-700 border-t flex items-center justify-center gap-3">
                <ShieldAlert size={20} />
                <p className="font-black text-xs uppercase tracking-widest text-center">
                  This conversation is blocked and no longer accepting messages.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-white border-t">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3">
                  <input 
                    value={inputText} 
                    onChange={(e) => setInputText(e.target.value)} 
                    placeholder="Type a message..." 
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 outline-none text-sm focus:ring-2 focus:ring-green-100 transition-all" 
                  />
                  <button type="submit" className="bg-green-700 text-white p-4 rounded-2xl shadow-lg shadow-green-100 active:scale-95 transition-all">
                    <Send size={20} />
                  </button>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="text-center opacity-20">
            <MessageCircle size={80} className="mx-auto mb-4 text-green-700" />
            <p className="font-black uppercase tracking-widest text-sm text-gray-600">Start a negotiation</p>
          </div>
        )}
      </div>
    </div>
  );
}