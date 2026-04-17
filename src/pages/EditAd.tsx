import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Ad, Category } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Loader2, 
  Upload, 
  X, 
  ChevronLeft, 
  Image as ImageIcon,
  Save
} from 'lucide-react';

const CATEGORIES: Category[] = ['Cattle', 'Buffalo', 'Goat', 'Sheep', 'Camel', 'Others'];

export default function EditAd() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Form State matching your Ad interface exactly
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Cattle' as Category,
    breed: '',
    age: '',
    weight: '',
    healthCondition: '',
    city: '',
    area: '',
    phoneNumber: '',
    whatsappLink: '',
    images: [] as string[]
  });

  useEffect(() => {
    const fetchAd = async () => {
      if (!id || !user) return;
      try {
        const docRef = doc(db, 'ads', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as Ad;
          
          // Security: Only owner can edit
          if (data.sellerUid !== user.uid) {
            toast.error("You do not have permission to edit this ad");
            navigate('/profile');
            return;
          }

          setFormData({
            title: data.title || '',
            description: data.description || '',
            price: data.price.toString() || '',
            category: data.category || 'Cattle',
            breed: data.breed || '',
            age: data.age || '',
            weight: data.weight || '',
            healthCondition: data.healthCondition || '',
            city: data.city || '',
            area: data.area || '',
            phoneNumber: data.phoneNumber || '',
            whatsappLink: data.whatsappLink || '',
            images: data.images || []
          });
        } else {
          toast.error("Ad not found");
          navigate('/profile');
        }
      } catch (error) {
        toast.error("Error loading ad data");
      } finally {
        setLoading(false);
      }
    };
    fetchAd();
  }, [id, user, navigate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    
    // Cloudinary Config
    const CLOUD_NAME = 'dmrgu1ebl';
    const UPLOAD_PRESET = 'ml_folder2'; // REPLACE THIS WITH YOUR PRESET NAME

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const body = new FormData();
        body.append('file', files[i]);
        body.append('upload_preset', UPLOAD_PRESET);
        
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: body
        });
        
        const data = await res.json();
        
        // Cloudinary returns 'secure_url' on success
        if (data.secure_url) {
          uploadedUrls.push(data.secure_url);
        } else {
          console.error("Cloudinary Error:", data.error?.message);
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls]
        }));
        toast.success("Images uploaded");
      }
    } catch (err) {
      toast.error("Image upload failed");
    } finally {
      setUploadingImages(false);
      if (e.target) e.target.value = ''; // Reset input to allow re-selection
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (formData.images.length === 0) return toast.error("Add at least one image");

    setUpdating(true);
    try {
      const docRef = doc(db, 'ads', id);
      await updateDoc(docRef, {
        ...formData,
        price: Number(formData.price),
        status: 'pending', // Re-verify after edit
        updatedAt: new Date().toISOString()
      });
      toast.success("Ad updated successfully!");
      navigate('/profile');
    } catch (error) {
      toast.error("Failed to update ad");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-green-600" size={40} /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-6">
      <div className="mx-auto max-w-4xl px-4">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-gray-600 hover:text-green-700">
          <ChevronLeft size={20} /> <span>Back</span>
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-10">
            <h1 className="mb-8 text-2xl font-bold text-gray-900">Edit Your Listing</h1>

            {/* Basic Info */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-gray-700">Ad Title</label>
                <input 
                  required
                  className="w-full rounded-2xl border bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Beautiful Sahiwal Cattle for Sale"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Category</label>
                <select 
                  className="w-full rounded-2xl border bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as Category})}
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Price (PKR)</label>
                <input 
                  type="number" required
                  className="w-full rounded-2xl border bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
              </div>
            </div>

            {/* Livestock Details */}
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <h2 className="md:col-span-2 text-lg font-bold text-green-700 border-b pb-2">Animal Details</h2>
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Breed</label>
                <input 
                  className="w-full rounded-2xl border bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.breed}
                  onChange={(e) => setFormData({...formData, breed: e.target.value})}
                  placeholder="e.g. Sahiwal, Gulabi"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Age</label>
                <input 
                  className="w-full rounded-2xl border bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  placeholder="e.g. 2 Years"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Weight (KG)</label>
                <input 
                  className="w-full rounded-2xl border bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  placeholder="e.g. 250kg"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Health Condition</label>
                <input 
                  className="w-full rounded-2xl border bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.healthCondition}
                  onChange={(e) => setFormData({...formData, healthCondition: e.target.value})}
                  placeholder="e.g. Fully Vaccinated"
                />
              </div>
            </div>

            {/* Location & Contact */}
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <h2 className="md:col-span-2 text-lg font-bold text-green-700 border-b pb-2">Location & Contact</h2>
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">City</label>
                <input required
                  className="w-full rounded-2xl border bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Area</label>
                <input required
                  className="w-full rounded-2xl border bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.area}
                  onChange={(e) => setFormData({...formData, area: e.target.value})}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Phone Number</label>
                <input required
                  className="w-full rounded-2xl border bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">WhatsApp Link</label>
                <input 
                  className="w-full rounded-2xl border bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.whatsappLink}
                  onChange={(e) => setFormData({...formData, whatsappLink: e.target.value})}
                  placeholder="https://wa.me/..."
                />
              </div>
            </div>

            {/* Images */}
            <div className="mt-8">
              <label className="mb-2 block text-sm font-bold text-gray-700">Animal Images</label>
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
                {formData.images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl border bg-gray-100">
                    <img src={img} className="h-full w-full rounded-xl object-cover" alt="" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-lg">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages}
                  className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-green-500 hover:text-green-500"
                >
                  {uploadingImages ? <Loader2 className="animate-spin" /> : <><ImageIcon size={24} /><span className="text-[10px] font-bold">Add Photo</span></>}
                </button>
              </div>
              <input type="file" hidden multiple ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
            </div>

            {/* Description */}
            <div className="mt-8">
              <label className="mb-2 block text-sm font-bold text-gray-700">Detailed Description</label>
              <textarea 
                required rows={4}
                className="w-full rounded-2xl border bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-green-500"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                type="submit" 
                disabled={updating || uploadingImages}
                className="flex flex-1 items-center justify-center rounded-2xl bg-green-700 py-4 font-bold text-white shadow-lg shadow-green-100 hover:bg-green-800 disabled:opacity-50"
              >
                {updating ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={20} />}
                Update Ad
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}