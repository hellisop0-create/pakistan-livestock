import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Messages from './pages/Messages';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import { Toaster } from 'sonner';

// Pages
import Home from './pages/Home';
import Browse from './pages/Browse';
import AdDetail from './pages/AdDetail';
import PostAd from './pages/PostAd';
import EditAd from './pages/EditAd'; // Fixed relative path
import Profile from './pages/Profile';
import SearchPage from './pages/SearchPage';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';

export default function App() {
  const [showCaution, setShowCaution] = useState(true);

  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />

          <div className="min-h-screen flex flex-col bg-gray-50 font-sans relative">
            
            {/* Caution Popup - Glass Overlay */}
            {showCaution && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-md bg-white/30 p-4">
                <div className="bg-white border border-gray-100 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center ring-1 ring-black/5">
                  <div className="flex justify-center mb-4">
                    <div className="bg-amber-50 p-4 rounded-full">
                      <span className="text-4xl">⚠️</span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 mb-4 text-center w-full">
                    Caution Notice
                  </h2>
                  
                  <ol className="text-gray-600 mb-8 leading-relaxed text-left w-full space-y-3 px-2">
                    <li className="flex gap-2">
                      <span className="font-bold">1.</span>
                      <span>Make sure to meet the Buyer/Seller in the public/crowded place.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold">2.</span>
                      <span>Do not pay anything in advance.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold">3.</span>
                      <span>Do not post anything prohibited on this website.</span>
                    </li>
                  </ol>
                  <h3 className="text-m font-extrabold text-gray-900 mb-2">Pakistan Livestock Mandi and Admins are not responsible for any kind of scam</h3>
                  <button
                    onClick={() => setShowCaution(false)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95 shadow-lg"
                  >
                    I Understand & Enter
                  </button>
                </div>
              </div>
            )}

            {/* Header / Navigation */}
            <Navbar />

            {/* Main Content Area */}
            <main className="flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/ad/:id" element={<AdDetail />} />

                {/* User Action Routes */}
                <Route path="/post-ad" element={<PostAd />} />
                <Route path="/edit-ad/:id" element={<EditAd />} />
                <Route path="/profile" element={<Profile />} />
                
                {/* Admin Routes */}
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/admin" element={<Admin />} />

                {/* Catch-all: You could add a 404 page here later */}
                <Route path="*" element={<Home />} />
              </Routes>
            </main>

            {/* Footer */}
            <Footer />

            {/* Notifications Overlay */}
            <Toaster position="top-center" richColors closeButton />
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}