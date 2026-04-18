import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, limit, onSnapshot, orderBy } from 'firebase/firestore';

export default function PromotionalBanner() {
  const [ad, setAd] = useState<any>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'advertisements'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) setAd({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      else setAd(null);
    });
    return () => unsubscribe();
  }, []);

  if (!ad) return null;

  return (
    /* This is your original container logic, now sized at h-32/h-40 */
    <a
      href={ad.targetUrl || "#"}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className="block relative w-full h-32 md:h-40 mb-10 rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white"
    >
      <img
        src={ad.imageUrl}
        alt="Ad"
        className="w-full h-full object-contain mx-auto"
      />
      <div className="absolute top-2 right-2 bg-black/10 backdrop-blur-sm text-[10px] text-gray-500 px-1.5 py-0.5 rounded uppercase font-semibold">
        Ad
      </div>
    </a>
  );
}