import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, User, LogOut, Menu, X, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

export default function Navbar() {
  const { user, login, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileProfileRef = useRef<HTMLDivElement>(null);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ur' : 'en');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideDesktop = profileRef.current && !profileRef.current.contains(target);
      const isOutsideMobile = mobileProfileRef.current && !mobileProfileRef.current.contains(target);
      
      if (isOutsideDesktop && isOutsideMobile) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-[100] w-full bg-white border-b border-gray-100 shadow-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          
          {/* MOBILE PROFILE (LEFT) */}
          <div className="flex items-center lg:hidden z-20" ref={mobileProfileRef}>
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                >
                  <img
                    src={user.photoURL || 'https://picsum.photos/seed/user/100/100'}
                    alt="User"
                    className="w-8 h-8 rounded-full border-2 border-green-700"
                  />
                </button>

                {isProfileOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-75">
                    <Link 
                      to="/profile" 
                      onClick={() => setIsProfileOpen(false)} 
                      className="block px-4 py-3 text-sm font-bold text-gray-700 hover:bg-green-50"
                    >
                      {t('profile')}
                    </Link>
                    <button
                      onClick={() => { logout(); setIsProfileOpen(false); }}
                      className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={login} className="p-2 text-gray-700">
                <User className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* LOGO SECTION */}
          <div className="absolute inset-0 flex justify-center items-center lg:static lg:inset-auto lg:justify-start pointer-events-none">
            <Link to="/" className="flex items-center space-x-2 pointer-events-auto">
              <img
                src="https://i.postimg.cc/Cx3wyT7Y/Gemini_Generated_Image_cbcknocbcknocbck_removebg_preview.png"
                alt="Logo"
                className="h-10 w-auto object-contain sm:h-12"
              />
              <span className={cn(
               "text-2xl font-black font-brand bg-gradient-to-r from-green-700 to-green-900 bg-clip-text text-transparent hidden sm:block",
                language === 'ur' && "font-urdu text-green-900"
              )}>
                {t('appName')}
              </span>
            </Link>
          </div>

          {/* DESKTOP NAVIGATION */}
          <div className="hidden lg:flex lg:items-center lg:ml-auto lg:space-x-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Globe className="w-5 h-5" />
              <span>{language === 'en' ? 'اردو' : 'English'}</span>
            </button>

            <Link to="/browse" className="px-3 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-100">
              {t('categories')}
            </Link>

            <Link to="/admin" className="px-3 py-2 rounded-md text-green-700 font-bold hover:bg-gray-100">
              {t('admin')}
            </Link>

            {user ? (
              <>
                <Link
                  to="/post-ad"
                  className="flex items-center space-x-1 bg-orange-500 text-white px-5 py-2.5 rounded-full hover:bg-orange-600 shadow-md transition-all active:scale-95"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span className="font-bold">{t('postAd')}</span>
                </Link>

                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 p-1 rounded-full hover:opacity-80 focus:outline-none"
                  >
                    <img
                      src={user.photoURL || 'https://picsum.photos/seed/user/100/100'}
                      alt="User"
                      className="w-9 h-9 rounded-full border-2 border-green-700 shadow-sm"
                    />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="block px-4 py-3 text-sm font-bold text-gray-700 hover:bg-green-50">
                        {t('profile')}
                      </Link>
                      <button
                        onClick={() => { logout(); setIsProfileOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('logout')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button onClick={login} className="bg-green-700 text-white px-8 py-2.5 rounded-full hover:bg-green-800 shadow-lg font-bold transition-all">
                {t('login')}
              </button>
            )}
          </div>

          {/* MOBILE CONTROLS */}
          <div className="flex items-center ml-auto space-x-1 lg:hidden z-20">
            <button onClick={toggleLanguage} className="p-2 text-gray-700 hover:bg-gray-100 rounded-full">
              <Globe className="w-6 h-6" />
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MAIN MENU */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-2xl py-6 px-4 space-y-3 lg:hidden animate-in slide-in-from-top-4 duration-300">
          <Link to="/browse" onClick={() => setIsMenuOpen(false)} className="block px-5 py-4 text-gray-700 font-bold hover:bg-green-50 rounded-2xl">
            {t('categories')}
          </Link>
          <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="block px-5 py-4 text-green-700 font-black hover:bg-green-50 rounded-2xl">
            {t('admin')}
          </Link>
          {user && (
            <Link to="/post-ad" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center space-x-2 px-5 py-4 bg-orange-500 text-white rounded-2xl text-center font-black shadow-lg shadow-orange-100">
              <PlusCircle className="w-5 h-5" />
              <span>{t('postAd')}</span>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}