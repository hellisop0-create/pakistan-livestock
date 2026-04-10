import React, { useState } from 'react';
import { Megaphone, Star, BadgeCheck, Monitor, TrendingUp, Smartphone, Code, X } from 'lucide-react';

const ServicesPage = () => {
  const [selectedService, setSelectedService] = useState(null);

  const services = [
    {
      title: "Paid Advertisements",
      description: "Boost your reach and visibility with targeted ad campaigns designed to reach the right audience at the right time.",
      image: "https://i.postimg.cc/85702PPM/www_xyz_com.png",
      icon: <Megaphone className="w-6 h-6 text-blue-600" />
    },
    {
      title: "Featured Ads",
      description: "Keep your listings at the top of search results and category pages for maximum views and faster conversions.",
      image: "https://i.postimg.cc/qRBkyKLQ/Untitled-design-(2).png",
      icon: <Star className="w-6 h-6 text-yellow-500" />
    },
    {
      title: "Verified Blue Tick Seller",
      description: "Establish instant credibility and trust with buyers through our professional verification badge and priority support.",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800&auto=format&fit=crop",
      icon: <BadgeCheck className="w-6 h-6 text-blue-500" />
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen py-16 px-6">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">What We Do</h2>
        <p className="mt-2 text-4xl font-extrabold text-gray-900 sm:text-5xl">
          Our Expert Services
        </p>
        <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
          We combine technical excellence with strategic design to build digital products that perform.
        </p>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service, index) => (
          <div 
            key={index} 
            className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
          >
            {/* Image Wrapper */}
            <div className="relative h-48 overflow-hidden">
              <img 
                src={service.image} 
                alt={service.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-md">
                {service.icon}
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                {service.title}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                {service.description}
              </p>
              <button 
                onClick={() => setSelectedService(service)}
                className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-2"
              >
                Learn More <span>&rarr;</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Popup / Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="relative h-56">
              <img 
                src={selectedService.image} 
                alt={selectedService.title} 
                className="w-full h-full object-cover"
              />
              <button 
                onClick={() => setSelectedService(null)}
                className="absolute top-4 right-4 bg-white/90 p-2 rounded-full text-gray-900 hover:bg-white shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-50 p-2 rounded-lg">
                  {selectedService.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedService.title}</h3>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                {selectedService.description}
              </p>
              <button 
                onClick={() => setSelectedService(null)}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;