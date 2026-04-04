import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase'; 
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Trash2, ShieldCheck, ShieldAlert, ExternalLink, 
  Hash, LayoutDashboard, Users, Star, CheckCircle2, XCircle 
} from 'lucide-react';
import { toast } from 'sonner';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [ads, setAds] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ads' | 'users'>('ads');

  const isAdmin = user?.email === 'hellisop0@gmail.com';

  useEffect(() => {
    if (!isAdmin) return;

    const unsubAds = onSnapshot(collection(db, 'ads'), (snapshot) => {
      setAds(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ uid: d.id, ...d.data() })));
    });

    return () => { unsubAds(); unsubUsers(); };
  }, [isAdmin]);

  // --- AD ACTIONS ---
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
      toast.success(!currentStatus ? 'Ad Featured (Gold)' : 'Featured status removed');
    } catch (error) {
      toast.error('Failed to update Featured status');
    }
  };

  const handleDeleteAd = async (adId: string) => {
    if (!window.confirm('Delete this ad permanently?')) return;
    try {
      await deleteDoc(doc(db, 'ads', adId));
      toast.success('Ad deleted');
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  // --- USER ACTIONS ---
  const toggleUserVerification = async (uid: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uid), { isVerified: !currentStatus });
      toast.success('Verification status updated');
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center font-bold">Loading Admin...</div>;
  if (!isAdmin) return <div className="p-20 text-center font-bold text-red-500 underline" onClick={() => navigate('/')}>Access Denied. Return Home.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight italic">CITYCARE COMMAND</h1>
            <div className="flex gap-3 mt-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">Live Ads: {ads.length}</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase">Sellers: {users.length}</span>
            </div>
          </div>

          <div className="flex bg-white p-1.5 rounded-2xl border shadow-sm w-full md:w-auto">
            <button onClick={() => setActiveTab('ads')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'ads' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400'}`}>
              <LayoutDashboard size={18} /> Listings
            </button>
            <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400'}`}>
              <Users size={18} /> Users
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <th className="p-5">{activeTab === 'ads' ? 'Listing & Unique ID' : 'Seller Name'}</th>
                <th className="p-5">{activeTab === 'ads' ? 'Status & Feature' : 'Verification Status'}</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeTab === 'ads' ? ads.map(ad => (
                <tr key={ad.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="p-5">
                    <div className="font-bold text-gray-900 leading-none mb-1">{ad.title}</div>
                    <div className="flex items-center gap-1">
                      <Hash size={10} className="text-blue-500" />
                      <span className="text-[10px] font-mono font-black text-blue-600 uppercase">{ad.id}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                      {/* Status Badge */}
                      <span className={`text-[9px] font-black px-2 py-1 rounded border ${ad.status === 'active' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                        {ad.status?.toUpperCase() || 'PENDING'}
                      </span>
                      {/* Featured Badge */}
                      {ad.isFeatured && (
                        <span className="flex items-center gap-1 bg-yellow-400 text-white text-[9px] font-black px-2 py-1 rounded shadow-sm">
                          <Star size={10} fill="currentColor" /> FEATURED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-2">
                      {/* Approve/Decline */}
                      <button onClick={() => handleUpdateAdStatus(ad.id, 'active')} title="Approve" className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><CheckCircle2 size={18} /></button>
                      <button onClick={() => handleUpdateAdStatus(ad.id, 'declined')} title="Decline" className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"><XCircle size={18} /></button>
                      
                      {/* Feature Button */}
                      <button onClick={() => handleToggleFeatured(ad.id, ad.isFeatured)} className={`p-2 rounded-lg transition-colors ${ad.isFeatured ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-400 hover:bg-yellow-100'}`}>
                        <Star size={18} />
                      </button>

                      <Link to={`/ad/${ad.id}`} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><ExternalLink size={18} /></Link>
                      <button onClick={() => handleDeleteAd(ad.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              )) : users.map(u => (
                <tr key={u.uid} className="hover:bg-gray-50/30 transition-colors">
                  <td className="p-5">
                    <div className="font-bold text-gray-900">{u.displayName || 'Guest User'}</div>
                    <div className="text-[10px] text-gray-400 font-medium tracking-tight">{u.email}</div>
                  </td>
                  <td className="p-5">
                    <button 
                      onClick={() => toggleUserVerification(u.uid, u.isVerified)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black transition-all ${u.isVerified ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                    >
                      {u.isVerified ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                      {u.isVerified ? 'VERIFIED SELLER' : 'UNVERIFIED'}
                    </button>
                  </td>
                  <td className="p-5 text-right text-[10px] font-mono text-gray-300 italic">{u.uid.slice(0, 12)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}