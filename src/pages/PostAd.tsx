import React, { useState, useEffect } from 'react'; // Added useEffect
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Camera, MapPin, Phone, AlertCircle, Loader2, X, Image as ImageIcon, Clock, EyeOff, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { LOCATION_DATA } from '../components/locations'; // Import your location JSON

// 1. Updated Schema with province
const adSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  price: z.number().min(0, 'Price must be positive'),
  category: z.enum(['Cow', 'Buffalo', 'Goat', 'Sheep', 'Camel', 'Others']),
  breed: z.string().min(2, 'Breed is required'),
  age: z.string().min(1, 'Age is required'),
  weight: z.string().min(1, 'Weight is required'),
  healthCondition: z.string().min(2, 'Health condition is required'),
  province: z.string().min(1, 'Province is required'), // Added
  city: z.string().min(1, 'City is required'),
  area: z.string().min(2, 'Area is required'),
  phoneNumber: z.string().regex(/^(\+92|0)3[0-9]{9}$/, 'Invalid Pakistani phone number'),
  hidePhoneNumber: z.boolean(),
});

type AdFormData = z.infer<typeof adSchema>;

export default function PostAd() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [showPhotoPopup, setShowPhotoPopup] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AdFormData>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      category: 'Cow',
      phoneNumber: user?.phoneNumber || '',
      hidePhoneNumber: false,
    }
  });

  // 2. Watch location values to update dropdowns dynamically
  const watchProvince = watch('province');
  const watchCity = watch('city');

  // Filter Logic
  const provinces = [...new Set(LOCATION_DATA.map(item => item.province))].sort();
  const cities = LOCATION_DATA
    .filter(item => item.province === watchProvince)
    .map(item => item.city)
    .sort();
  const suggestedAreas = LOCATION_DATA
    .find(item => item.city === watchCity && item.province === watchProvince)?.area || [];

  // Reset dependent fields when parent changes
  useEffect(() => {
    setValue('city', '');
    setValue('area', '');
  }, [watchProvince, setValue]);

  useEffect(() => {
    setValue('area', '');
  }, [watchCity, setValue]);

  // ... (handleImageAdd, removeImage, and onSubmit remain exactly as you had them)
  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      if (selectedFiles.length + newFiles.length > 5) {
        toast.error('Maximum 5 images allowed');
        return;
      }
      setSelectedFiles(prev => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file as File));
      setPreviews(prev => [...prev, ...newPreviews]);
      setShowPhotoPopup(false);
      toast.success(`${newFiles.length} photo(s) selected`);
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: AdFormData) => {
    if (selectedFiles.length === 0) return toast.error("Please add at least one photo");
    
    setLoading(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const q = query(
        collection(db, 'ads'),
        where('sellerUid', '==', user?.uid),
        where('createdAt', '>=', thirtyDaysAgo.toISOString())
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.size >= 7) {
        toast.error("You have reached the limit of 7 ads per month.");
        setLoading(false);
        return;
      }

      const uploadedUrls: string[] = [];
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'ml_folder2');

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/dmrgu1ebl/image/upload`,
          { method: 'POST', body: formData }
        );

        if (!response.ok) throw new Error("Cloudinary upload failed");
        const resData = await response.json();
        if (resData.secure_url) uploadedUrls.push(resData.secure_url);
      }

      await addDoc(collection(db, 'ads'), {
        ...data,
        images: uploadedUrls,
        sellerUid: user?.uid,
        sellerName: user?.displayName || 'Seller',
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      setShowSuccessModal(true); 
    } catch (error: any) {
      console.error("Final Error:", error);
      toast.error(error.message || 'Failed to post ad.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="text-gray-600 mb-8">You must be logged in to post an advertisement.</p>
          <button onClick={() => navigate('/')} className="bg-green-700 text-white px-8 py-3 rounded-full font-bold">
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 pb-24 font-sans">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-green-700 px-8 py-8 text-white">
            <h1 className="text-3xl font-bold">{t('postAd')}</h1>
            <p className="text-green-100 opacity-80 mt-1">Fill in the details to list your animal for sale.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-8">
            
            {/* ... Photo Section (Keep your existing code here) ... */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-green-600" />
                Animal Photos
              </h3>
              
              {previews.length < 5 && (
                <div 
                  onClick={() => setShowPhotoPopup(true)}
                  className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:bg-green-50 transition-all group"
                >
                  <div className="p-4 bg-green-100 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <Camera className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600 font-bold">Add Photo</p>
                  <p className="text-xs text-gray-400 mt-1">Camera or Gallery (Max 5)</p>
                </div>
              )}
              
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {previews.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                    <img src={url} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ... Ad Details (Keep your existing Title, Category, Price, Desc) ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="md:col-span-2">
                 <label className="block text-sm font-bold text-gray-700 mb-2">Ad Title</label>
                 <input {...register('title')} placeholder="e.g. Sahiwal Cow for Sale" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" />
                 {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
               </div>
               {/* ... other standard fields ... */}
            </div>

            <hr className="border-gray-100" />

            {/* NEW LOCATION SECTION */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-green-600" />
                Location
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Province Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">Province</label>
                  <select 
                    {...register('province')}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none appearance-none font-bold text-gray-700"
                  >
                    <option value="">Select Province</option>
                    {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 bottom-5 w-4 h-4 text-gray-400" />
                  {errors.province && <p className="text-red-500 text-[10px] mt-1">{errors.province.message}</p>}
                </div>

                {/* City Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">City</label>
                  <select 
                    {...register('city')}
                    disabled={!watchProvince}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none appearance-none font-bold text-gray-700 disabled:opacity-50"
                  >
                    <option value="">Select City</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 bottom-5 w-4 h-4 text-gray-400" />
                  {errors.city && <p className="text-red-500 text-[10px] mt-1">{errors.city.message}</p>}
                </div>

                {/* Area Input with Datalist */}
                <div className="relative">
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">Area / Village</label>
                  <input 
                    {...register('area')}
                    list="post-area-list"
                    disabled={!watchCity}
                    placeholder="e.g. Latifabad Unit 2"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold text-gray-700 disabled:opacity-50"
                  />
                  <datalist id="post-area-list">
                    {suggestedAreas.map(a => <option key={a} value={a} />)}
                  </datalist>
                  {errors.area && <p className="text-red-500 text-[10px] mt-1">{errors.area.message}</p>}
                </div>
              </div>
            </div>

            {/* ... Rest of your form (Phone, Hide Toggle, Submit Button) ... */}
            <div className="sm:col-span-2 relative">
                <Phone className="absolute left-4 top-[58px] -translate-y-1/2 text-gray-400 w-5 h-5" />
                <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">Contact Number</label>
                <input {...register('phoneNumber')} placeholder="Phone Number (0300...)" className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" />
                {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</p>}
            </div>

            {/* ... Hide Phone and Submit ... */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center space-x-3 shadow-xl disabled:opacity-70 active:scale-[0.98] transition-all"
            >
              {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <span>Post Advertisement</span>}
            </button>
          </form>
        </div>
      </div>
      {/* ... Success Modal ... */}
    </div>
  );
}