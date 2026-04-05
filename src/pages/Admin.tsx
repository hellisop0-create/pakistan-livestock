import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, deleteDoc, updateDoc, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Trash2, LayoutDashboard, Users, Star, 
  CheckCircle2, XCircle, ExternalLink, ImagePlus, Loader2, Megaphone, Clock, Calendar, X
} from 'lucide-react';
import { toast } from 'sonner';

const ADMIN_EMAILS = ['saadatali1403@gmail.com', 'hellisop0@gmail.com', 'mehreensaadat2@gmail.com'].map(e => e.toLowerCase().trim());

export default function Admin() {
  const { user, isAdmin: isAuthAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [ads, setAds] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeAds, setActiveAds] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ads' | 'users' | 'promotions'>('ads');

  // Ad Manager State
  const [adImage, setAdImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [clientLink, setClientLink] = useState("");
  const [duration, setDuration] = useState("7");
  const [isUploading, setIsUploading] = useState(false);

  const currentUserEmail = user?.email?.toLowerCase().trim();
  const isAdmin = isAuthAdmin || (currentUserEmail && ADMIN_EMAILS.includes(currentUserEmail));

  // Handle Image Preview
  useEffect(() => {
    if (!adImage) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(adImage);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [adImage]);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/admin-login');
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    const unsubAds = onSnapshot(collection(db, 'ads'), (s) => setAds(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubUsers = onSnapshot(collection(db, 'users'), (s) => setUsers(s.docs.map(d => ({ uid: d.id, ...d.data() }))));
    const q = query(collection(db, 'active_ads'), orderBy('createdAt', 'desc'));
    const unsubPromos = onSnapshot(q, (s) => setActiveAds(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubAds(); unsubUsers(); unsubPromos(); };
  }, [isAdmin]);

  const handleRunAd = async () => {
    if (!adImage || !clientLink) return toast.error("Provide image and link");
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `site-ads/${Date.now()}_ad`);
      const uploadResult = await uploadBytes(storageRef, adImage);
      const imageUrl = await getDownloadURL(uploadResult.ref);

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(duration));

      await addDoc(collection(db, "active_ads"), {
        imageUrl,
        targetUrl: clientLink,
        createdAt: serverTimestamp(),
        expiresAt: expiryDate.toISOString(),
        isActive: true
      });

      toast.success("Ad is now live!");
      setAdImage(null);
      setClientLink("");
      setActiveTab('ads'); // Redirect after success to stop loading hang
    } catch (err) {
      console.error(err);
      toast.error("Upload failed. Check Firebase Storage rules.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteActiveAd = async (id: string) => {
    if (!window.confirm('Remove this ad?')) return;
    await deleteDoc(doc(db, 'active_ads', id));
    toast.success('Ad removed');
  };

  if (authLoading) return <div className="p-10 text-center font-bold text-green-700 uppercase">Loading...</div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col space-y-4 mb-8">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Admin <span className="text-blue-600">Control</span></h1>
          </div>

          <div className="flex bg-white p-1 rounded-2xl border shadow-sm w-full">
            <button onClick={() => setActiveTab('ads')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[11px] uppercase transition-all ${activeTab === 'ads' ? 'bg-black text-white' : 'text-gray-400'}`}>
              <LayoutDashboard size={14} /> Listings
            </button>
            <button onClick={() => setActiveTab('users')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[11px] uppercase transition-all ${activeTab === 'users' ? 'bg-black text-white' : 'text-gray-400'}`}>
              <Users size={14} /> Sellers
            </button>
            <button onClick={() => setActiveTab('promotions')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[11px] uppercase transition-all ${activeTab === 'promotions' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>
              <Megaphone size={14} /> Run Ads
            </button>
          </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}

        {activeTab === 'promotions' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
            {/* LEFT: UPLOAD FORM */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border shadow-xl h-fit">
              <h2 className="text-lg font-black uppercase mb-4">New Campaign</h2>
              
              <div className="space-y-4">
                {/* PREVIEW BOX */}
                <div className="relative group">
                  {previewUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-blue-500 aspect-[12/3]">
                      <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                      <button onClick={() => setAdImage(null)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X size={16}/></button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all">
                      <ImagePlus className="text-gray-300 mb-2" size={40} />
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Select Banner Image</span>
                      <input type="file" accept="image/*" onChange={(e) => setAdImage(e.target.files?.[0] || null)} className="hidden" />
                    </label>
                  )}
                </div>

                <input 
                  type="url" 
                  placeholder="Redirect Link (https://...)" 
                  value={clientLink}
                  onChange={(e) => setClientLink(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-xl border-none text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />

                <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border-none text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="1">Run for 24 Hours</option>
                  <option value="7">Run for 7 Days</option>
                  <option value="30">Run for 30 Days</option>
                </select>

                <button onClick={handleRunAd} disabled={isUploading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest disabled:bg-gray-300 flex justify-center items-center gap-2">
                  {isUploading ? <Loader2 className="animate-spin" size={18} /> : "Launch Now"}
                </button>
              </div>
            </div>

            {/* RIGHT: LIST OF LIVE ADS */}
            <div className="lg:col-span-7 space-y-4">
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Active Campaigns</h3>
               {activeAds.map(ad => (
                 <div key={ad.id} className="bg-white p-4 rounded-2xl border flex items-center justify-between group shadow-sm">
                   <div className="flex items-center gap-4">
                     <img src={ad.imageUrl} className="w-20 h-10 rounded-lg object-cover border" />
                     <div>
                       <p className="text-[10px] font-black uppercase text-gray-900">Banner Live</p>
                       <p className="text-[8px] text-orange-500 font-bold uppercase italic">Expires: {new Date(ad.expiresAt).toLocaleDateString()}</p>
                     </div>
                   </div>
                   <button onClick={() => handleDeleteActiveAd(ad.id)} className="text-red-400 hover:text-red-600 p-2 transition-colors"><Trash2 size={20} /></button>
                 </div>
               ))}
            </div>
          </div>
        ) : (
          /* THIS WRAPPER ENSURES USERS/LISTINGS ONLY SHOW ON THEIR TABS */
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-3xl border shadow-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    <th className="p-5">{activeTab === 'ads' ? 'Listing' : 'Seller'}</th>
                    <th className="p-5">Details</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activeTab === 'ads' ? ads.map(ad => (
                    <tr key={ad.id} className="hover:bg-gray-50/50">
                      <td className="p-5 flex items-center gap-4">
                        <img src={ad.images?.[0]} className="w-12 h-10 rounded object-cover border" />
                        <span className="font-bold text-sm uppercase">{ad.title}</span>
                      </td>
                      <td className="p-5">
                         <span className="text-green-600 font-black text-xs">Rs {Number(ad.price).toLocaleString()}</span>
                      </td>
                      <td className="p-5 text-right flex justify-end gap-2">
                        <button onClick={() => handleDelete('ads', ad.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                      </td>
                    </tr>
                  )) : users.map(u => (
                    <tr key={u.uid} className="hover:bg-gray-50/50">
                      <td className="p-5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">{u.displayName?.charAt(0)}</div>
                        <span className="font-bold text-sm">{u.displayName || 'Seller'}</span>
                      </td>
                      <td className="p-5 text-xs text-gray-400">{u.email}</td>
                      <td className="p-5 text-right">
                        <button onClick={() => handleDelete('users', u.uid)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile View Placeholder (Simplified for brevity) */}
            <div className="lg:hidden space-y-4">
               <p className="text-center text-[10px] font-bold text-gray-400 uppercase">Manage {activeTab} below</p>
               {/* Add your mobile list mapping here if needed */}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}