import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Ad, User, Transaction } from '../types';
import { CheckCircle, XCircle, Shield, Users, FileText, CreditCard, ExternalLink, ShieldCheck, AlertCircle, Lock } from 'lucide-react';
import { formatPrice, cn } from '../lib/utils';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function Admin() {
  const { isAdmin } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ads' | 'users' | 'payments'>('ads');

  // --- NEW AUTHENTICATION STATE ---
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    // Only fetch data if the panel is unlocked AND the user is a Firebase Admin
    // (Or just check isUnlocked if you want to bypass the Firebase isAdmin check)
    if (!isUnlocked) return;

    const unsubAds = onSnapshot(collection(db, 'ads'), (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad)));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));
    });

    const unsubTrans = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
      setLoading(false);
    });

    return () => {
      unsubAds();
      unsubUsers();
      unsubTrans();
    };
  }, [isUnlocked]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // SET YOUR DESIRED CREDENTIALS HERE
    if (email === "zaheerhussainhussain16@gmail.com" && password === "admin1234") {
      setIsUnlocked(true);
      setAuthError('');
      toast.success('Dashboard Unlocked');
    } else {
      setAuthError('Invalid administrator credentials');
      toast.error('Access Denied');
    }
  };

  // --- LOGIN UI GATE ---
  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
          <div className="text-center mb-8">
            <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-green-700" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Admin Access</h2>
            <p className="text-gray-500 text-sm mt-2">Enter credentials to manage CITYCARE</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                placeholder="admin@citycare.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {authError && (
              <div className="flex items-center text-red-600 text-sm font-medium bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 mr-2" />
                {authError}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl shadow-lg transition-all transform active:scale-[0.98]"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleApproveAd = async (adId: string) => {
    try {
      await updateDoc(doc(db, 'ads', adId), { status: 'active' });
      toast.success('Ad approved');
    } catch (error) {
      toast.error('Error approving ad');
    }
  };

  const handleRejectAd = async (adId: string) => {
    try {
      await updateDoc(doc(db, 'ads', adId), { status: 'rejected' });
      toast.success('Ad rejected');
    } catch (error) {
      toast.error('Error rejecting ad');
    }
  };

  const handleVerifyUser = async (userId: string, isVerified: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isVerified: !isVerified });
      toast.success(isVerified ? 'Verification removed' : 'User verified');
    } catch (error) {
      toast.error('Error updating user');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Shield className="w-8 h-8 mr-3 text-green-700" />
              Admin Dashboard
            </h1>
            <button 
              onClick={() => setIsUnlocked(false)} 
              className="ml-4 text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-full text-gray-600 transition-colors"
            >
              Lock Panel
            </button>
          </div>
          <div className="flex space-x-4">
            <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-200 text-center">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Ads</div>
              <div className="text-2xl font-bold text-green-700">{ads.length}</div>
            </div>
            <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-200 text-center">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Pending</div>
              <div className="text-2xl font-bold text-orange-600">{ads.filter(a => a.status === 'pending').length}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('ads')}
            className={cn(
              "px-6 py-3 rounded-xl font-bold flex items-center space-x-2 transition-all",
              activeTab === 'ads' ? "bg-green-700 text-white shadow-lg" : "bg-white text-gray-600 hover:bg-gray-100"
            )}
          >
            <FileText className="w-5 h-5" />
            <span>Ad Management</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              "px-6 py-3 rounded-xl font-bold flex items-center space-x-2 transition-all",
              activeTab === 'users' ? "bg-green-700 text-white shadow-lg" : "bg-white text-gray-600 hover:bg-gray-100"
            )}
          >
            <Users className="w-5 h-5" />
            <span>User Management</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={cn(
              "px-6 py-3 rounded-xl font-bold flex items-center space-x-2 transition-all",
              activeTab === 'payments' ? "bg-green-700 text-white shadow-lg" : "bg-white text-gray-600 hover:bg-gray-100"
            )}
          >
            <CreditCard className="w-5 h-5" />
            <span>Payments</span>
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {activeTab === 'ads' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Ad Details</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Seller</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Price</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ads.map(ad => (
                    <tr key={ad.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img src={ad.images?.[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                          <div>
                            <div className="font-bold text-gray-900">{ad.title}</div>
                            <div className="text-xs text-gray-500">{ad.category} • {ad.city}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{ad.sellerName}</td>
                      <td className="px-6 py-4 font-bold text-green-700">{formatPrice(ad.price)}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded uppercase",
                          ad.status === 'active' ? "bg-green-100 text-green-700" :
                          ad.status === 'pending' ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                        )}>
                          {ad.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {ad.status === 'pending' && (
                            <button onClick={() => handleApproveAd(ad.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          <button onClick={() => handleRejectAd(ad.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <XCircle className="w-5 h-5" />
                          </button>
                          <Link to={`/ad/${ad.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <ExternalLink className="w-5 h-5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700">User</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Email</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Role</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Verified</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u.uid} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img src={u.photoURL} alt="" className="w-10 h-10 rounded-full" />
                          <div className="font-bold text-gray-900">{u.displayName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                      <td className="px-6 py-4 text-sm font-medium uppercase">{u.role}</td>
                      <td className="px-6 py-4">
                        {u.isVerified ? (
                          <ShieldCheck className="w-5 h-5 text-blue-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-gray-300" />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleVerifyUser(u.uid, u.isVerified)}
                          className={cn(
                            "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                            u.isVerified ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          )}
                        >
                          {u.isVerified ? 'Unverify' : 'Verify Seller'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}