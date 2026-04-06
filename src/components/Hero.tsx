import React from 'react';
import { Search, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';

// This INTERFACE is what prevents the "q error"
interface HeroProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCity: string;
  setSelectedCity: (val: string) => void;
}

export default function Hero({ searchQuery, setSearchQuery, selectedCity, setSelectedCity }: HeroProps) {
  const { t } = useLanguage();
  
  return (
    <div className="relative bg-green-900 py-16">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-4xl font-bold text-white mb-8">
          {t('appName')}
        </motion.h1>

        <div className="max-w-3xl mx-auto bg-white rounded-xl p-2 flex flex-col md:flex-row items-center shadow-2xl">
          {/* Search Input */}
          <div className="flex-1 w-full flex items-center px-4 border-b md:border-b-0 md:border-r border-gray-100">
            <Search className="text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search')}
              className="w-full p-4 focus:outline-none text-gray-700"
            />
          </div>
          
          {/* City Dropdown */}
          <div className="w-full md:w-48 flex items-center px-4">
            <MapPin className="text-gray-400 w-5 h-5" />
            <select 
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full p-4 bg-transparent focus:outline-none text-gray-600 cursor-pointer"
            >
              <option value="All Pakistan">All Pakistan</option>
              <option value="Lahore">Lahore</option>
              <option value="Karachi">Karachi</option>
              <option value="Islamabad">Islamabad</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}