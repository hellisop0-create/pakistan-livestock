import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Clock, Zap, PlayCircle, Info } from 'lucide-react';

export default function BillingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const adId = queryParams.get('adId');

  const plans = [
    { id: 'basic', label: 'Basic Boost', urduLabel: 'بنیادی بوسٹ', days: 3, price: 500 },
    { id: 'standard', label: 'Standard Pro', urduLabel: 'اسٹینڈرڈ پرو', days: 7, price: 1000 },
    { id: 'gold', label: 'Gold Premium', urduLabel: 'گولڈ پریمیم', days: 30, price: 3500 },
  ];

  const [selectedPlan, setSelectedPlan] = useState(plans[1]);
  const [tid, setTid] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tid) return toast.error("Please enter Transaction ID / ٹرانزیکشن آئی ڈی درج کریں");

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'payments'), {
        adId,
        serviceTitle: selectedPlan.label,
        durationDays: selectedPlan.days,
        amount: selectedPlan.price,
        tid,
        sellerUid: user?.uid,
        sellerEmail: user?.email,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      
      toast.success("Payment submitted for approval / ادائیگی جمع کر دی گئی ہے");
      navigate('/profile');
    } catch (error) {
      toast.error("Submission failed / اندراج ناکام رہا");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!adId) return <div className="p-20 text-center font-bold text-red-600">Error: No Ad ID Linked / کوئی اشتہار منتخب نہیں کیا گیا</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Payment Form */}
        <div className="space-y-6 order-2 lg:order-1">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-green-700 p-6 text-white text-center">
              <h1 className="text-xl font-bold uppercase tracking-wide">Checkout</h1>
              <h2 className="text-lg font-medium mt-1" dir="rtl">ادائیگی کا طریقہ</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Plan Selector */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-700" /> Select Plan
                  </h3>
                  <h3 className="font-bold text-gray-900 text-sm" dir="rtl">پلان منتخب کریں</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {plans.map((plan) => (
                    <div 
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`p-4 border-2 rounded-2xl cursor-pointer transition-all flex justify-between items-center ${
                        selectedPlan.id === plan.id ? 'border-green-700 bg-green-50 shadow-sm' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{plan.label}</span>
                        <span className="text-xs text-gray-500" dir="rtl">{plan.urduLabel} ({plan.days} دن)</span>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-green-700 text-lg whitespace-nowrap">Rs. {plan.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Details */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 text-sm">1. Transfer Money / رقم بھیجیں</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-4 border rounded-2xl bg-gray-50 border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">JazzCash</div>
                    <p className="text-lg font-mono font-bold text-gray-800">0301-3551707</p>
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-tight">Account: BetailHub</p>
                  </div>
                  <div className="p-4 border rounded-2xl bg-gray-50 border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">EasyPaisa</div>
                    <p className="text-lg font-mono font-bold text-gray-800">0301-3551707</p>
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-tight">Account: BetailHub</p>
                  </div>
                </div>
              </div>

              {/* TID Input */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div className="flex justify-between items-center">
                   <label className="text-xs font-bold text-gray-700 uppercase">2. Transaction ID (TID)</label>
                   <label className="text-xs font-bold text-gray-700" dir="rtl">ٹرانزیکشن آئی ڈی درج کریں</label>
                </div>
                <input 
                  type="text"
                  required
                  placeholder="Enter 11 or 12 digit ID"
                  className="w-full p-4 border-2 rounded-xl focus:border-green-700 outline-none shadow-sm transition-all font-mono"
                  value={tid}
                  onChange={(e) => setTid(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-700 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-800 transition-all flex flex-col items-center justify-center gap-0 shadow-lg active:scale-95 disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 fill-current" />
                  <span>{isSubmitting ? "Processing..." : "Confirm & Submit"}</span>
                </div>
                {!isSubmitting && <span className="text-xs opacity-80 font-normal" dir="rtl">تصدیق کریں اور بھیجیں</span>}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Video & Instructions */}
        <div className="space-y-6 order-1 lg:order-2">
          
          {/* Video Section */}
          <div className="bg-white rounded-3xl p-5 shadow-xl border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-gray-900 flex items-center gap-2"><PlayCircle className="w-5 h-5 text-green-700"/> Video Tutorial</span>
              <span className="font-bold text-gray-900" dir="rtl">ویڈیو گائیڈ</span>
            </div>
            <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-inner">
               <iframe 
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                title="Tutorial"
                frameBorder="0"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          {/* Bilingual Steps */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-gray-900 flex items-center gap-2"><Info className="w-5 h-5 text-green-700"/> Instructions</span>
              <span className="font-bold text-gray-900" dir="rtl">ہدایات</span>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4 border-b border-gray-50 pb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">Transfer Payment / رقم منتقل کریں</p>
                  <p className="text-xs text-gray-500 mt-1">Send Rs. <span className="font-bold">{selectedPlan.price}</span> to <span className="font-bold text-gray-700">0301-3551707</span> (BetailHub).</p>
                  <p className="text-xs text-gray-600 mt-1 font-medium" dir="rtl">منتخب کردہ رقم (Rs. {selectedPlan.price}) دیئے گئے نمبر پر بھیجیں۔</p>
                </div>
              </div>

              <div className="flex gap-4 border-b border-gray-50 pb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">Get TID / ٹرانزیکشن آئی ڈی حاصل کریں</p>
                  <p className="text-xs text-gray-500 mt-1">Copy the TID from the confirmation SMS you receive after transfer.</p>
                  <p className="text-xs text-gray-600 mt-1 font-medium" dir="rtl">رقم بھیجنے کے بعد موصول ہونے والی ٹرانزیکشن آئی ڈی (TID) نوٹ کریں۔</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">Submit Form / فارم جمع کریں</p>
                  <p className="text-xs text-gray-500 mt-1">Paste the TID above and click confirm. Ad will be featured within 24 hours.</p>
                  <p className="text-xs text-gray-600 mt-1 font-medium" dir="rtl">آئی ڈی یہاں درج کر کے بٹن دبائیں۔ آپ کا اشتہار 24 گھنٹے میں نمایاں ہو جائے گا۔</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}