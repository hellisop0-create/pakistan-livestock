import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Heart, ShieldCheck, Zap } from 'lucide-react';
import { Ad } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { useLanguage } from '../LanguageContext';
import { motion } from 'motion/react';

interface AdCardProps {
  ad: Ad;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}

const AdCard: React.FC<AdCardProps> = ({ ad, isFavorite, onToggleFavorite }) => {
  const { t, language } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className={cn(
        "bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all group relative",
        ad.isFeatured && "ring-2 ring-orange-400"
      )}
    >
      <Link to={`/ad/${ad.id}`} className="block">
        {/* Image Container */}
<div className="relative aspect-[4/3] overflow-hidden bg-gray-200">
  <img
    src={
      ad.images && ad.images.length > 0 
        ? ad.images[0] 
        : 'https://placehold.co/400x300?text=No+Photo+Uploaded'
    }
    alt={ad.title}
    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    loading="lazy"
    onError={(e) => {
      (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Image+Error';
    }}
  />

  {/* Only show this badge if there are no images, optional but looks good */}
  {!ad.images || ad.images.length === 0 && (
    <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded font-bold">
      NO PHOTO
    </div>
  )}
</div>

        {/* Content */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-gray-800">
                {ad.title}
              </h2> 
              <div className="text-base font-black text-green-700 mb-1">
                {formatPrice(ad.price)}
              </div>
            </div>

            <div className="text-right">
              {ad.isUrgent && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">
                  URGENT SALE
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center text-gray-500 text-xs mb-3">
            <MapPin className="w-3 h-3 mr-1" />
            <span className="truncate">{ad.area}, {ad.city}</span>
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-[10px] font-bold text-green-700">
                {ad.sellerName.charAt(0)}
              </div>
              <span className="text-xs font-medium text-gray-600 truncate max-w-[80px]">
                {ad.sellerName}
              </span>
            </div>
            <span className="text-[10px] text-gray-400">
              {new Date(ad.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Link>

      {/* Badges */}
      <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
        {ad.isFeatured && (
          <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-sm">
            <Zap className="w-3 h-3 fill-current" />
            FEATURED
          </span>
        )}
        {ad.isUrgent && (
          <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
            {t('urgent')}
          </span>
        )}
      </div>

      {/* Favorite Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFavorite?.(e);
        }}
        className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-600 hover:text-red-500 transition-colors shadow-sm z-10"
      >
        <Heart className={cn("w-5 h-5", isFavorite && "fill-red-500 text-red-500")} />
      </button>
    </motion.div>
  );
};

export default AdCard;
