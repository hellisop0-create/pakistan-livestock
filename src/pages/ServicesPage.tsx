import React from 'react';
import { Monitor, TrendingUp, Smartphone, Code } from 'lucide-react'; // Example icons

export default ServicesPage;

const ServicesPage = () => {
  const services = [
    {
      title: "UI/UX Strategy",
      description: "User-centric designs focused on intuitive navigation and seamless digital experiences that keep visitors engaged.",
      image: "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?q=80&w=800&auto=format&fit=crop",
      icon: <Monitor className="w-6 h-6 text-blue-600" />
    },
    {
      title: "Conversion Optimization",
      description: "Data-driven layouts designed to turn visitors into customers by optimizing every touchpoint of the user journey.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop",
      icon: <TrendingUp className="w-6 h-6 text-green-600" />
    },
    {
      title: "Full-Stack Development",
      description: "Building scalable web applications using modern stacks like React, Firebase, and Vite for lightning-fast performance.",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop",
      icon: <Code className="w-6 h-6 text-purple-600" />
    },
    {
      title: "Mobile App Integration",
      description: "Extending your web presence to mobile platforms through seamless app conversion and responsive architecture.",
      image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=800&auto=format&fit=crop",
      icon: <Smartphone className="w-6 h-6 text-red-600" />
    }
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
              <button className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-2">
                Learn More <span>&rarr;</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServicesPage;