import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, CreditCard, ShieldCheck } from 'lucide-react'; // Optional: icon library

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const adData = location.state?.adData;

  if (!adData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm border text-center max-w-md">
          <h2 className="text-2xl font-semibold text-gray-900">Session Expired</h2>
          <p className="text-gray-500 mt-2">We couldn't find your ad details. Please try posting again.</p>
          <button 
            onClick={() => navigate('/post-ad')} 
            className="mt-6 px-6 py-2 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 transition-colors"
          >
            Return to Post Ad
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-sm text-gray-500 hover:text-gray-800 mb-8 transition-colors"
        >
          <ChevronLeft size={16} className="mr-1" /> Back to edit details
        </button>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Main Checkout Section */}
          <div className="md:col-span-3 space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Checkout</h1>
            
            <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <CreditCard className="mr-2 text-gray-400" size={20} /> Payment Method
              </h3>
              <div className="p-4 border-2 border-green-600 bg-green-50 rounded-xl flex justify-between items-center">
                <span className="font-medium text-green-900">Debit or Credit Card</span>
                <div className="flex gap-2">
                   {/* Replace with your branding icons */}
                  <div className="w-8 h-5 bg-gray-200 rounded" /> 
                  <div className="w-8 h-5 bg-gray-200 rounded" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4 italic text-center">
                Secure 256-bit SSL Encrypted Payment
              </p>
            </section>
          </div>

          {/* Order Summary Sidebar */}
          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{adData.title}</p>
                    <p className="text-sm text-gray-500">7 Days Featured Plan</p>
                  </div>
                </div>
                
                <hr className="border-gray-100" />
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{adData.price} PKR</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">0 PKR</span>
                </div>
                
                <hr className="border-gray-100" />
                
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>{adData.price} PKR</span>
                </div>
              </div>

              <button className="w-full bg-green-700 hover:bg-green-800 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-200 transition-all active:scale-[0.98]">
                Pay Now
              </button>

              <div className="mt-6 flex items-center justify-center text-gray-500 text-xs gap-1">
                <ShieldCheck size={14} className="text-green-600" />
                <span>100% Secure Transaction</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}