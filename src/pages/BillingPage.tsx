import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { CreditCard, CheckCircle, ArrowLeft } from 'lucide-react';

export default function BillingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  // Get data from URL
  const adId = queryParams.get('adId');
  const serviceTitle = queryParams.get('service');
  const price = queryParams.get('price');

  const [tid, setTid] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tid) return toast.error("Please enter Transaction ID");

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'payments'), {
        adId,
        serviceTitle,
        price,
        tid,
        sellerUid: user?.uid,
        sellerEmail: user?.email,
        status: 'pending', // You will change this to 'approved' in Admin Panel
        createdAt: serverTimestamp(),
      });
      
      toast.success("Payment submitted! Wait for admin approval.");
      navigate('/profile');
    } catch (error) {
      toast.error("Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!adId) return <div className="p-20 text-center">Invalid Request</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-green-700 p-8 text-white">
          <button onClick={() => navigate(-1)} className="flex items-center text-green-100 mb-4 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </button>
          <h1 className="text-2xl font-bold">Checkout</h1>
          <p className="opacity-80">Order for Ad ID: {adId.slice(0, 8)}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <span className="text-gray-600">{serviceTitle}</span>
            <span className="font-bold text-xl text-green-700">{price}</span>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">1. Transfer Money</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-4 border rounded-2xl bg-gray-50">
                <p className="text-xs text-gray-500 font-bold uppercase">JazzCash</p>
                <p className="text-lg font-mono">0300-1234567</p>
                <p className="text-sm text-gray-600">Account: Your Name</p>
              </div>
              <div className="p-4 border rounded-2xl bg-gray-50">
                <p className="text-xs text-gray-500 font-bold uppercase">EasyPaisa</p>
                <p className="text-lg font-mono">0345-1234567</p>
                <p className="text-sm text-gray-600">Account: Your Name</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-gray-900">2. Enter Transaction ID</h3>
            <input 
              type="text"
              required
              placeholder="11 or 12 digit TID"
              className="w-full p-4 border-2 rounded-2xl focus:border-green-700 outline-none transition-all"
              value={tid}
              onChange={(e) => setTid(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-700 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-800 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : "Confirm Payment"}
          </button>
        </form>
      </div>
    </div>
  );
}