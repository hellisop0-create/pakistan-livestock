import { useEffect, useState } from 'react';
import { db } from '../firebase'; // Import your firebase config
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';

const AdBanner = ({ location }) => {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const adsRef = collection(db, "advertisements");
        const q = query(
          adsRef, 
          where("location", "==", location), 
          where("isActive", "==", true)
        );
        
        const querySnapshot = await getDocs(q);
        const adsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (adsList.length > 0) {
          // If you have multiple ads for one spot, this picks one at random
          const randomAd = adsList[Math.floor(Math.random() * adsList.length)];
          setAd(randomAd);
        }
      } catch (error) {
        console.error("Error fetching ad:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [location]);

  const handleAdClick = async () => {
    if (ad) {
      // 1. Update the click count in Firestore
      const adRef = doc(db, "advertisements", ad.id);
      await updateDoc(adRef, {
        clickCount: increment(1)
      });

      // 2. Open the client's link (WhatsApp, etc.)
      window.open(ad.targetUrl, '_blank');
    }
  };

  if (loading || !ad) return null;

  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 my-6">
      <div 
        onClick={handleAdClick}
        className="relative cursor-pointer group overflow-hidden rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md"
      >
        <img 
          src={ad.imageUrl} 
          alt={ad.title} 
          className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white uppercase tracking-wider">
          Sponsored
        </div>
      </div>
    </div>
  );
};

export default AdBanner;