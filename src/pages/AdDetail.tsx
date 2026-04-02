import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, limit, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Ad } from '../types';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';
import { formatPrice, cn } from '../lib/utils';
import { MapPin, Phone, MessageCircle, ShieldCheck, Share2, ChevronLeft, ChevronRight, Flag, Calendar, Weight, Activity, Info } from 'lucide-react';
import AdCard from '../components/AdCard';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function AdDetail() {
  const { id } = useParams<{ id: string }>();
  const [ad, setAd] = useState<Ad | null>(null);
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
          const adData = { id: adDoc.id, ...adDoc.data() } as Ad;
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="h-10 bg-gray-200 w-3/4 rounded"></div>
            <div className="h-6 bg-gray-200 w-1/4 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!ad) return null;

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
          <Link to={`/browse?category=${ad.category}`} className="hover:text-green-700">{t(ad.category.toLowerCase())}</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium truncate">{ad.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
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
                        referrerPolicy="no-referrer"
                      />
                    </AnimatePresence>
                    
                    {ad.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? ad.images.length - 1 : prev - 1))}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex((prev) => (prev === ad.images.length - 1 ? 0 : prev + 1))}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center text-gray-500">
                    <Info className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm font-medium">No photos uploaded</p>
                  </div>
                )}
              </div>
              
              {ad.images && ad.images.length > 1 && (
                <div className="p-4 flex space-x-2 overflow-x-auto">
                  {ad.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={cn(
                        "w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all",
                        currentImageIndex === idx ? "border-green-600 scale-105" : "border-transparent opacity-70 hover:opacity-100"
                      )}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ad Info */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{ad.title}</h1>
                <div className="text-2xl font-black text-green-700 mb-1">{formatPrice(ad.price)}</div>
                {ad.isUrgent && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">URGENT SALE</span>}
                
                <div className="flex items-center text-gray-500 space-x-4 mt-4">
                  <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {ad.area}, {ad.city}</span>
                  <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {new Date(ad.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                  <Info className="w-5 h-5 mx-auto mb-2 text-green-600" />
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Breed</div>
                  <div className="font-semibold text-gray-800">{ad.breed}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                  <Calendar className="w-5 h-5 mx-auto mb-2 text-green-600" />
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Age</div>
                  <div className="font-semibold text-gray-800">{ad.age}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                  <Weight className="w-5 h-5 mx-auto mb-2 text-green-600" />
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Weight</div>
                  <div className="font-semibold text-gray-800">{ad.weight}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                  <Activity className="w-5 h-5 mx-auto mb-2 text-green-600" />
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Health</div>
                  <div className="font-semibold text-gray-800">{ad.healthCondition}</div>
                </div>
              </div>

              <div className="prose max-w-none text-gray-700">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Description</h3>
                <p className="whitespace-pre-wrap leading-relaxed">{ad.description}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Seller Details</h3>
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-green-700">
                  {ad.sellerName.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg flex items-center">
                    {ad.sellerName}
                    <ShieldCheck className="w-5 h-5 text-blue-500 ml-1" />
                  </div>
                  <div className="text-sm text-gray-500">Member since 2024</div>
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href={ad.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                >
                  <MessageCircle className="w-6 h-6" />
                  <span>Chat on WhatsApp</span>
                </a>
                <a
                  href={`tel:${ad.phoneNumber}`}
                  className="w-full bg-white border-2 border-green-600 text-green-600 py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-green-50 transition-all"
                >
                  <Phone className="w-6 h-6" />
                  <span>Call Seller</span>
                </a>
              </div>
            </div>

            <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
              <h3 className="font-bold text-orange-900 mb-4 flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2" />
                Safety Tips
              </h3>
              <ul className="text-sm text-orange-800 space-y-3 list-disc pl-4">
                <li>Meet the seller in a safe public place or mandi.</li>
                <li>Inspect the animal carefully before paying.</li>
                <li>Avoid paying in advance via Easypaisa/JazzCash.</li>
                <li>Check animal health certificates if available.</li>
              </ul>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleShare}
                className="flex-1 bg-white border border-gray-200 py-3 rounded-xl flex items-center justify-center space-x-2 text-gray-600 hover:bg-gray-50 transition-all"
              >
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </button>
              <button className="flex-1 bg-white border border-gray-200 py-3 rounded-xl flex items-center justify-center space-x-2 text-gray-600 hover:bg-gray-50 transition-all">
                <Flag className="w-5 h-5" />
                <span>Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Related Ads */}
        {relatedAds.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Ads</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedAds.map(ad => (
                <AdCard key={ad.id} ad={ad} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}