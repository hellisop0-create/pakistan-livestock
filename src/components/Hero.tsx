import React from 'react';
import { Search, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';

interface HeroProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCity: string;
  setSelectedCity: (val: string) => void;
}

export default function Hero({ searchQuery, setSearchQuery, selectedCity, setSelectedCity }: HeroProps) {
  const { t } = useLanguage();

  const handleSearchClick = () => {
    // Scrolls to the results section so the user knows the search triggered
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative bg-green-900 py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-4xl sm:text-6xl font-extrabold text-white mb-6"
        >
          {t('appName')}
        </motion.h1>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-2 flex flex-col md:flex-row items-center gap-2"
        >
          {/* Search Input */}
          <div className="flex-1 w-full flex items-center px-4 border-b md:border-b-0 md:border-r border-gray-100">
            <Search className="text-gray-400 w-5 h-5 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search')}
              className="w-full py-4 focus:outline-none text-gray-700 text-lg"
            />
          </div>
          
          {/* City Selection */}
          <div className="w-full md:w-48 flex items-center px-4">
            <MapPin className="text-gray-400 w-5 h-5 mr-2" />
            <select 
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full py-4 bg-transparent focus:outline-none text-gray-600 font-medium cursor-pointer"
            >
              <option value="All Pakistan">All Pakistan</option>
              <option value="Lahore">Lahore</option>
              <option value="Karachi">Karachi</option>
              <option value="Islamabad">Islamabad</option>
              <option value="Faisalabad">Faisalabad</option>
              <option value="Multan">Multan</option>
            </select>
          </div>

          {/* The Search Button */}
          <button 
            onClick={handleSearchClick}
            className="w-full md:w-auto bg-orange-500 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all active:scale-95"
          >
            Search
          </button>
        </motion.div>
      </div>
    </div>
  );
}