import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, query, where, orderBy, onSnapshot, 
  limit, doc, writeBatch, getDocs, getDoc, updateDoc, arrayRemove, deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { sendMessage } from '../lib/chat-service';
import { 
  Send, ChevronLeft, MessageCircle, 
  MoreVertical, Check, CheckCheck, ExternalLink,
  Ban, LogOut, ShieldAlert, Trash2, ShoppingBag, Tag, Inbox, UserMinus, AlertTriangle
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

export default function Messages() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [activeAd, setActiveAd] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false); // Controls the Header 3-dot menu
  const [openSidebarMenu, setOpenSidebarMenu] = useState(null);
  const [chatFilter, setChatFilter] = useState('all');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Logic to Leave Chat (Safety Feature)
  const handleLeaveChat = async () => {
    if (!activeChat || !user) return;
    
    const confirmLeave = window.confirm(
      "Are you sure you want to leave? \n\nThis will remove the chat from your inbox and block further messages from this user."
    );

    if (confirmLeave) {
      try {
        await updateDoc(doc(db, 'chats', activeChat.id), { 
          participants: arrayRemove(user.uid),
          status: 'left',
          leftBy: user.uid
        });
        
        setActiveChat(null);
        setShowMenu(false);
        toast.success("Conversation ended safely.");
      } catch (error) { 
        toast.error("Failed to leave chat"); 
      }
    }
  };

  // Rest of your existing logic (Delete, Block, Fetching)
  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    if (!window.confirm("Delete permanently?")) return;
    try {
      const messagesSnapshot = await getDocs(collection(db, 'chats', chatId, 'messages'));
      const batch = writeBatch(db);
      messagesSnapshot.docs.forEach((msg) => batch.delete(msg.ref));
      await batch.commit();
      await deleteDoc(doc(db, 'chats', chatId));
      if (activeChat?.id === chatId) setActiveChat(null);
      setOpenSidebarMenu(null);
      toast.success("Deleted");
    } catch (error) { toast.error("Error"); }
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [user]);

  useEffect(() => {
    if (!activeChat) return;
    const q = query(collection(db, 'chats', activeChat.id, 'messages'), orderBy('timestamp', 'asc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [activeChat]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat || activeChat.status === 'blocked' || activeChat.status === 'left') return;
    const text = inputText; setInputText('');
    await sendMessage(activeChat.id, user.uid, text);
  };

  const filteredChats = chats.filter(chat => {
    if (chatFilter === 'all') return true;
    return chatFilter === 'selling' ? chat.sellerId === user.uid : chat.sellerId !== user.uid;
  });

  if (!user) return null;

  return (
    <div className="fixed inset-0 flex bg-white z-40">
      {/* Sidebar with Tabs */}
      <div className={`w-full md:w-[380px] border-r flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 pb-4">
          <h1 className="text-2xl font-black mb-4">Messages</h1>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {['all', 'buying', 'selling'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setChatFilter(tab)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${chatFilter === tab ? 'bg-white shadow-sm text-green-700' : 'text-gray-500'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredChats.map(chat => (
            <div key={chat.id} onClick={() => setActiveChat(chat)} className={`p-4 mx-2 my-1 rounded-2xl cursor-pointer flex gap-4 hover:bg-gray-50 ${activeChat?.id === chat.id ? 'bg-green-50 ring-1 ring-green-100' : ''}`}>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 uppercase">{chat.adTitle?.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate text-sm">{chat.adTitle}</h3>
                <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-gray-50 ${!activeChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* Header with THE NEW OPTION */}
            <div className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="md:hidden p-2"><ChevronLeft /></button>
                <div className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center font-bold">{(activeChat.sellerName || "S").charAt(0)}</div>
                <h3 className="font-black text-gray-900">{activeChat.sellerName || "User"}</h3>
              </div>

              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <MoreVertical className="text-gray-400" />
                </button>
                
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-2xl py-2 z-20 overflow-hidden">
                      <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Safety & Privacy</div>
                      
                      {/* LEAVE CHAT OPTION */}
                      <button onClick={handleLeaveChat} className="w-full px-4 py-3 text-left text-sm font-bold text-orange-600 hover:bg-orange-50 flex items-center gap-3">
                        <LogOut size={16} /> Leave Conversation
                      </button>
                      
                      <button onClick={handleLeaveChat} className="w-full px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 border-t">
                        <AlertTriangle size={16} /> Report & Leave
                      </button>

                      <button onClick={() => {}} className="w-full px-4 py-3 text-left text-sm font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-3 border-t">
                        <Ban size={16} /> Block User
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${msg.senderId === user.uid ? 'bg-green-700 text-white rounded-br-none' : 'bg-white border rounded-bl-none shadow-sm'}`}>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input logic handling "Left Chat" status */}
            {activeChat.status === 'left' ? (
              <div className="p-6 bg-gray-100 text-gray-500 border-t flex flex-col items-center gap-1">
                <p className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <UserMinus size={14}/> Conversation Ended
                </p>
                <p className="text-[10px]">You or the other user has left this chat.</p>
              </div>
            ) : (
              <div className="p-4 bg-white border-t">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3">
                  <input value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type a message..." className="flex-1 bg-gray-50 border rounded-2xl px-4 py-3 outline-none" />
                  <button type="submit" className="bg-green-700 text-white p-4 rounded-2xl shadow-lg hover:bg-green-800 transition-all"><Send size={20} /></button>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="text-center opacity-20"><MessageCircle size={80} className="mx-auto mb-4 text-green-700" /><p className="font-black uppercase tracking-widest text-sm">Select a Conversation</p></div>
        )}
      </div>
    </div>
  );
}