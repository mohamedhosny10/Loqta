"use client";
import { ItemCard, type Item } from '@/components/ItemCard';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getSupabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Edit2, Trash2 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Toast, type ToastType } from '@/components/Toast';
import { ResultModal } from '@/components/ResultModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const editSchema = z.object({
  title: z.string().min(3, 'Title is too short'),
  description: z.string().min(10, 'Please add more details'),
  location: z.string().min(2, 'Location is required'),
  date: z.string().min(1, 'Date is required'),
});

type EditValues = z.infer<typeof editSchema>;

export default function MyItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<EditValues>({ resolver: zodResolver(editSchema) });

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthChecked(true);
        router.push('/signin');
        return;
      }
      setAuthChecked(true);

      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('items')
        .select('id, title, description, category, location, date, image_url, lat, lng, reward, reward_currency, handover_location_private, user_id')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // Normalize storage image URLs
      const getNormalizedImageUrl = async (raw: string | null | undefined): Promise<string | undefined> => {
        if (!raw) return undefined;
        if (/^https?:\/\//i.test(raw)) return raw;
        const storagePrefix = '/storage/v1/object/public/';
        let objectPath = raw;
        if (raw.includes(storagePrefix)) {
          const idx = raw.indexOf(storagePrefix) + storagePrefix.length;
          objectPath = raw.substring(idx);
        }
        const parts = objectPath.split('/');
        const bucket = parts.shift() || 'items';
        const path = parts.join('/');
        const cleanedPath = path.startsWith(`${bucket}/`) ? path.substring(bucket.length + 1) : path;
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(cleanedPath);
        if (pub?.publicUrl) return pub.publicUrl;
        const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(cleanedPath, 60 * 60);
        return signed?.signedUrl;
      };

      const mapped: Item[] = await Promise.all(
        (data || []).map(async (row: any) => ({
          id: String(row.id),
          title: row.title,
          description: row.description ?? '',
          category: row.category || 'lost',
          type: (row.category || 'lost') === 'found' ? 'found' : 'lost',
          location: row.location ?? '',
          date: row.date ?? new Date().toISOString(),
          imageUrl: await getNormalizedImageUrl(row.image_url),
          lat: row.lat ?? 25.2048,
          lng: row.lng ?? 55.2708,
          reward: row.reward ?? null,
          rewardCurrency: row.reward_currency ?? null,
          user_id: session.user.id
        }))
      );
      setItems(mapped);
      setLoading(false);
    };

    checkAuthAndFetch();
  }, [router]);

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    reset({
      title: item.title,
      description: item.description,
      location: item.location,
      date: item.date.split('T')[0] // Format date for input
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setDeletingId(itemToDelete);
    setShowDeleteConfirm(false);
    
    try {
    const supabase = getSupabase();
      const { error, data } = await supabase.from('items').delete().eq('id', itemToDelete).select();

    if (error) {
        console.error('Delete error:', error);
        setToast({ 
          message: error.message || 'Failed to delete item. Please try again.', 
          type: 'error' 
        });
      setDeletingId(null);
        setItemToDelete(null);
      return;
    }

      // Verify deletion by checking if data was returned
      if (data && data.length > 0) {
    // Remove item from state
        setItems(items.filter(item => item.id !== itemToDelete));
        setToast({ 
          message: 'Item deleted successfully', 
          type: 'success' 
        });
      } else {
        setToast({ 
          message: 'Item not found or cannot be deleted', 
          type: 'error' 
        });
      }
    } catch (err) {
      console.error('Delete exception:', err);
      setToast({ 
        message: err instanceof Error ? err.message : 'An error occurred while deleting the item.', 
        type: 'error' 
      });
    } finally {
    setDeletingId(null);
      setItemToDelete(null);
    }
  };

  const onEditSubmit = async (values: EditValues) => {
    if (!editingItem) return;

    const supabase = getSupabase();
    const { error } = await supabase
      .from('items')
      .update({
        title: values.title,
        description: values.description,
        location: values.location,
        date: values.date
      })
      .eq('id', editingItem.id);

    if (error) {
      setToast({ message: error.message, type: 'error' });
      return;
    }

    // Update item in state
    setItems(items.map(item => 
      item.id === editingItem.id 
        ? { ...item, ...values, date: values.date }
        : item
    ));

    setToast({ message: 'Item updated successfully', type: 'success' });
    setShowEditModal(false);
    setEditingItem(null);
  };

  if (!authChecked) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-16">
        <p className="text-gray-600">Checking authentication…</p>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">My Items</h1>
        <p className="text-gray-600">Manage your reported lost and found items.</p>
      </div>

      {loading && <p className="text-gray-600 mb-6">Loading your items…</p>}
      {error && <p className="text-red-600 mb-6">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-2">No items found</p>
          <p className="text-gray-400 text-sm mb-6">
            You haven't uploaded any items yet. Start by reporting a lost or found item.
          </p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="group relative"
            >
              <ItemCard item={item} />
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                  aria-label="Edit item"
                >
                  <Edit2 className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  onClick={() => handleDeleteClick(item.id)}
                  disabled={deletingId === item.id}
                  className="p-2 bg-white rounded-lg shadow-md hover:bg-red-50 transition-colors disabled:opacity-50"
                  aria-label="Delete item"
                >
                  <Trash2 className={`w-4 h-4 ${deletingId === item.id ? 'text-gray-400' : 'text-red-600'}`} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
        }}
        title="Edit Item"
      >
        <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              {...register('title')}
              className={`w-full border rounded-lg px-4 py-2 transition-all focus:outline-none focus:ring-2 focus:ring-accent ${
                errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={4}
              {...register('description')}
              className={`w-full border rounded-lg px-4 py-2 transition-all focus:outline-none focus:ring-2 focus:ring-accent ${
                errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              {...register('location')}
              className={`w-full border rounded-lg px-4 py-2 transition-all focus:outline-none focus:ring-2 focus:ring-accent ${
                errors.location ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.location && (
              <p className="text-red-600 text-sm mt-1">{errors.location.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              {...register('date')}
              className={`w-full border rounded-lg px-4 py-2 transition-all focus:outline-none focus:ring-2 focus:ring-accent ${
                errors.date ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.date && (
              <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setEditingItem(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary text-black px-4 py-2 rounded-lg font-semibold hover:shadow-md transition-all disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={deletingId !== null}
      />
    </section>
  );
}

