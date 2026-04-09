import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, limit, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Ad } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../lib/utils';
import { getOrCreateChat } from '../lib/chat-service';
import { 
  MapPin, Phone, MessageCircle, MessageSquare, ShieldCheck, Share2, 
  ChevronLeft, ChevronRight, Calendar, Weight, 
  Activity, Info, Crown, Star, Hash, EyeOff 
} from 'lucide-react';
import AdCard from '../components/AdCard';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function AdDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
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
        const adRef = doc(db, 'ads', id);
        const adDoc = await getDoc(adRef);
        
        if (adDoc.exists()) {
          const adData = { id: adDoc.id, ...adDoc.data() } as Ad;
          setAd(adData);
          
          // Increment View Count
          updateDoc(adRef, { viewCount: increment(1) });

          // Fetch Related Ads (Same category, excluding current ad)
          const relatedQuery = query(
            collection(db, 'ads'),
            where('category', '==', adData.category),
            where('status', '==', 'active'),
            limit(10) // Fetch more to filter out current ad
          );
          
          const unsubscribe = onSnapshot(relatedQuery, (snapshot) => {
            const filtered = snapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() } as Ad))
              .filter(a => a.id !== id)
              .slice(0, 4);
            setRelatedAds(filtered);
          });
          
          return () => unsubscribe();
        } else {
          toast.error('Listing not found');
          navigate('/');
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [id, navigate]);

  // Permissions
  const isOwner = user?.uid === ad?.sellerUid;
  const canSeePrivateInfo = isOwner || user?.email === 'hellisop0@gmail.com';
  const isFeatured = ad?.isFeatured || ad?.featured;

  // Contact Logic
  const cleanPhone = ad?.phoneNumber?.replace(/\D/g, '') || '';
  const whatsappLink = ad?.whatsappLink || `https://wa.me/${cleanPhone}`;

  const handleStartChat = async () => {
    if (!user) {
      toast.error("Please login to message the seller");
      return;
    }
    if (isOwner) {
      toast.error("You cannot message yourself");
      return;
    }

    try {
      const chatId = await getOrCreateChat(user.uid, ad.sellerUid, ad.id, ad.title);
      navigate('/messages', { state: { selectedChatId: chatId } });
    } catch (error) {
      toast.error("Could not start chat.");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: ad.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse space-y-8">
      <div className="h-[500px] bg-gray-200 rounded-[3rem]" />
      <div className="h-12 bg-gray-200 w-1/2 rounded-2xl" />
      <div className="grid grid-cols-4 gap-4"><div className="h-24 bg-gray-200 rounded-3xl" /><div className="h-24 bg-gray-200 rounded-3xl" /><div className="h-24 bg-gray-200 rounded-3xl" /><div className="h-24 bg-gray-200 rounded-3xl" /></div>
    </div>
  );

  if (!ad) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 mb-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
          <Link to="/" className="hover:text-green-700 transition-colors">Home</Link>
          <ChevronRight size={10} />
          <span className="text-gray-900">{ad.category}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Media & Description */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 relative group">
              <div className="aspect-[16/10] relative bg-neutral-900 flex items-center justify-center">
                {ad.images?.length > 0 ? (
                  <>
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentImageIndex}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        src={ad.images[currentImageIndex]}
                        className="w-full h-full object-contain"
                      />
                    </AnimatePresence>
                    
                    {ad.images.length > 1 && (
                      <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setCurrentImageIndex(p => (p === 0 ? ad.images.length - 1 : p - 1))}
                          className="p-4 bg-white/10 backdrop-blur-xl text-white rounded-2xl pointer-events-auto hover:bg-green-600 transition-all active:scale-90"
                        >
                          <ChevronLeft />
                        </button>
                        <button 
                          onClick={() => setCurrentImageIndex(p => (p === ad.images.length - 1 ? 0 : p + 1))}
                          className="p-4 bg-white/10 backdrop-blur-xl text-white rounded-2xl pointer-events-auto hover:bg-green-600 transition-all active:scale-90"
                        >
                          <ChevronRight />
                        </button>
                      </div>
                    )}
                    
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                        {ad.images.map((_: any, i: number) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentImageIndex ? 'w-8 bg-green-500' : 'w-2 bg-white/30'}`} />
                        ))}
                    </div>
                  </>
                ) : (
                  <div className="text-white/10 flex flex-col items-center">
                    <MessageSquare size={64} strokeWidth={1} />
                    <span className="mt-4 font-black uppercase tracking-tighter">No Preview Available</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter leading-none">{ad.title}</h1>
                    {isFeatured && (
                      <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 ring-4 ring-amber-50">
                        <Crown size={12} fill="currentColor" /> Featured
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-5 text-sm text-gray-400 font-bold">
                    <span className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg"><MapPin size={16} className="text-green-600" /> {ad.city}</span>
                    <span className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg"><Calendar size={16} /> {new Date(ad.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="md:text-right bg-green-50 p-4 md:p-6 rounded-[2rem] w-full md:w-auto">
                  <div className="text-4xl font-black text-green-700 leading-none">{formatPrice(ad.price)}</div>
                  <div className="text-[10px] font-black text-green-600/50 uppercase tracking-[0.2em] mt-2">Price Negotiable</div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                {[
                  { label: 'Breed', val: ad.breed, icon: Info },
                  { label: 'Age', val: ad.age, icon: Calendar },
                  { label: 'Weight', val: ad.weight, icon: Weight },
                  { label: 'Health', val: ad.healthCondition, icon: Activity },
                ].map((item, idx) => (
                  <div key={idx} className="bg-gray-50/50 border border-gray-100 p-5 rounded-[2rem] hover:bg-white hover:shadow-xl hover:shadow-gray-100 transition-all group">
                    <item.icon className="w-6 h-6 mb-3 text-green-600 group-hover:scale-110 transition-transform" />
                    <p className="text-[9px] uppercase font-black text-gray-400 mb-1 tracking-widest">{item.label}</p>
                    <p className="font-bold text-gray-800">{item.val || 'N/A'}</p>
                  </div>
                ))}
              </div>

              <div className="relative pt-8 border-t border-gray-100">
                <h3 className="text-xl font-black text-gray-900 mb-5 flex items-center gap-3">
                    <div className="w-2 h-6 bg-green-600 rounded-full" />
                    Seller Description
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-wrap">{ad.description}</p>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Actions */}
          <div className="space-y-6">
            
            {/* Management Panel */}
            {canSeePrivateInfo && (
              <div className="bg-neutral-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-gray-200">
                <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest mb-6 text-green-400">
                  <ShieldCheck size={18} /> Owner Controls
                </div>
                <div 
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 flex justify-between items-center group cursor-copy active:bg-white/10 transition-colors"
                    onClick={() => { navigator.clipboard.writeText(ad.id); toast.success("ID Copied"); }}
                >
                  <div>
                    <p className="text-[9px] font-black uppercase text-neutral-500 mb-1">Listing Reference</p>
                    <p className="font-mono font-bold text-lg tracking-tighter uppercase">{ad.id.slice(0, 12)}...</p>
                  </div>
                  <Hash size={20} className="text-neutral-600 group-hover:text-green-500 transition-colors" />
                </div>
                {ad.hidePhoneNumber && (
                  <div className="mt-5 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-[11px] text-amber-200 leading-tight font-medium">
                    <EyeOff size={18} className="flex-shrink-0" /> 
                    <span>Privacy Mode: Your phone number is only visible to you. Buyers must use internal chat.</span>
                  </div>
                )}
              </div>
            )}

            {/* Seller Contact Card */}
            <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-gray-100 sticky top-24">
              <div className="flex items-center gap-5 mb-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-800 text-white flex items-center justify-center font-black text-2xl shadow-xl ring-4 ring-green-50">
                  {ad.sellerName?.charAt(0) || 'M'}
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-xl leading-none mb-2">{ad.sellerName}</h3>
                  <div className="flex items-center gap-1.5 text-green-600">
                    <ShieldCheck size={14} fill="currentColor" className="opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Verified Trader</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {!isOwner && (
                  <button 
                    onClick={handleStartChat}
                    className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95 group"
                  >
                    <MessageSquare size={22} className="group-hover:rotate-12 transition-transform" /> Chat with Seller
                  </button>
                )}

                {(!ad.hidePhoneNumber || canSeePrivateInfo) ? (
                  <>
                    <a 
                      href={whatsappLink} target="_blank" rel="noreferrer"
                      className="w-full bg-emerald-500 text-white py-5 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 active:scale-95"
                    >
                      <MessageCircle size={22} /> WhatsApp
                    </a>
                    <a 
                      href={`tel:${ad.phoneNumber}`}
                      className="w-full bg-gray-900 text-white py-5 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95"
                    >
                      <Phone size={22} /> {ad.phoneNumber}
                    </a>
                  </>
                ) : (
                  <div className="p-8 bg-neutral-50 rounded-[2.5rem] text-center border-2 border-dashed border-neutral-200">
                    <EyeOff size={28} className="mx-auto mb-3 text-neutral-300" />
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-relaxed px-4">Number Hidden by Seller</p>
                  </div>
                )}

                <button onClick={handleShare} className="w-full pt-6 text-[10px] font-black text-gray-300 hover:text-green-600 transition-colors flex items-center justify-center gap-2 uppercase tracking-[0.2em]">
                  <Share2 size={16} /> Share This Ad
                </button>
              </div>
            </div>

            {/* Safety Tips */}
            <div className="bg-amber-50/50 border border-amber-100 rounded-[2.5rem] p-8">
              <div className="flex items-center gap-2 text-amber-700 font-black text-[10px] uppercase tracking-widest mb-5">
                <ShieldCheck size={16} /> Safety Guidelines
              </div>
              <ul className="text-[11px] text-amber-800/70 space-y-3 font-bold leading-relaxed">
                <li className="flex gap-2"><span>•</span> Inspect animal health personally.</li>
                <li className="flex gap-2"><span>•</span> Never send advance payments.</li>
                <li className="flex gap-2"><span>•</span> Meet in public marketplaces.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Similar Listings */}
        {relatedAds.length > 0 && (
          <div className="mt-32">
            <div className="flex items-end justify-between mb-12 px-4">
                <div>
                    <p className="text-green-600 font-black text-[10px] uppercase tracking-[0.3em] mb-2">Explore More</p>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">Similar Listings</h2>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedAds.map(item => <AdCard key={item.id} ad={item} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}