"use client";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { getSupabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { SuccessModal } from './SuccessModal';

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false });

const reportSchema = z.object({
  type: z.enum(['lost', 'found']),
  title: z.string().min(3, 'Title is too short'),
  category: z.string().min(2, 'Select a category'),
  description: z.string().min(10, 'Please add more details'),
  date: z.string().min(1, 'Date is required'),
  location: z.string().min(2, 'Location is required'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  contact: z.string().email('Valid email required').optional().or(z.literal('')),
  reward: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === '' || val === null || val === undefined) return null;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? null : num;
  }),
  reward_currency: z.string().optional(), // ISO currency code (e.g., USD, EUR, AED)
  handover_location_private: z.string().optional()
});

type ReportFormValues = z.infer<typeof reportSchema>;

export function ReportForm() {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const categories = useMemo(() => ['Wallet', 'Keys', 'Electronics', 'Bag', 'Clothing', 'Other'], []);
  const currencies = useMemo(() => ['USD', 'EUR', 'AED', 'EGP', 'SAR', 'GBP'], []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: { type: 'lost' }
  });

  const currentType = watch('type');

  const onSubmit = async (values: ReportFormValues) => {
    const supabase = getSupabase();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('You must be signed in to submit a report.');
      return;
    }

    // 1) Upload image if provided
    let publicUrl: string | undefined;
    if (file) {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;
      // Store under items/<filename> so the final public URL becomes
      // https://<proj>.supabase.co/storage/v1/object/public/items/items/<filename>
      const path = `items/${unique}`;
      const { error: uploadError } = await supabase.storage
        .from('items')
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) {
        alert(`Image upload failed: ${uploadError.message}`);
        return;
      }
      const { data: pub } = supabase.storage.from('items').getPublicUrl(path);
      publicUrl = pub?.publicUrl;
    }

    // 2) Insert item row with user_id
    const { error: insertError } = await supabase.from('items').insert({
      title: values.title,
      description: values.description,
      // DB expects category to satisfy items_category_check (likely 'lost' | 'found')
      category: values.type,
      location: values.location,
      date: values.date,
      lat: values.lat ?? null,
      lng: values.lng ?? null,
      image_url: publicUrl ?? null,
      user_id: user.id,
      reward: values.reward ?? null,
      reward_currency: values.reward_currency ?? null,
      handover_location_private: values.handover_location_private ?? null,
      contact_email: values.contact && values.contact.trim() !== '' ? values.contact.trim() : null // Save contact email from form
    });
    if (insertError) {
      alert(`Saving report failed: ${insertError.message}`);
      return;
    }

    // Show success modal
    setShowSuccessModal(true);
    reset({ type: currentType });
    setPreview(null);
    setFile(null);
  };

  const handleViewMyItems = () => {
    setShowSuccessModal(false);
    router.push('/my-items' as any);
  };

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="inline-flex rounded-full border border-gray-200 p-1 bg-white">
        <button type="button" onClick={() => setValue('type', 'lost')} className={`px-4 py-2 rounded-full text-sm ${currentType === 'lost' ? 'bg-black text-white' : 'text-black'}`}>Lost Item</button>
        <button type="button" onClick={() => setValue('type', 'found')} className={`px-4 py-2 rounded-full text-sm ${currentType === 'found' ? 'bg-black text-white' : 'text-black'}`}>Found Item</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Item Name</label>
          <input type="text" placeholder="e.g. Black wallet with card holder" {...register('title')} className="w-full border rounded-lg px-3 py-2" />
          {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select {...register('category')} className="w-full border rounded-lg px-3 py-2">
            <option value="">Select...</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea rows={4} placeholder="Add distinctive features, brand, color, etc." {...register('description')} className="w-full border rounded-lg px-3 py-2" />
        {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date {currentType === 'lost' ? 'Lost' : 'Found'}</label>
          <input type="date" {...register('date')} className="w-full border rounded-lg px-3 py-2" />
          {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Contact Email {currentType === 'found' && <span className="text-red-500">*</span>}
          </label>
          <input 
            type="email" 
            placeholder="you@example.com" 
            {...register('contact', {
              required: currentType === 'found' ? 'Contact email is required for found items to receive notifications' : false
            })} 
            className="w-full border rounded-lg px-3 py-2" 
          />
          {errors.contact && <p className="text-red-600 text-sm mt-1">{errors.contact.message}</p>}
          {currentType === 'found' && (
            <p className="text-xs text-gray-500 mt-1">This email will be used to send you notifications when someone claims your found item.</p>
          )}
        </div>
      </div>

      {currentType === 'lost' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Reward (optional)</label>
            <input 
              type="text" 
              placeholder="Enter reward amount (optional)" 
              {...register('reward')} 
              className="w-full border rounded-lg px-3 py-2" 
            />
            {errors.reward && <p className="text-red-600 text-sm mt-1">{errors.reward.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Currency</label>
            <select 
              {...register('reward_currency')} 
              className="w-full border rounded-lg px-3 py-2"
              defaultValue="USD"
            >
              {currencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {currentType === 'found' && (
        <div>
          <label className="block text-sm font-medium mb-1">Handover Location</label>
          <input 
            type="text" 
            placeholder="Enter where you can hand over the item" 
            {...register('handover_location_private')} 
            className="w-full border rounded-lg px-3 py-2" 
          />
          {errors.handover_location_private && <p className="text-red-600 text-sm mt-1">{errors.handover_location_private.message}</p>}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Location</label>
        <div className="h-64 rounded-xl overflow-hidden border border-gray-200 relative z-0">
          <MapPicker onPick={(pos) => { setValue('lat', pos.lat); setValue('lng', pos.lng); }} />
        </div>
        <input type="text" placeholder="e.g. Main Street Station" {...register('location')} className="mt-3 w-full border rounded-lg px-3 py-2" />
        {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Image Upload</label>
        <label className="relative inline-flex items-center justify-center px-3 py-3 bg-accent text-white rounded-full font-semibold cursor-pointer hover:bg-accent/90 active:bg-accent/80 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md">
          <span className="mr-2">Choose Image</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFile(f);
              if (!f) { setPreview(null); return; }
              const reader = new FileReader();
              reader.onload = () => setPreview(String(reader.result));
              reader.readAsDataURL(f);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </label>
        {file && (
          <p className="mt-2 text-sm text-gray-600">Selected: {file.name}</p>
        )}
        {preview && (
          <div className="mt-3">
            <img src={preview} alt="Preview" className="h-40 w-40 object-cover rounded-lg border shadow-sm" />
          </div>
        )}
      </div>

      <button type="submit" disabled={isSubmitting} className="bg-primary text-black px-6 py-3 rounded-full font-semibold hover:shadow-md transition-transform hover:scale-[1.02] disabled:opacity-60">
        {isSubmitting ? 'Submitting...' : 'Submit Report'}
      </button>
    </form>

    <SuccessModal
      isOpen={showSuccessModal}
      onClose={() => setShowSuccessModal(false)}
      onViewItems={handleViewMyItems}
      title="Upload Successful!"
      message="Your item has been uploaded successfully. You can view and manage it in My Items."
    />
  </>
  );
}


