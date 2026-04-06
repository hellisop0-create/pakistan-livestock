import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

export default function Hero() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("All Pakistan");
  const navigate = useNavigate();

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (city !== "All Pakistan") params.append('location', city);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="relative h-[400px] md:h-[500px] flex items-center justify-center overflow-hidden">
      {/* --- BACKGROUND LAYER --- */}
      {/* You can replace the URL below with your specific background image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop")', // Change this to your image
        }}
      />
      
      {/* --- OVERLAY (The "Dark/Greenish" tint) --- */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-green-950/80 via-black/50 to-green-950/80" />

      {/* --- CONTENT LAYER --- */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 drop-shadow-lg uppercase tracking-tight">
            Find Your <span className="text-orange-500">Perfect</span> Match
          </h1>
          <p className="text-gray-200 text-lg md:text-xl mb-10 font-medium drop-shadow-md">
            The largest marketplace for cars, mobiles, and more.
          </p>
        </motion.div>

        {/* --- SEARCH BAR --- */}
        <motion.form 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSearch} 
          className="max-w-4xl mx-auto bg-white/95 backdrop-blur-sm rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-2xl border border-white/20"
        >
          <div className="flex-1 flex items-center px-4 border-b md:border-b-0 md:border-r border-gray-200">
            <Search className="text-orange-500 w-5 h-5 mr-3" />
            <input 
              type="text" 
              placeholder="What are you looking for?" 
              className="w-full py-4 outline-none bg-transparent text-gray-800 font-medium"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center px-4 md:w-64">
            <MapPin className="text-orange-500 w-5 h-5 mr-3" />
            <select 
              className="bg-transparent outline-none w-full cursor-pointer text-gray-600 font-semibold"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              <option>All Pakistan</option>
              <option>Lahore</option>
              <option>Karachi</option>
              <option>Islamabad</option>
              <option>Rawalpindi</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="bg-orange-500 text-white px-12 py-4 rounded-xl font-black uppercase tracking-wider hover:bg-orange-600 hover:shadow-orange-500/40 shadow-lg transition-all active:scale-95"
          >
            Search
          </button>
        </motion.form>
      </div>
    </div>
  );
}