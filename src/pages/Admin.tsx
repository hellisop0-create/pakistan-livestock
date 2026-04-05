import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trash2, LayoutDashboard, Users, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const ADMIN_EMAILS = ['saadatali1403@gmail.com', 'hellisop0@gmail.com', 'mehreensaadat2@gmail.com'].map(e => e.toLowerCase().trim());

export default function Admin() {
  const { user, isAdmin: isAuthAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [ads, setAds] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ads' | 'users'>('ads');

  const currentUserEmail = user?.email?.toLowerCase().trim();
  const isAdmin = isAuthAdmin || (currentUserEmail && ADMIN_EMAILS.includes(currentUserEmail));

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/admin-login');
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;

    const unsubAds = onSnapshot(collection(db, 'ads'), (snapshot) => {
      setAds(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ uid: d.id, ...d.data() })));
    });

    return () => {
      unsubAds();
      unsubUsers();
    };
  }, [isAdmin]);

  const handleDelete = async (type: 'ads' | 'users', id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${type === 'ads' ? 'listing' : 'user'}?`)) return;
    
    try {
      await deleteDoc(doc(db, type, id));
      toast.success('Deleted successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete');
    }
  };

  if (authLoading) return <div className="p-10 text-center font-bold text-gray-500 uppercase">Loading...</div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-2xl font-black text-gray-900 uppercase">Admin Panel</h1>
          
          <div className="flex bg-white p-1 rounded-xl border shadow-sm">
            <button 
              onClick={() => setActiveTab('ads')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-xs uppercase transition-all ${activeTab === 'ads' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutDashboard size={14} /> Listings
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-xs uppercase transition-all ${activeTab === 'users' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Users size={14} /> Sellers
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <th className="p-5">{activeTab === 'ads' ? 'Listing' : 'Seller'}</th>
                <th className="p-5">Details</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeTab === 'ads' ? (
                ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-5 flex items-center gap-4">
                      <img src={ad.images?.[0]} className="w-12 h-10 rounded object-cover border" alt="" />
                      <span className="font-bold text-sm uppercase truncate max-w-[200px]">{ad.title}</span>
                    </td>
                    <td className="p-5 text-green-600 font-black text-xs">
                      Rs {Number(ad.price).toLocaleString()}
                    </td>
                    <td className="p-5 text-right flex justify-end gap-2">
                      <button onClick={() => handleDelete('ads', ad.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                users.map((u) => (
                  <tr key={u.uid} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold uppercase text-xs">
                        {u.displayName?.charAt(0) || 'U'}
                      </div>
                      <span className="font-bold text-sm">{u.displayName || 'Unnamed Seller'}</span>
                    </td>
                    <td className="p-5 text-xs text-gray-400">{u.email}</td>
                    <td className="p-5 text-right">
                      <button onClick={() => handleDelete('users', u.uid)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {((activeTab === 'ads' && ads.length === 0) || (activeTab === 'users' && users.length === 0)) && (
            <div className="p-20 text-center text-gray-300 font-bold uppercase text-xs tracking-widest">
              No data found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}