import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Heart, Crown, Star } from 'lucide-react';
import { Ad } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { motion } from 'motion/react';

interface AdCardProps {
  ad: any; // Using any to catch all field names
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}

const AdCard: React.FC<AdCardProps> = ({ ad, isFavorite, onToggleFavorite }) => {
  
  // DEBUGGING: This will print your ad data to the console
  // Look for the "DATA CHECK" line in your browser inspect tool
  console.log("DATA CHECK ->", ad.title, ad);

  // Checks for every possible naming convention
  const isGold = 
    ad.isFeatured === true || 
    ad.isFeatured === "true" || 
    ad.featured === true || 
    ad.is_featured === true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "bg-white rounded-xl overflow-hidden border transition-all duration-300 group relative",
        isGold ? "z-10" : "border-gray-200 hover:shadow-xl"
      )}
      // INLINE STYLE: Bypasses Tailwind to force the gold color
      style={isGold ? {
        border: '3px solid #FFD700',
        boxShadow: '0 10px 25px -5px rgba(255, 215, 0, 0.4)',
        transform: 'scale(1.02)'
      } : {}}
    >
      <Link to={`/ad/${ad.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={ad.images?.[0] || 'https://placehold.co/400x300?text=No+Photo'}
            alt={ad.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {isGold && (
            <div className="absolute top-2 left-2 z-20">
              <span className="flex items-center gap-1 bg-yellow-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg border border-white/40 uppercase">
                <Crown className="w-3 h-3 fill-white" />
                Featured
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                {ad.title}
                {isGold && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 animate-pulse" />}
              </h2> 
              <div className="text-xl font-black text-green-700">
                {formatPrice(ad.price)}
              </div>
            </div>
          </div>

          <div className="flex items-center text-gray-500 text-xs">
            <MapPin className="w-3 h-3 mr-1" />
            <span className="truncate">{ad.city}</span>
          </div>
        </div>
      </Link>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFavorite?.(e);
        }}
        className="absolute top-2 right-2 p-2 bg-white/90 rounded-full text-gray-400 z-20 shadow-sm"
      >
        <Heart className={cn("w-5 h-5", isFavorite && "fill-red-500 text-red-500")} />
      </button>
    </motion.div>
  );
};

export default AdCard;