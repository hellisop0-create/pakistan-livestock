import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

// Full Pakistan Location Hierarchy structured for OLX-style cascading search
const LOCATION_DATA = {
  "Sindh": {
    "Karachi": [
      "DHA Phase 1","DHA Phase 2","DHA Phase 4","DHA Phase 5","DHA Phase 6","DHA Phase 7","DHA Phase 8",
      "Clifton Block 1","Clifton Block 2","Clifton Block 5","Clifton Block 7",
      "Gulshan-e-Iqbal Block 1","Gulshan-e-Iqbal Block 5","Gulshan-e-Iqbal Block 10","Gulshan-e-Iqbal Block 13D",
      "Gulistan-e-Johar Block 1","Gulistan-e-Johar Block 7","Gulistan-e-Johar Block 13",
      "North Nazimabad Block A","North Nazimabad Block H",
      "Federal B Area Block 14","Federal B Area Block 15",
      "PECHS Block 2","PECHS Block 6",
      "Saddar","Korangi Industrial Area","Korangi Crossing",
      "Landhi","Malir","Malir Cantt",
      "Shah Faisal Colony","Buffer Zone","Scheme 33",
      "Lyari","Baldia Town","Orangi Town","Surjani Town"
    ],
    "Hyderabad": [
      "Qasimabad","Latifabad Unit 6","Latifabad Unit 7","Latifabad Unit 8","Latifabad Unit 11",
      "Saddar","Defence","Tilak Incline","Autobahn Road","Citizen Colony",
      "Heerabad","Hirabad","Paretabad","Gulistan-e-Sajjad","American Quarters"
    ],
    "Sukkur": [
      "Rohri","New Sukkur","Barrage Road","Shikarpur Road","Military Road","Queens Road"
    ],
    "Larkana": [
      "Ratodero Road","Station Road","Sachal Colony","VIP Road","Bakrani Road"
    ],
    "Mirpur Khas": [
      "Satellite Town","Digri Road","Old City","Hussainabad"
    ],
    "Nawabshah": [
      "Sakrand Road","Masjid Road","Daur Road"
    ],
    "Dadu": [
      "Station Road","Mehar Road"
    ]
  },

  "Punjab": {
    "Lahore": [
      "DHA Phase 1","DHA Phase 2","DHA Phase 3","DHA Phase 4","DHA Phase 5","DHA Phase 6",
      "Bahria Town","Gulberg 1","Gulberg 2","Model Town","Johar Town",
      "Wapda Town","Township","Cantt","Iqbal Town","Valencia Town",
      "Askari 10","Askari 11","Shadman","Garden Town"
    ],
    "Faisalabad": [
      "D Ground","People’s Colony","Madina Town","Satiana Road","Jaranwala Road","Susan Road"
    ],
    "Rawalpindi": [
      "Saddar","Chaklala","Bahria Town Phase 1","Bahria Town Phase 7",
      "DHA Phase 1","DHA Phase 2","Raja Bazaar","Committee Chowk"
    ],
    "Multan": [
      "Cantt","Gulgasht Colony","Bosan Road","Shah Rukn-e-Alam","Model Town"
    ],
    "Gujranwala": [
      "Model Town","Satellite Town","DC Colony","Peoples Colony"
    ],
    "Sargodha": [
      "Satellite Town","Sargodha Mandi","University Road"
    ],
    "Bahawalpur": [
      "Model Town","Satellite Town","Ahmedpur Road"
    ],
    "Sialkot": [
      "Cantt","Kashmir Road","Paris Road"
    ],
    "Rahim Yar Khan": [
      "Model Town","Town Hall Area"
    ],
    "Sheikhupura": [
      "Housing Colony","Jinnah Park"
    ]
  },

  "Khyber Pakhtunkhwa": {
    "Peshawar": [
      "University Town","Hayatabad Phase 1","Hayatabad Phase 3","Hayatabad Phase 6",
      "Saddar","Gulbahar","Ring Road","Warsak Road"
    ],
    "Abbottabad": [
      "Jinnahabad","Mandian","Supply Bazaar","PMA Road"
    ],
    "Mardan": [
      "Sheikh Maltoon Town","Cantt Area","Bagh Irum"
    ],
    "Swat": [
      "Mingora","Saidu Sharif"
    ],
    "Kohat": [
      "Cantt","KDA Township"
    ]
  },

  "Balochistan": {
    "Quetta": [
      "Satellite Town","Jinnah Town","Brewery Road","Sariab Road","Zarghoon Road"
    ],
    "Gwadar": [
      "New Town","Old Town","Gwadar Port Area"
    ],
    "Turbat": [
      "Absar","Airport Road"
    ],
    "Khuzdar": [
      "Main Bazaar","Zero Point"
    ]
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
                  setCity(""); // Reset child
                  setArea(""); // Reset grandchild
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
                  setArea(""); // Reset child
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