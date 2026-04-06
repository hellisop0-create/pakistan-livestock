import React, { useState } from 'react'; // 1. Added useState
import { Search, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Hero() {
  const { t, language } = useLanguage();
  
  // 2. Create state for the search text and location
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('All Pakistan');

  // 3. This function runs when you click the orange button
  const handleSearch = () => {
    if (!searchTerm.trim()) return; // Don't search if empty
    
    console.log(`Searching for: ${searchTerm} in ${location}`);
    // Here you would usually redirect: 
    // window.location.href = `/search?q=${searchTerm}&city=${location}`;
  };

  return (
    <div className="relative bg-green-900 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10">
        <div className="text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-4",
              language === 'ur' && "font-urdu"
            )}
          >
            {t('appName')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "text-xl sm:text-2xl text-green-100 mb-8 max-w-2xl mx-auto",
              language === 'ur' && "font-urdu"
            )}
          >
            {t('tagline')}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-2 flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2"
          >
            <div className="flex-1 w-full relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm} // 4. Connect input to state
                onChange={(e) => setSearchTerm(e.target.value)} // 5. Update state on type
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()} // Search on Enter key
                placeholder={t('search')}
                className="w-full pl-12 pr-4 py-4 rounded-xl focus:outline-none text-gray-700 text-lg"
              />
            </div>
            
            <div className="w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-gray-100 px-4 py-2 flex items-center space-x-2">
              <MapPin className="text-gray-400 w-5 h-5" />
              <select 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-transparent focus:outline-none text-gray-600 font-medium"
              >
                <option>All Pakistan</option>
                <option>Lahore</option>
                <option>Karachi</option>
                <option>Islamabad</option>
                <option>Faisalabad</option>
                <option>Multan</option>
              </select>
            </div>

            <button 
              onClick={handleSearch} // 6. Connect button to function
              className="w-full sm:w-auto bg-orange-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all shadow-lg"
            >
              {t('search').split(' ')[0]}
            </button>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white/10 to-transparent"></div>
    </div>
  );
}