import { useEffect, useState } from 'react';
import { db } from '../firebase';
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
      const adRef = doc(db, "advertisements", ad.id);
      await updateDoc(adRef, {
        clickCount: increment(1)
      });
      window.open(ad.targetUrl, '_blank');
    }
  };

  if (loading || !ad) return null;

  return (
    /* REMOVED the outer <div> and my-4. 
       Changed h-32 md:h-40 to h-full so it listens to the parent container.
    */
    <button
      onClick={handleAdClick}
      className="w-full h-full relative rounded-xl overflow-hidden bg-white flex items-center justify-center transition-transform active:scale-[0.98]"
    >
      <img
        src={ad.imageUrl}
        alt={ad.title || "Advertisement"}
        /* 'object-contain' is the magic fix: 
           it shows the WHOLE image without zooming or cropping.
           'w-full h-full' ensures it uses the container's space.
        */
        className="w-full h-full object-contain mx-auto"
      />
      <div className="absolute top-2 right-2 bg-black/20 backdrop-blur-sm text-[10px] text-white px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold">
        Ad
      </div>
    </button>
  );
};

export default AdBanner;