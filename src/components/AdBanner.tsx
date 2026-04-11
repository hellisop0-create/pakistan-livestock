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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
      <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-gray-50 flex items-center justify-center h-40 md:h-64">
        {/* The 'h-40 md:h-64' sets a standard height for the ad box */}
        
        <img 
          src={ad.imageUrl} 
          alt={ad.title} 
          className="w-full h-full object-cover"
          /* 'object-contain' ensures the image fits inside without being cropped */
        />
      </div>
    </div>
  );
};

export default AdBanner;