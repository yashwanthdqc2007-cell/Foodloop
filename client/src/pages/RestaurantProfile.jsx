import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';

const RestaurantProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState({ category: 'QUALITY', description: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, reviewsData, menuData] = await Promise.all([
          api.get(`/restaurants/${id}`),
          api.get(`/restaurants/${id}/reviews`),
          api.get(`/restaurants/${id}/menu`)
        ]);
        setProfile(profileData);
        setReviews(reviewsData);
        setMenu(menuData);
      } catch (err) {
        setError('Failed to load restaurant profile');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const submitReport = async () => {
    const user = JSON.parse(localStorage.getItem('foodloop_user'));
    if (!user?.id || !report.description.trim()) return;
    try {
      await api.post('/reports', { customer_id: user.id, restaurant_id: Number(id), category: report.category, description: report.description.trim() });
      setReportOpen(false);
      setReport({ category: 'QUALITY', description: '' });
    } catch (err) {
      setError('Failed to submit restaurant report');
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading restaurant...</div>;
  if (error || !profile) return <div className="p-12 text-center text-red-500">{error || 'Not found'}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-3xl font-bold text-slate-900">{profile.name}</h1>
        <p className="text-slate-500 mt-2">{profile.address}</p>
        
        <div className="mt-4 flex gap-4">
          <div className="bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold">
            ★ {profile.rating ? profile.rating.toFixed(1) : 'New'}
          </div>
          <div className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
            {profile.total_reviews} Reviews
          </div>
          <button type="button" onClick={() => setReportOpen(true)} className="mt-5 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600">Report restaurant</button>
        </div>
      </div>

      {reportOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-bold text-slate-900">Report restaurant</h2><select value={report.category} onChange={e => setReport({ ...report, category: e.target.value })} className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900"><option value="QUALITY">Food quality issue</option><option value="SPOILED">Spoiled food</option><option value="HYGIENE">Hygiene concern</option><option value="WRONG_ORDER">Wrong order</option><option value="UNSAFE_HANDLING">Unsafe handling</option><option value="OTHER">Other</option></select><textarea value={report.description} onChange={e => setReport({ ...report, description: e.target.value })} placeholder="Describe the issue" className="mt-3 min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900" /><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setReportOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600">Cancel</button><button type="button" onClick={submitReport} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white">Submit report</button></div></div></div>}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Available surplus</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {menu.map(item => (
            <div key={item.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">{item.name}</h3><p className="mt-1 text-sm text-slate-500">{item.category}</p></div><span className="font-bold text-emerald-600">₹{item.normal_price}</span></div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Customer Reviews</h2>
        {reviews.length === 0 ? (
          <div className="text-slate-500 text-center py-8">No reviews yet.</div>
        ) : (
          <div className="space-y-6">
            {reviews.map(review => (
              <div key={review.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-slate-800">{review.customer_name}</div>
                  <div className="text-amber-500 font-bold">★ {review.rating}</div>
                </div>
                {review.review_text && <p className="text-slate-600 mt-2">{review.review_text}</p>}
                <div className="text-xs text-slate-400 mt-2">{new Date(review.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantProfile;
