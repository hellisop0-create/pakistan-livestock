import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Clock, Zap, PlayCircle, Info, CheckCircle2 } from 'lucide-react';

export default function BillingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const adId = queryParams.get('adId');

  const plans = [
    { id: 'basic', label: 'Basic Boost', urduLabel: 'بنیادی بوسٹ', days: 3, price: 300 },
    { id: 'standard', label: 'Standard Pro', urduLabel: 'اسٹینڈرڈ پرو', days: 7, price: 700 },
    { id: 'gold', label: 'Gold Premium', urduLabel: 'گولڈ پریمیم', days: 30, price: 3000 },
  ];

  const [selectedPlan, setSelectedPlan] = useState(plans[1]);
  const [paymentMethod, setPaymentMethod] = useState<'JazzCash' | 'EasyPaisa'>('JazzCash');
  const [tid, setTid] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return toast.error("Please login / لاگ ان کریں");
    if (!tid || tid.length < 8) return toast.error("Invalid TID / درست آئی ڈی درج کریں");

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'payments'), {
        adId: adId,
        sellerUid: user.uid,
        sellerEmail: user.email,
        planLabel: selectedPlan.label,
        amount: selectedPlan.price,
        durationDays: selectedPlan.days,
        paymentPlatform: paymentMethod, // <--- SAVES JAZZCASH OR EASYPAISA
        tid: tid.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      
      toast.success("Payment submitted! / ادائیگی جمع کر دی گئی ہے");
      navigate('/profile');
    } catch (error) {
      console.error("Payment Error:", error);
      toast.error("Submission failed / اندراج ناکام رہا");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!adId) return <div className="p-20 text-center font-bold">Error: No Ad Linked / اشتہار نہیں ملا</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Form */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col h-fit">
          <div className="bg-green-700 p-6 text-white text-center">
            <h1 className="text-xl font-bold uppercase tracking-wide">Secure Checkout</h1>
            <p className="text-sm opacity-90 font-medium" dir="rtl">محفوظ ادائیگی</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* 1. Plan Selection */}
            <div className="space-y-3">
              <label className="font-bold text-gray-800 text-sm">1. Choose Plan / پلان منتخب کریں</label>
              <div className="grid grid-cols-1 gap-3">
                {plans.map((p) => (
                  <div 
                    key={p.id}
                    onClick={() => setSelectedPlan(p)}
                    className={`p-4 border-2 rounded-2xl cursor-pointer transition-all flex justify-between items-center ${
                      selectedPlan.id === p.id ? 'border-green-700 bg-green-50' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">{p.label}</span>
                      <span className="text-xs text-gray-500 font-medium" dir="rtl">{p.urduLabel} ({p.days} دن)</span>
                    </div>
                    <span className="font-black text-green-700 text-lg">Rs. {p.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Platform Selection */}
            <div className="space-y-3">
              <label className="font-bold text-gray-800 text-sm">2. Payment Method / ادائیگی کا ذریعہ</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('JazzCash')}
                  className={`p-4 rounded-2xl border-2 font-bold transition-all ${
                    paymentMethod === 'JazzCash' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-400'
                  }`}
                >
                  JazzCash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('EasyPaisa')}
                  className={`p-4 rounded-2xl border-2 font-bold transition-all ${
                    paymentMethod === 'EasyPaisa' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-100 text-gray-400'
                  }`}
                >
                  EasyPaisa
                </button>
              </div>
            </div>

            {/* 3. Account Display */}
            <div className={`p-5 rounded-2xl border-2 animate-in fade-in zoom-in duration-300 ${
              paymentMethod === 'JazzCash' ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'
            }`}>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2 text-center">Transfer Rs. {selectedPlan.price} to:</p>
              <p className="text-2xl font-mono font-bold text-center text-gray-900">0301-3551707</p>
              <p className="text-sm text-center text-gray-600 font-medium">Account: Chopan ({paymentMethod})</p>
            </div>

            {/* 4. TID Input */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-bold text-gray-700 uppercase">3. Transaction ID (TID)</label>
                <label className="text-xs font-bold text-gray-700" dir="rtl">ٹرانزیکشن آئی ڈی</label>
              </div>
              <input 
                type="text"
                required
                placeholder="Enter 11-digit TID"
                className="w-full p-4 border-2 rounded-xl focus:border-green-700 outline-none transition-all font-mono"
                value={tid}
                onChange={(e) => setTid(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-700 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-800 transition-all shadow-lg active:scale-95"
            >
              {isSubmitting ? "Verifying..." : "Confirm Payment / تصدیق کریں"}
            </button>
          </form>
        </div>

        {/* Right Column: Video & Help */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 shadow-xl border border-gray-100">
             <div className="flex justify-between items-center mb-4">
               <span className="font-bold flex items-center gap-2"><PlayCircle className="text-green-700"/> How to Pay</span>
               <span className="font-bold" dir="rtl">طریقہ کار</span>
             </div>
             <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-inner">
               <iframe className="w-full h-full" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Guide" frameBorder="0" allowFullScreen></iframe>
             </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-4">
             <div className="flex items-center gap-2 font-bold text-gray-900 mb-2">
               <Info className="text-green-700 w-5 h-5"/> Instructions / ہدایات
             </div>
             <div className="text-sm text-gray-600 space-y-4">
                <p>1. Select your plan and payment method (JazzCash/EasyPaisa).</p>
                <p dir="rtl" className="text-right">1. اپنا پلان اور ادائیگی کا طریقہ منتخب کریں۔</p>
                <hr />
                <p>2. Send the amount to our account number mentioned above.</p>
                <p dir="rtl" className="text-right">2. اوپر دیئے گئے اکاؤنٹ نمبر پر رقم منتقل کریں۔</p>
                <hr />
                <p>3. Enter the TID from the SMS you received after payment.</p>
                <p dir="rtl" className="text-right">3. ادائیگی کے بعد موصول ہونے والی ٹرانزیکشن آئی ڈی درج کریں۔</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}