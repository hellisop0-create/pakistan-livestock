import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

// Simplified Pakistan Location Hierarchy
const LOCATION_DATA = {
  "Sindh": {
    "Karachi": ["DHA", "Clifton", "Gulshan-e-Iqbal", "Gulistan-e-Johar", "North Nazimabad", "Malir", "Saddar", "Scheme 33"],
    "Hyderabad": ["Latifabad", "Qasimabad", "Tando Allahyar Road", "Hyder Chowk", "Heerabaad", "Pathan Colony", "Citizen Colony", "Autobahn"],
    "Sukkur": ["Military Road", "Barrage Road", "Rohri"],
    "Larkana": ["VIP Road", "Station Road"],
    "Mirpur Khas": ["Satellite Town", "Digri Road"]
  },
  "Punjab": {
    "Lahore": ["DHA", "Bahria Town", "Gulberg", "Johar Town", "Model Town", "Cantt"],
    "Faisalabad": ["Madina Town", "People's Colony", "D Ground"],
    "Rawalpindi": ["Bahria Town", "Saddar", "Chaklala", "Adiala Road"],
    "Multan": ["Bosan Road", "Gulgasht Colony", "Cantt"],
    "Gujranwala": ["Model Town", "DC Colony"],
    "Sialkot": ["Cantt", "Sialkot City"]
  },
  "Khyber Pakhtunkhwa": {
    "Peshawar": ["Hayatabad", "University Town", "Ring Road", "Saddar"],
    "Abbottabad": ["Jinnahabad", "Mandian"],
    "Mardan": ["Sheikh Maltoon Town", "Cantt"]
  },
  "Balochistan": {
    "Quetta": ["Jinnah Town", "Satellite Town", "Sariab Road"],
    "Gwadar": ["New Town", "Port Area"]
  }
};

export default function Hero() {
  const [query, setQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const navigate = useNavigate();

  // OLX Style Cascading States
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding using Nominatim (OpenStreetMap)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          if (data && data.address) {
            const addr = data.address;
            // Get city, province/state and country for a readable string
            const cityPart = addr.city || addr.town || addr.village || addr.suburb || "";
            const statePart = addr.state || "";
            const formattedAddress = `${cityPart}${cityPart && statePart ? ', ' : ''}${statePart}, Pakistan`;
            
            setQuery(formattedAddress);
          } else {
            setQuery(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          setQuery(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        alert("Unable to retrieve location. Please select manually.");
        setIsLocating(false);
      }
    );
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    
    // Construct final location string based on specific selection
    const locationFinal = area || city || province || "All Pakistan";
    if (locationFinal !== "All Pakistan") params.append('location', locationFinal);
    
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="relative bg-green-900 py-20 overflow-hidden">
      {/* --- THE OLD PATTERN THEME --- */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{ 
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }}
      />
      
      {/* Bottom Gradient Fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
            Pakistan Livestock Mandi
          </h1>
          <p className="text-green-100 text-lg opacity-90">
            پاکستان لائیوسٹاک منڈی - پاکستان کا منفرد ڈیجیٹل (آن لائن) مویشی منڈی
          </p>
        </motion.div>

        {/* --- THE SEARCH BOX --- */}
        <form 
          onSubmit={handleSearch} 
          className="max-w-6xl mx-auto bg-white rounded-2xl p-3 flex flex-col gap-3 shadow-2xl"
        >
          <div className="flex flex-col md:flex-row gap-2 w-full">
            {/* Search Input */}
            <div className="flex-[1.5] flex items-center px-4 border border-gray-100 rounded-xl bg-gray-50">
              <Search className="text-gray-400 w-5 h-5 mr-3" />
              <input 
                type="text" 
                placeholder="What are you looking for?" 
                className="w-full py-4 bg-transparent outline-none text-gray-700 font-medium"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button 
                type="button"
                onClick={handleCurrentLocation}
                className={`ml-2 text-orange-500 hover:scale-110 transition-transform ${isLocating ? 'animate-spin' : ''}`}
              >
                <MapPin className="w-5 h-5" />
              </button>
            </div>

            {/* OLX Cascading Selectors */}
            <div className="flex flex-col md:flex-row gap-2 flex-[2.5]">
              {/* Province Selector */}
              <select 
                className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none text-gray-600 font-semibold text-sm cursor-pointer"
                value={province}
                onChange={(e) => {
                  setProvince(e.target.value);
                  setCity(""); 
                  setArea(""); 
                }}
              >
                <option value="">All Provinces</option>
                {Object.keys(LOCATION_DATA).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              {/* City Selector */}
              <select 
                disabled={!province}
                className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none text-gray-600 font-semibold text-sm cursor-pointer disabled:opacity-50"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setArea(""); 
                }}
              >
                <option value="">Select City</option>
                {province && Object.keys(LOCATION_DATA[province]).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Area Selector */}
              <select 
                disabled={!city}
                className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none text-gray-600 font-semibold text-sm cursor-pointer disabled:opacity-50"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              >
                <option value="">Select Area</option>
                {city && LOCATION_DATA[province][city].map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <button 
              type="submit" 
              className="bg-orange-500 text-white px-10 py-4 rounded-xl font-bold hover:bg-orange-600 transition-colors active:scale-95"
            >
              Search
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}