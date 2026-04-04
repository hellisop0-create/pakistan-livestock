import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Trash2, Hash, LayoutDashboard, Users, Star, 
  CheckCircle2, XCircle, ExternalLink, ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

export default function Admin() {
  const { user, isAdmin: isAuthAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [ads, setAds] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ads' | 'users'>('ads');

  const isAdmin = isAuthAdmin || user?.email === 'saadatali1403@gmail.com';

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/admin-login');
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    const unsubAds = onSnapshot(collection(db, 'ads'), (s) => setAds(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubUsers = onSnapshot(collection(db, 'users'), (s) => setUsers(s.docs.map(d => ({ uid: d.id, ...d.data() }))));
    return () => { unsubAds(); unsubUsers(); };
  }, [isAdmin]);

  // Actions...
  const handleUpdateStatus = async (id: string, s: 'active' | 'declined') => {
    try { await updateDoc(doc(db, 'ads', id), { status: s }); toast.success(`Ad ${s}`); } 
    catch { toast.error('Update failed'); }
  };

  if (authLoading) return <div className="p-10 text-center font-bold text-green-700">Loading Secure Layer...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* RESPONSIVE HEADER */}
        <div className="flex flex-col space-y-4 mb-6">
          <div className="text-center md:text-left">
            <h1 className="text-2xl sm:text-4xl font-black text-gray-900 uppercase">Admin Panel</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Operations Dashboard</p>
          </div>

          {/* TAB SWITCHER - Scrollable on Mobile */}
          <div className="flex bg-white p-1 rounded-xl border shadow-sm w-full overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => setActiveTab('ads')} 
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-black text-[10px] uppercase transition-all whitespace-nowrap ${activeTab === 'ads' ? 'bg-green-600 text-white' : 'text-gray-400'}`}
            >
              <LayoutDashboard size={14} /> Listings ({ads.length})
            </button>
            <button 
              onClick={() => setActiveTab('users')} 
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-black text-[10px] uppercase transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-green-600 text-white' : 'text-gray-400'}`}
            >
              <Users size={14} /> Sellers ({users.length})
            </button>
          </div>
        </div>

        {/* MOBILE LIST (Visible on small screens) */}
        <div className="block lg:hidden space-y-3">
          {activeTab === 'ads' ? ads.map(ad => (
            <div key={ad.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex gap-3 items-start mb-3">
                <img src={ad.images?.[0]} className="w-16 h-16 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{ad.title}</h3>
                  <p className="text-green-600 font-black text-xs">Rs {Number(ad.price).toLocaleString()}</p>
                  <span className={`inline-block mt-1 text-[8px] font-black px-2 py-0.5 rounded border uppercase ${ad.status === 'active' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                    {ad.status || 'Pending'}
                  </span>
                </div>
              </div>
              
              {/* MOBILE ACTIONS - Wrapping Flexbox */}
              <div className="flex flex-wrap gap-2 pt-3 border-t justify-between items-center">
                <div className="flex gap-1">
                  <button onClick={() => handleUpdateStatus(ad.id, 'active')} className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 size={18} /></button>
                  <button onClick={() => handleUpdateStatus(ad.id, 'declined')} className="p-2 bg-orange-50 text-orange-600 rounded-lg"><XCircle size={18} /></button>
                </div>
                <div className="flex gap-1">
                  <Link to={`/ad/${ad.id}`} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ExternalLink size={18} /></Link>
                  <button onClick={() => {/* delete */}} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          )) : users.map(u => (
             <div key={u.uid} className="bg-white p-4 rounded-xl border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">{u.displayName?.charAt(0)}</div>
                  <div className="text-sm font-bold">{u.displayName}</div>
                </div>
                <button className="text-red-400 p-2"><Trash2 size={18} /></button>
             </div>
          ))}
        </div>

        {/* DESKTOP TABLE (Hidden on Mobile/Tablet) */}
        <div className="hidden lg:block bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <th className="p-5">Listing</th>
                <th className="p-5">Price</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ads.map(ad => (
                <tr key={ad.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <img src={ad.images?.[0]} className="w-12 h-10 rounded object-cover" />
                      <span className="font-bold text-sm">{ad.title}</span>
                    </div>
                  </td>
                  <td className="p-5 text-sm font-black text-green-600">Rs {Number(ad.price).toLocaleString()}</td>
                  <td className="p-5">
                    <span className="text-[9px] font-black px-2 py-0.5 rounded border uppercase">{ad.status}</span>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleUpdateStatus(ad.id, 'active')} className="text-green-600"><CheckCircle2 size={18} /></button>
                      <button onClick={() => handleUpdateStatus(ad.id, 'declined')} className="text-orange-600"><XCircle size={18} /></button>
                      <Link to={`/ad/${ad.id}`} className="text-blue-600"><ExternalLink size={18} /></Link>
                    </div>
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