import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, limit, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Ad } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrice, cn } from '../lib/utils';
import { 
  MapPin, Phone, MessageCircle, ShieldCheck, Share2, 
  ChevronLeft, ChevronRight, Flag, Calendar, Weight, 
  Activity, Info, Crown, Star 
} from 'lucide-react';
import AdCard from '../components/AdCard';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function AdDetail() {
  const { id } = useParams<{ id: string }>();
  const [ad, setAd] = useState<any | null>(null);
  const [relatedAds, setRelatedAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    const fetchAd = async () => {
      setLoading(true);
      try {
        const adDoc = await getDoc(doc(db, 'ads', id));
        if (adDoc.exists()) {
          const adData = { id: adDoc.id, ...adDoc.data() };
          setAd(adData);
          
          await updateDoc(doc(db, 'ads', id), { viewCount: increment(1) });

          const relatedQuery = query(
            collection(db, 'ads'),
            where('category', '==', adData.category),
            where('status', '==', 'active'),
            limit(4)
          );
          const unsubscribe = onSnapshot(relatedQuery, (snapshot) => {
            setRelatedAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad)).filter(a => a.id !== id));
          });
          return () => unsubscribe();
        } else {
          toast.error('Ad not found');
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching ad:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-96 bg-gray-200 rounded-2xl mb-8"></div>
        <div className="h-10 bg-gray-200 w-3/4 rounded mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!ad) return null;

  // --- DATA FIX: This handles all possible naming styles from Firebase ---
  const isGold = ad.isFeatured === true || ad.isFeatured === "true" || ad.is_featured === true || ad.featured === true;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: ad.title,
        text: ad.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-6 text-sm text-gray-500">
          <Link to="/" className="hover:text-green-700">Home</Link>
          <span className="mx-2">/</span>
          <Link to={`/browse?category=${ad.category}`} className="hover:text-green-700 capitalize">{ad.category}</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium truncate">{ad.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 relative group">
              <div className="aspect-video relative bg-black flex items-center justify-center">
                {ad.images && ad.images.length > 0 ? (
                  <>
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentImageIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        src={ad.images[currentImageIndex]}
                        alt={ad.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    </AnimatePresence>
                    {ad.images.length > 1 && (
                      <>
                        <button onClick={() => setCurrentImageIndex((p) => (p === 0 ? ad.images.length - 1 : p - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 rounded-full text-white"><ChevronLeft /></button>
                        <button onClick={() => setCurrentImageIndex((p) => (p === ad.images.length - 1 ? 0 : p + 1))} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 rounded-full text-white"><ChevronRight /></button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-gray-500 flex flex-col items-center"><Info className="mb-2 opacity-20" /> No Photos</div>
                )}
              </div>
            </div>

            {/* Ad Info Section */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h1 className="text-3xl font-bold text-gray-900">{ad.title}</h1>
                  {isGold && (
                    <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-amber-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-sm uppercase">
                      <Crown className="w-3.5 h-3.5 fill-white" />
                      Featured
                    </div>
                  )}
                </div>

                <div className="text-3xl font-black text-green-700 mb-4 flex items-center gap-2">
                  {formatPrice(ad.price)}
                  {isGold && <Star className="w-6 h-6 text-yellow-500 fill-yellow-500 animate-pulse" />}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm">
                  {ad.isUrgent && <span className="bg-red-100 text-red-600 px-2 py-1 rounded font-bold">URGENT</span>}
                  <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {ad.city}</span>
                  <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {new Date(ad.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                  <Info className="w-5 h-5 mx-auto mb-2 text-green-600" />
                  <div className="text-xs text-gray-500 uppercase font-bold">Breed</div>
                  <div className="font-semibold">{ad.breed}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                  <Calendar className="w-5 h-5 mx-auto mb-2 text-green-600" />
                  <div className="text-xs text-gray-500 uppercase font-bold">Age</div>
                  <div className="font-semibold">{ad.age}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                  <Weight className="w-5 h-5 mx-auto mb-2 text-green-600" />
                  <div className="text-xs text-gray-500 uppercase font-bold">Weight</div>
                  <div className="font-semibold">{ad.weight}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                  <Activity className="w-5 h-5 mx-auto mb-2 text-green-600" />
                  <div className="text-xs text-gray-500 uppercase font-bold">Health</div>
                  <div className="font-semibold">{ad.healthCondition}</div>
                </div>
              </div>

              <div className="prose max-w-none">
                <h3 className="text-xl font-bold mb-4">Description</h3>
                <p className="whitespace-pre-wrap text-gray-700">{ad.description}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-bold mb-6">Seller Details</h3>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 text-xl">
                  {ad.sellerName.charAt(0)}
                </div>
                <div>
                  <div className="font-bold flex items-center">{ad.sellerName} <ShieldCheck className="w-4 h-4 text-blue-500 ml-1" /></div>
                  <div className="text-xs text-gray-500">Verified Seller</div>
                </div>
              </div>
              <div className="space-y-3">
                <a href={ad.whatsappLink} target="_blank" className="w-full bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"><MessageCircle /> WhatsApp</a>
                <a href={`tel:${ad.phoneNumber}`} className="w-full border-2 border-green-600 text-green-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2"><Phone /> Call</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}