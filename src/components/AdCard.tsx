import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Heart, Crown, Star } from 'lucide-react';
import { formatPrice, cn } from '../lib/utils';
import { motion } from 'motion/react';

interface AdCardProps {
  ad: any; 
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  isHorizontal?: boolean; // Added only the necessary prop
}

const AdCard: React.FC<AdCardProps> = ({ ad, isFavorite = false, onToggleFavorite, isHorizontal = false }) => {
  
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
        // Logic added for horizontal layout
        isHorizontal ? "flex flex-row h-32 md:h-36" : "flex flex-col",
        isGold ? "z-10" : "border-gray-200 hover:shadow-xl"
      )}
      style={isGold ? {
        border: '3px solid #FFD700',
        boxShadow: '0 10px 25px -5px rgba(255, 215, 0, 0.3)',
      } : {}}
    >
      {/* HEART TOGGLE BUTTON - Kept exactly as original */}
      <motion.button
        whileTap={{ scale: 0.8 }}
        whileHover={{ scale: 1.1 }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFavorite?.(e);
        }}
        className={cn(
          "absolute top-3 right-3 p-2 rounded-full z-30 shadow-sm transition-all duration-300",
          isFavorite ? "bg-red-50" : "bg-white/80 hover:bg-white"
        )}
      >
        <Heart 
          size={20}
          className={cn(
            "transition-all duration-300",
            isFavorite 
              ? "fill-red-500 text-red-500" 
              : "text-gray-400 fill-transparent hover:text-red-400"
          )} 
        />
      </motion.button>

      <Link to={`/ad/${ad.id}`} className={cn("block w-full", isHorizontal ? "flex flex-row" : "")}>
        {/* IMAGE SECTION */}
        <div className={cn(
          "relative overflow-hidden bg-gray-100 flex-shrink-0",
          isHorizontal ? "w-1/3 md:w-1/4 h-full" : "aspect-[4/3] w-full"
        )}>
          <img
            src={ad.images?.[0] || 'https://placehold.co/400x300?text=No+Photo'}
            alt={ad.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />

          {isGold && (
            <div className="absolute top-3 left-3 z-20">
              <span className="flex items-center gap-1.5 bg-yellow-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg border border-white/20 uppercase tracking-wider">
                <Crown className="w-3 h-3 fill-white" />
                {isHorizontal ? "" : "Featured"}
              </span>
            </div>
          )}
        </div>

        {/* DETAILS SECTION */}
        <div className={cn("p-4 flex flex-col justify-between flex-1 min-w-0")}>
          <div className="flex justify-between items-start mb-2">
            <div className="w-full">
              <h2 className="text-base font-bold flex items-center gap-2 text-gray-900 truncate pr-6">
                {ad.title}
                {isGold && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 animate-pulse" />}
              </h2> 
              <div className="text-xl font-black text-green-700 mt-1">
                {formatPrice(ad.price)}
              </div>
            </div>
          </div>

          <div className={cn(
            "flex items-center text-gray-500 text-xs",
            isHorizontal ? "mt-auto pt-2 border-t border-gray-50" : "mt-3 pt-3 border-t border-gray-50"
          )}>
            <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            <span className="truncate font-medium">{ad.city || 'Location N/A'}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default AdCard;