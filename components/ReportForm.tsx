"use client";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

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
  contact: z.string().email('Valid email required').optional()
});

type ReportFormValues = z.infer<typeof reportSchema>;

export function ReportForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const categories = useMemo(() => ['Wallet', 'Keys', 'Electronics', 'Bag', 'Clothing', 'Other'], []);

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
    console.log('Report submit', values);
    await new Promise((r) => setTimeout(r, 300));
    alert('Report submitted. Check console for payload.');
    reset({ type: currentType });
    setPreview(null);
  };

  return (
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
          <label className="block text-sm font-medium mb-1">Contact Email</label>
          <input type="email" placeholder="you@example.com" {...register('contact')} className="w-full border rounded-lg px-3 py-2" />
          {errors.contact && <p className="text-red-600 text-sm mt-1">{errors.contact.message}</p>}
        </div>
      </div>

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
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) { setPreview(null); return; }
            const reader = new FileReader();
            reader.onload = () => setPreview(String(reader.result));
            reader.readAsDataURL(file);
          }}
          className="block w-full text-sm"
        />
        {preview && (
          <div className="mt-3">
            <img src={preview} alt="Preview" className="h-40 w-40 object-cover rounded-lg border" />
          </div>
        )}
      </div>

      <button type="submit" disabled={isSubmitting} className="bg-primary text-black px-6 py-3 rounded-full font-semibold hover:shadow-md transition-transform hover:scale-[1.02] disabled:opacity-60">
        {isSubmitting ? 'Submitting...' : 'Submit Report'}
      </button>
    </form>
  );
}


