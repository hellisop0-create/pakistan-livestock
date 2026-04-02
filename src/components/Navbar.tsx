import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, PlusCircle, User, LogOut, Menu, X, Globe } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { cn } from '../lib/utils';

export default function Navbar() {
  const { user, login, logout } = useAuth(); 
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Mobile menu state
  const [isProfileOpen, setIsProfileOpen] = useState(false); // Desktop profile state
  const profileRef = useRef(null); // Ref to detect outside clicks
  const navigate = useNavigate();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ur' : 'en');
  };

  // Close profile menu when clicking anywhere else
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-green-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">LM</span>
            </div>
            <span className={cn(
              "text-xl font-bold text-green-900 hidden sm:block",
              language === 'ur' && "font-urdu"
            )}>
              {t('appName')}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Globe className="w-5 h-5" />
              <span>{language === 'en' ? 'اردو' : 'English'}</span>
            </button>

            <Link
              to="/browse"
              className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {t('categories')}
            </Link>

            {/* Admin Panel Link - Now visible to everyone */}
            <Link 
              to="/admin" 
              className="px-3 py-2 rounded-md text-green-700 font-bold hover:bg-gray-100 transition-colors"
            >
              {t('admin')}
            </Link>

            {user ? (
              <>
                <Link
                  to="/post-ad"
                  className="flex items-center space-x-1 bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition-all shadow-md hover:shadow-lg"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span className="font-semibold">{t('postAd')}</span>
                </Link>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100"
                  >
                    <img
                      src={user.photoURL || 'https://picsum.photos/seed/user/100/100'}
                      alt={user.displayName || 'User'}
                      className="w-8 h-8 rounded-full border-2 border-green-700"
                    />
                  </button>
                  
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl border border-gray-100 py-1 z-50">
                      <Link 
                        to="/profile" 
                        onClick={() => setIsProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {t('profile')}
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('logout')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={login}
                className="bg-green-700 text-white px-6 py-2 rounded-full hover:bg-green-800 transition-all shadow-md"
              >
                {t('login')}
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <button onClick={toggleLanguage} className="p-2 text-gray-700">
              <Globe className="w-6 h-6" />
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-4 px-4 space-y-2">
          <Link to="/browse" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
            {t('categories')}
          </Link>

          {/* Mobile Admin Link - Visible to everyone */}
          <Link to="/admin" className="block px-4 py-2 text-green-700 font-bold hover:bg-gray-100 rounded-md">
            {t('admin')}
          </Link>

          {user ? (
            <>
              <Link to="/post-ad" className="block px-4 py-2 bg-orange-500 text-white rounded-md text-center font-bold">
                {t('postAd')}
              </Link>
              <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                {t('profile')}
              </Link>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 rounded-md flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('logout')}</span>
              </button>
            </>
          ) : (
            <button
              onClick={login}
              className="w-full bg-green-700 text-white px-4 py-2 rounded-md font-bold"
            >
              {t('login')}
            </button>
          )}
        </div>
      )}
    </nav>
  );
}