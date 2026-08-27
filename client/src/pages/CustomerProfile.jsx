import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { MetricCard } from '../components/MetricCard';
import { User, Mail, MapPin, Tag, Star, AlertTriangle, FileText, ShoppingBag, CheckCircle } from 'lucide-react';

const CustomerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', location: '', food_preference: 'ALL' });
  const [reviewForm, setReviewForm] = useState({ rating: 5, food_quality_rating: 5, packaging_rating: 5, review_text: '' });
  const [reportText, setReportText] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const user = JSON.parse(localStorage.getItem('foodloop_user'));

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [profileData, ordersData, reviewsData] = await Promise.all([
          api.get(`/customer/profile?id=${user.id}`),
          api.get(`/customer/orders?id=${user.id}`),
          api.get(`/customer/reviews?id=${user.id}`)
        ]);
        setProfile(profileData);
        setOrders(ordersData);
        setReviews(reviewsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [user.id]);

  const submitReview = async (orderId, restaurantId) => {
    setReviewForm({ rating: 5, food_quality_rating: 5, packaging_rating: 5, review_text: '' });
    setDialog({ type: 'review', orderId, restaurantId });
  };

  const submitReviewForm = async () => {
    try {
      await api.post('/reviews', {
        customer_id: user.id,
        restaurant_id: dialog.restaurantId,
        order_id: dialog.orderId,
        rating: parseInt(reviewForm.rating, 10),
        food_quality_rating: parseInt(reviewForm.food_quality_rating, 10),
        packaging_rating: parseInt(reviewForm.packaging_rating, 10),
        review_text: reviewForm.review_text
      });
      setDialog(null);
      setOrders(orders.map(order => order.order_id === dialog.orderId ? { ...order, has_review: 1 } : order));
      setReviewSuccess(true);
    } catch (e) {
      setDialog({ ...dialog, error: e.message || 'Error submitting review' });
    }
  };

  const submitReport = async (orderId, restaurantId) => {
    setReportText('');
    setDialog({ type: 'report', orderId, restaurantId });
  };

  const submitReportForm = async () => {
    if (!reportText.trim()) return;
    try {
      await api.post('/reports', {
        customer_id: user.id,
        restaurant_id: dialog.restaurantId,
        order_id: dialog.orderId,
        category: 'QUALITY',
        description: reportText.trim()
      });
      setDialog(null);
    } catch (e) {
      setDialog({ ...dialog, error: e.message || 'Error submitting report' });
    }
  };

  const openEditProfile = () => {
    setEditForm({ name: profile.name, phone: profile.phone || '', location: profile.location || '', food_preference: profile.food_preference || 'ALL' });
    setDialog({ type: 'edit' });
  };

  const submitProfileForm = async () => {
    try {
      await api.put('/customer/profile', { id: user.id, ...editForm });
      localStorage.setItem('foodloop_user', JSON.stringify({ ...user, ...editForm }));
      setDialog(null);
      window.location.reload();
    } catch (e) {
      setDialog({ ...dialog, error: e.message || 'Error updating profile' });
    }
  };

  const reviewableOrders = orders.filter(order => (order.status === 'COMPLETED' || order.status === 'DELIVERED') && order.has_review === 0);

  if (loading) return (
    <div className="flex justify-center p-12">
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-full bg-dark-elevated h-10 w-10"></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* Profile Overview Card */}
      <div className="bg-dark-card rounded-3xl shadow-sm border border-dark-border overflow-hidden relative">
        <div className="h-32 bg-dark-secondary relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 to-transparent"></div>
        </div>
        
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
             <div className="w-24 h-24 rounded-2xl bg-dark-elevated border-4 border-dark-card flex items-center justify-center shadow-lg">
                <User size={40} className="text-text-secondary" />
             </div>
             <div>
                <Button variant="secondary" onClick={openEditProfile} className="text-xs">Edit Profile</Button>
             </div>
          </div>
          
          {profile && (
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-white mb-2">{profile.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                <span className="flex items-center gap-1.5"><Mail size={16}/> {profile.email}</span>
                <span className="flex items-center gap-1.5"><MapPin size={16}/> {profile.location}</span>
                <span className="flex items-center gap-1.5 text-brand-primary"><Tag size={16}/> Prefers {profile.food_preference}</span>
              </div>
            </div>
          )}

          {profile?.stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard 
                title="Total Orders" 
                value={profile.stats.totalOrders} 
                icon={ShoppingBag}
              />
              <MetricCard 
                title="Money Saved" 
                value={`₹${profile.stats.moneySaved}`} 
                icon={Tag}
                highlight={true}
              />
              <MetricCard 
                title="Meals Rescued" 
                value={profile.stats.mealsPurchased} 
                icon={FileText}
              />
            </div>
          )}
        </div>
      </div>
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-dark-border bg-dark-card p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">{dialog.type === 'edit' ? 'Edit profile' : dialog.type === 'review' ? 'Review your order' : 'Report an order'}</h2>
            {dialog.error && <p className="mt-3 rounded-xl bg-status-danger/10 p-3 text-sm text-status-danger">{dialog.error}</p>}
            {dialog.type === 'edit' && <div className="mt-5 space-y-3">
              <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" className="w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white" />
              <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Phone" className="w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white" />
              <input value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} placeholder="Location" className="w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white" />
              <select value={editForm.food_preference} onChange={e => setEditForm({ ...editForm, food_preference: e.target.value })} className="w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white"><option value="ALL">All food</option><option value="VEG">Vegetarian</option><option value="NON_VEG">Non-vegetarian</option></select>
            </div>}
            {dialog.type === 'review' && <div className="mt-5 space-y-3"><label className="block text-sm text-text-secondary">Overall rating</label><input type="number" min="1" max="5" value={reviewForm.rating} onChange={e => setReviewForm({ ...reviewForm, rating: e.target.value })} className="w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white" /><label className="block text-sm text-text-secondary">Food quality</label><input type="number" min="1" max="5" value={reviewForm.food_quality_rating} onChange={e => setReviewForm({ ...reviewForm, food_quality_rating: e.target.value })} className="w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white" /><label className="block text-sm text-text-secondary">Packaging</label><input type="number" min="1" max="5" value={reviewForm.packaging_rating} onChange={e => setReviewForm({ ...reviewForm, packaging_rating: e.target.value })} className="w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white" /><textarea value={reviewForm.review_text} onChange={e => setReviewForm({ ...reviewForm, review_text: e.target.value })} placeholder="Any comments?" className="min-h-24 w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white" /></div>}
            {dialog.type === 'report' && <textarea value={reportText} onChange={e => setReportText(e.target.value)} placeholder="What went wrong with this order?" className="mt-5 min-h-28 w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white" />}
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setDialog(null)} className="rounded-xl border border-dark-border px-4 py-2 text-sm font-semibold text-text-secondary">Cancel</button><button type="button" onClick={dialog.type === 'edit' ? submitProfileForm : dialog.type === 'review' ? submitReviewForm : submitReportForm} className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-dark-bg">Submit</button></div>
          </div>
        </div>
      )}

      {reviewableOrders.length > 0 && (
        <div className="flex flex-col gap-4 rounded-2xl border border-brand-primary/30 bg-brand-primary/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-bold text-white">{reviewableOrders.length} order{reviewableOrders.length === 1 ? '' : 's'} waiting for your review</p><p className="mt-1 text-sm text-text-secondary">Your feedback helps keep FoodLoop trustworthy.</p></div>
          <Button variant="primary" onClick={() => submitReview(reviewableOrders[0].order_id, reviewableOrders[0].restaurant_id)}>Rate now</Button>
        </div>
      )}
      {reviewSuccess && <div className="flex items-center gap-3 rounded-2xl border border-status-success/30 bg-status-success/10 p-5 text-status-success"><CheckCircle size={20} /><div><strong>Review submitted</strong><p className="text-sm text-text-secondary">Thanks for helping keep FoodLoop trustworthy.</p></div></div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Order History */}
        <div className="bg-dark-card rounded-3xl shadow-sm border border-dark-border p-8 flex flex-col h-[600px]">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <ShoppingBag size={20} className="text-brand-primary"/> Order History
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {orders.length === 0 ? (
              <div className="text-text-muted py-12 text-center flex flex-col items-center">
                <ShoppingBag size={32} className="opacity-20 mb-3" />
                <p>No orders yet.</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.order_id} className="border border-dark-border rounded-2xl p-5 bg-dark-elevated transition-colors hover:border-brand-primary/30 group">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-white text-lg">{order.food_name}</h4>
                      <div className="text-sm text-text-secondary mt-1">{order.restaurant_name}</div>
                    </div>
                    <Badge variant={order.status === 'COMPLETED' ? 'success' : 'warning'}>{order.status}</Badge>
                  </div>
                  
                  <div className="flex justify-between items-end mt-4 pt-4 border-t border-dark-border/50">
                    <div>
                      <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Paid</div>
                      <div className="font-bold text-brand-primary">₹{order.amount} <span className="text-xs text-text-muted font-normal">({order.quantity} qty)</span></div>
                    </div>
                    
                    {(order.status === 'COMPLETED' || order.status === 'DELIVERED') && order.has_review === 0 && (
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => submitReview(order.order_id, order.restaurant_id)} className="!text-xs !py-1.5 !px-3">
                          <Star size={12} className="mr-1"/> Rate your order
                        </Button>
                        <Button variant="danger" onClick={() => submitReport(order.order_id, order.restaurant_id)} className="!text-xs !py-1.5 !px-3">
                          <AlertTriangle size={12} className="mr-1"/> Report
                        </Button>
                      </div>
                    )}
                    {(order.status === 'COMPLETED' || order.status === 'DELIVERED') && order.has_review > 0 && <span className="flex items-center gap-1 text-xs font-semibold text-status-success"><CheckCircle size={14} /> Reviewed</span>}
                  </div>
                  <div className="mt-3 text-xs text-text-muted text-right">
                    {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Reviews */}
        <div className="bg-dark-card rounded-3xl shadow-sm border border-dark-border p-8 flex flex-col h-[600px]">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Star size={20} className="text-brand-primary"/> My Reviews
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {reviews.length === 0 ? (
              <div className="text-text-muted py-12 text-center flex flex-col items-center">
                <Star size={32} className="opacity-20 mb-3" />
                <p>No reviews yet.</p>
              </div>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="border border-dark-border rounded-2xl p-5 bg-dark-elevated">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-white">{review.restaurant_name}</h4>
                      <span className="text-xs font-medium text-text-muted">Order #{review.order_id}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-dark-card px-2.5 py-1 rounded-lg border border-dark-border">
                      <Star size={14} className="text-brand-accent fill-brand-accent" />
                      <span className="text-sm font-bold text-white">{review.rating}.0</span>
                    </div>
                  </div>
                  
                  {review.review_text && (
                    <p className="text-sm text-text-secondary leading-relaxed bg-dark-bg/50 p-3 rounded-xl mt-3">
                      "{review.review_text}"
                    </p>
                  )}
                  
                  <div className="text-xs text-text-muted mt-4">
                    {new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomerProfile;
