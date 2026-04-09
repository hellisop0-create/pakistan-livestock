import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, limit, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Ad } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../lib/utils';
import { getOrCreateChat } from '../lib/chat-service';
import { 
  MapPin, Phone, MessageCircle, MessageSquare, ShieldCheck, Share2, 
  ChevronLeft, ChevronRight, Calendar, Weight, 
  Activity, Info, Crown, Hash, EyeOff, ExternalLink
} from 'lucide-react';
import AdCard from '../components/AdCard';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function AdDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ad, setAd] = useState<any | null>(null);
  const [relatedAds, setRelatedAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    const fetchAd = async () => {
      setLoading(true);
      try {
        const adDoc = await getDoc(doc(db, 'ads', id));
        if (adDoc.exists()) {
          const adData = { id: adDoc.id, ...adDoc.data() } as Ad;
          setAd(adData);
          await updateDoc(doc(db, 'ads', id), { viewCount: increment(1) });
          const relatedQuery = query(collection(db, 'ads'), where('category', '==', adData.category), where('status', '==', 'active'), limit(5));
          const unsubscribe = onSnapshot(relatedQuery, (snapshot) => {
            setRelatedAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad)).filter(a => a.id !== id).slice(0, 4));
          });
          return () => unsubscribe();
        } else {
          toast.error('Ad not found');
          navigate('/');
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchAd();
  }, [id, navigate]);

  const handleStartChat = async () => {
    if (!user) { toast.error("Please login to message the seller"); return; }
    try {
      const chatId = await getOrCreateChat(user.uid, ad.sellerUid, ad.id, ad.title, ad.sellerName || "Seller");
      navigate('/messages', { state: { selectedChatId: chatId } });
    } catch (error) { toast.error("Could not start chat."); }
  };

  if (loading) return <div className="p-12 animate-pulse bg-gray-100 min-h-screen" />;
  if (!ad) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-200">
              <div className="aspect-[16/10] bg-black flex items-center justify-center relative">
                {ad.images?.[currentImageIndex] && <img src={ad.images[currentImageIndex]} className="max-h-full object-contain" />}
              </div>
            </div>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-200">
              <h1 className="text-3xl font-black mb-4">{ad.title}</h1>
              <div className="text-4xl font-black text-green-700 mb-6">{formatPrice(ad.price)}</div>
              <p className="text-gray-600 whitespace-pre-wrap">{ad.description}</p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-200 sticky top-24">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-green-700 text-white flex items-center justify-center font-black text-xl">
                  {ad.sellerName?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-gray-900">{ad.sellerName}</h3>
                  <p className="text-xs font-bold text-green-600 uppercase">Verified Seller</p>
                </div>
              </div>
              <div className="space-y-3">
                {user?.uid !== ad.sellerUid && (
                  <button onClick={handleStartChat} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3">
                    <MessageSquare size={20} /> Start Internal Chat
                  </button>
                )}
                <a href={`https://wa.me/${ad.phoneNumber}`} className="w-full bg-green-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3"><MessageCircle size={20} /> WhatsApp</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}