import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase'; 
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Trash2, ShieldCheck, ExternalLink, 
  Hash, LayoutDashboard, Users, Star, CheckCircle2, XCircle, Image as ImageIcon 
} from 'lucide-react';
import { toast } from 'sonner';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [ads, setAds] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ads' | 'users'>('ads');

  // Hardcoded Admin Check
  const isAdmin = user?.email === 'hellisop0@gmail.com';

  useEffect(() => {
    // 1. Wait for Auth to finish loading
    if (authLoading) return;

    // 2. STRICTURE LOCK: If not the specific admin, kick out immediately
    if (!user || !isAdmin) {
      console.warn("Unauthorized access attempt blocked.");
      navigate('/');
      return;
    }

    // 3. Real-time Data Listeners
    const unsubAds = onSnapshot(collection(db, 'ads'), (snapshot) => {
      setAds(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ uid: d.id, ...d.data() })));
    });

    // 4. THE CLEANUP (Crucial for the "Locking" feel)
    return () => {
      unsubAds();
      unsubUsers();
      setAds([]);
      setUsers([]);
    };
  }, [user, isAdmin, authLoading, navigate]);

  // --- ACTIONS ---
  const handleUpdateAdStatus = async (adId: string, status: 'active' | 'declined') => {
    try {
      await updateDoc(doc(db, 'ads', adId), { status });
      toast.success(`Ad marked as ${status}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleToggleFeatured = async (adId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'ads', adId), { isFeatured: !currentStatus });
      toast.success(!currentStatus ? 'Ad Featured (Gold)' : 'Featured removed');
    } catch (error) {
      toast.error('Feature toggle failed');
    }
  };

  const toggleUserVerification = async (uid: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uid), { isVerified: !currentStatus });
      toast.success('Verification updated');
    } catch (error) {
      toast.error('User update failed');
    }
  };

  // --- RENDER PROTECTIONS ---
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-green-600 font-black animate-pulse tracking-widest">
          AUTHENTICATING COMMANDER...
        </div>
      </div>
    );
  }

  // If not admin, return null (the useEffect handles the redirect)
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 italic">CITYCARE COMMAND</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Mandi Security Layer</p>
          </div>

          <div className="flex bg-white p-1 rounded-2xl border shadow-sm">
            <button 
              onClick={() => setActiveTab('ads')} 
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase transition-all ${activeTab === 'ads' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400'}`}
            >
              <LayoutDashboard size={14} className="inline mr-2" /> Listings ({ads.length})
            </button>
            <button 
              onClick={() => setActiveTab('users')} 
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase transition-all ${activeTab === 'users' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400'}`}
            >
              <Users size={14} className="inline mr-2" /> Sellers ({users.length})
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <th className="p-5">Details</th>
                <th className="p-5">Seller / Email</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeTab === 'ads' ? ads.map(ad => (
                <tr key={ad.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-12 rounded-lg bg-gray-100 overflow-hidden border">
                        {ad.images?.[0] ? (
                          <img src={ad.images[0]} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-300"><ImageIcon size={16} /></div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-gray-900">{ad.title}</div>
                        <div className="text-[10px] font-mono text-blue-500 uppercase">{ad.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="text-xs font-bold">{ad.sellerName || 'Anonymous'}</div>
                    <div className="text-[10px] text-green-600 font-black">Rs {Number(ad.price || 0).toLocaleString()}</div>
                  </td>
                  <td className="p-5">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${ad.status === 'active' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
                      {ad.status || 'Pending'}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleUpdateAdStatus(ad.id, 'active')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><CheckCircle2 size={18} /></button>
                      <button onClick={() => handleUpdateAdStatus(ad.id, 'declined')} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"><XCircle size={18} /></button>
                      <button 
                        onClick={() => handleToggleFeatured(ad.id, ad.isFeatured)} 
                        className={`p-2 rounded-lg ${ad.isFeatured ? 'bg-yellow-400 text-white' : 'text-gray-300'}`}
                      >
                        <Star size={18} fill={ad.isFeatured ? 'white' : 'none'} />
                      </button>
                      <Link to={`/ad/${ad.id}`} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><ExternalLink size={18} /></Link>
                    </div>
                  </td>
                </tr>
              )) : users.map(u => (
                <tr key={u.uid} className="hover:bg-gray-50/30">
                  <td className="p-5 flex items-center gap-3">
                    {/* FIXED: User Profile Picture Logic */}
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                      {u.photoURL ? (
                        <img 
                          src={u.photoURL} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" // Helps load Google profile photos
                        />
                      ) : (
                        <span className="font-black text-blue-600 text-sm">{u.displayName?.charAt(0) || 'U'}</span>
                      )}
                    </div>
                    <div className="font-bold text-gray-900 text-sm">{u.displayName || 'Guest User'}</div>
                  </td>
                  <td className="p-5">
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </td>
                  <td className="p-5">
                    <button 
                      onClick={() => toggleUserVerification(u.uid, u.isVerified)}
                      className={`text-[9px] font-black px-3 py-1 rounded-full transition-all ${u.isVerified ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}
                    >
                      {u.isVerified ? 'VERIFIED' : 'NOT VERIFIED'}
                    </button>
                  </td>
                  <td className="p-5 text-right">
                    <ShieldCheck size={18} className={u.isVerified ? 'text-blue-500 ml-auto' : 'text-gray-200 ml-auto'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}