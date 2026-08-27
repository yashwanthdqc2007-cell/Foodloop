import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MetricCard } from '../components/MetricCard';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { TrendingUp, ShoppingBag, Heart, AlertTriangle, Users, FileText, CheckCircle2 } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalMealsProcessed: 0,
    mealsSold: 0,
    mealsDonated: 0,
    mealsBlocked: 0,
    revenueRecovered: 0,
    mealsRedirected: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('DASHBOARD'); // DASHBOARD, VERIFICATIONS, REPORTS, REVIEWS, CUSTOMERS
  const [verifications, setVerifications] = useState([]);
  const [reports, setReports] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [moderation, setModeration] = useState(null);
  const [moderationForm, setModerationForm] = useState({ status: 'TEMPORARILY_BLOCKED', reason: '', duration: 3 });
  const [error, setError] = useState('');
  const [resolutionDialog, setResolutionDialog] = useState(null);
  const [resolutionAction, setResolutionAction] = useState('');

  const fetchData = async () => {
    try {
      const [statsData, verifsData, reportsData, customersData, reviewsData, restaurantsData] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/verifications'),
        api.get('/admin/reports'),
        api.get('/admin/customers'),
        api.get('/admin/reviews'),
        api.get('/admin/restaurants')
      ]);
      setStats(statsData);
      setVerifications(verifsData);
      setReports(reportsData);
      setCustomers(customersData);
      setReviews(reviewsData);
      setRestaurants(restaurantsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async (id, status) => {
    try {
      await api.put(`/admin/verifications/${id}`, { status });
      fetchData();
    } catch (err) {
      setError(err.message || 'Verification update failed');
    }
  };

  const handleResolveReport = async (id, action) => {
    try {
      await api.put(`/admin/reports/${id}`, { status: 'RESOLVED', resolution_action: action });
      fetchData();
    } catch (err) {
      setError(err.message || 'Report update failed');
    }
  };

  const submitResolution = async () => {
    if (!resolutionDialog || !resolutionAction.trim()) return;
    await handleResolveReport(resolutionDialog, resolutionAction.trim());
    setResolutionDialog(null);
    setResolutionAction('');
  };

  const submitModeration = async () => {
    if (!moderation || !moderationForm.reason.trim()) return;
    await api.put(`/admin/restaurants/${moderation.id}/status`, moderationForm);
    setModeration(null);
    fetchData();
  };

  if (loading) return (
    <div className="flex justify-center p-12">
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-full bg-dark-elevated h-10 w-10"></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">System Overview</h1>
        <p className="mt-2 text-text-secondary">Monitor platform activity, verifications, and user reports.</p>
      </div>
      {error && <div className="rounded-xl border border-status-danger/20 bg-status-danger/10 px-6 py-4 text-status-danger">{error}</div>}

      <div className="flex border-b border-dark-border gap-8 overflow-x-auto custom-scrollbar">
        {['DASHBOARD', 'VERIFICATIONS', 'REPORTS', 'REVIEWS', 'RESTAURANTS', 'CUSTOMERS'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`py-3 px-1 border-b-2 text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === tab ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-muted hover:text-white hover:border-text-secondary'}`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
            {tab === 'VERIFICATIONS' && verifications.length > 0 && (
              <span className="bg-status-warning/20 text-status-warning text-[10px] font-bold px-2 py-0.5 rounded-full">{verifications.length}</span>
            )}
            {tab === 'REPORTS' && reports.filter(r => r.status === 'OPEN' || r.status === 'UNDER_REVIEW').length > 0 && (
              <span className="bg-status-danger/20 text-status-danger text-[10px] font-bold px-2 py-0.5 rounded-full">{reports.filter(r => r.status === 'OPEN' || r.status === 'UNDER_REVIEW').length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'DASHBOARD' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <MetricCard 
                title="Total Redirected" 
                value={stats.mealsRedirected} 
                description={`Out of ${stats.totalMealsProcessed} processed`}
                icon={TrendingUp} 
                highlight={true} 
             />
             <MetricCard 
                title="Revenue Recovered" 
                value={`₹${stats.revenueRecovered}`} 
                description={`${stats.mealsSold} meals sold`}
                icon={ShoppingBag} 
             />
             <MetricCard 
                title="Meals Donated" 
                value={stats.mealsDonated} 
                description="To community partners"
                icon={Heart} 
             />
             <MetricCard 
                title="Meals Blocked" 
                value={stats.mealsBlocked} 
                description="Expired or unsafe handling"
                icon={AlertTriangle} 
             />
          </div>

          <div className="bg-dark-card rounded-3xl shadow-sm border border-dark-border p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="relative z-10 max-w-3xl mx-auto">
                <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <TrendingUp size={32} className="text-brand-primary" />
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-4">FoodLoop Impact Engine</h2>
                <p className="text-lg text-text-secondary leading-relaxed">
                  We treat surplus food as a time-sensitive allocation problem, not just a donation platform. 
                  By combining a deterministic safety engine with AI-driven allocation, we've successfully rescued 
                  <span className="font-bold text-brand-primary mx-1">{stats.mealsRedirected} meals</span> 
                  and prevented unsafe food from entering the community.
                </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'VERIFICATIONS' && (
        <div className="bg-dark-card rounded-3xl shadow-sm border border-dark-border overflow-hidden">
          <div className="px-8 py-6 border-b border-dark-border bg-dark-secondary">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><CheckCircle2 size={20} className="text-brand-primary"/> Pending Verifications</h2>
          </div>
          
          <div className="p-8">
            {verifications.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-dark-border rounded-2xl flex flex-col items-center">
                <CheckCircle2 size={32} className="text-text-muted mb-3" />
                <p className="text-text-secondary font-medium">No pending verifications.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {verifications.map(v => (
                  <div key={v.id} className="p-5 border border-dark-border rounded-2xl bg-dark-elevated transition-colors hover:border-brand-primary/30">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="font-bold text-white text-lg">{v.name}</div>
                        <div className="text-sm text-text-secondary mt-1 font-mono">FSSAI: {v.fssai_number}</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="primary" onClick={() => handleVerify(v.id, 'VERIFIED')} className="flex-1 !py-2 text-sm">Approve</Button>
                      <Button variant="danger" onClick={() => handleVerify(v.id, 'UNVERIFIED')} className="flex-1 !py-2 text-sm">Reject</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'REPORTS' && (
        <div className="bg-dark-card rounded-3xl shadow-sm border border-dark-border overflow-hidden">
          <div className="px-8 py-6 border-b border-dark-border bg-dark-secondary">
             <h2 className="text-xl font-bold text-white flex items-center gap-2"><FileText size={20} className="text-brand-primary"/> User Reports</h2>
          </div>
          
          <div className="p-8">
            {reports.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-dark-border rounded-2xl flex flex-col items-center">
                 <FileText size={32} className="text-text-muted mb-3" />
                 <p className="text-text-secondary font-medium">No reports found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reports.map(r => (
                  <div key={r.id} className="p-6 border border-dark-border rounded-2xl bg-dark-elevated">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                            <span className="font-bold text-white text-lg">{r.restaurant_name || 'Restaurant report'}</span>
                            <div className="text-xs font-bold text-brand-primary uppercase tracking-wider mt-1">{r.category}</div>
                            <div className="text-xs text-text-muted mt-1">{r.customer_name || 'Customer'}{r.order_id ? ` · Order #${r.order_id}` : ''}</div>
                      </div>
                          <Badge variant={r.status === 'OPEN' || r.status === 'UNDER_REVIEW' ? 'warning' : 'neutral'}>{r.status}</Badge>
                    </div>
                    
                    <p className="text-sm text-text-secondary leading-relaxed bg-dark-bg p-4 rounded-xl mt-4 border border-dark-border/50">
                      "{r.description}"
                    </p>
                    
                    {(r.status === 'OPEN' || r.status === 'UNDER_REVIEW') && (
                      <div className="mt-5 pt-5 border-t border-dark-border">
                        <Button 
                          variant="secondary"
                          onClick={() => { setResolutionDialog(r.id); setResolutionAction(''); }}
                          className="w-full"
                        >
                          Resolve Report
                        </Button>
                      </div>
                    )}
                    
                    {r.status === 'RESOLVED' && (
                      <div className="mt-4 text-sm text-text-secondary bg-status-success/10 p-3 border border-status-success/20 rounded-xl">
                        <span className="font-bold text-status-success block mb-1">Resolution</span> 
                        {r.resolution_action}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'REVIEWS' && (
        <div className="bg-dark-card rounded-3xl shadow-sm border border-dark-border overflow-hidden">
          <div className="px-8 py-6 border-b border-dark-border bg-dark-secondary"><h2 className="text-xl font-bold text-white">Reviews &amp; Trust</h2></div>
          <div className="p-8 space-y-4">{reviews.length === 0 ? <p className="py-12 text-center text-text-muted">No reviews yet.</p> : reviews.map(review => <div key={review.id} className={`rounded-2xl border p-5 ${review.rating <= 2 ? 'border-status-danger/40 bg-status-danger/5' : 'border-dark-border bg-dark-elevated'}`}><div className="flex justify-between gap-4"><div><div className="font-bold text-white">{review.restaurant_name}</div><div className="text-sm text-text-secondary">{review.food_name} by {review.customer_name}</div></div><Badge variant={review.rating <= 2 ? 'danger' : review.rating === 3 ? 'warning' : 'success'}>{review.rating}/5</Badge></div><p className="mt-3 text-sm text-text-secondary">{review.review_text || 'No comment provided.'}</p></div>)}</div>
        </div>
      )}

      {activeTab === 'RESTAURANTS' && <div className="bg-dark-card rounded-3xl border border-dark-border overflow-hidden"><div className="px-8 py-6 border-b border-dark-border bg-dark-secondary"><h2 className="text-xl font-bold text-white">Restaurant Trust &amp; Access</h2></div><div className="p-8 space-y-4">{restaurants.map(restaurant => <div key={restaurant.id} className="flex flex-col gap-4 rounded-2xl border border-dark-border bg-dark-elevated p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-bold text-white">{restaurant.name}</div><div className="mt-1 text-sm text-text-secondary">{restaurant.rating?.toFixed?.(1) || restaurant.rating} ★ · Trust {restaurant.trust_score}/100 · {restaurant.operational_status}</div>{restaurant.block_reason && <div className="mt-1 text-xs text-status-warning">{restaurant.block_reason}</div>}</div><div className="flex gap-2"><Button variant="secondary" onClick={() => { setModeration(restaurant); setModerationForm({ status: restaurant.operational_status === 'ACTIVE' ? 'TEMPORARILY_BLOCKED' : 'ACTIVE', reason: '', duration: 3 }); }}>{restaurant.operational_status === 'ACTIVE' ? 'Moderate' : 'Restore'}</Button></div></div>)}</div></div>}
      
      {activeTab === 'CUSTOMERS' && (
        <div className="bg-dark-card rounded-3xl shadow-sm border border-dark-border overflow-hidden">
          <div className="px-8 py-6 border-b border-dark-border bg-dark-secondary">
             <h2 className="text-xl font-bold text-white flex items-center gap-2"><Users size={20} className="text-brand-primary"/> Customer Directory</h2>
          </div>
          
          <div className="p-0 overflow-x-auto">
            {customers.length === 0 ? (
              <div className="text-center py-12 m-8 border border-dashed border-dark-border rounded-2xl flex flex-col items-center">
                 <Users size={32} className="text-text-muted mb-3" />
                 <p className="text-text-secondary font-medium">No customers found.</p>
              </div>
            ) : (
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="uppercase tracking-wider border-b border-dark-border bg-dark-elevated text-text-muted text-xs font-bold">
                  <tr>
                    <th scope="col" className="px-8 py-5">Name</th>
                    <th scope="col" className="px-8 py-5">Email</th>
                    <th scope="col" className="px-8 py-5">Joined</th>
                    <th scope="col" className="px-8 py-5 text-right">Total Orders</th>
                    <th scope="col" className="px-8 py-5 text-right">Total Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {customers.map(c => (
                    <tr key={c.id} className="hover:bg-dark-elevated transition-colors">
                      <td className="px-8 py-5 font-bold text-white">{c.name}</td>
                      <td className="px-8 py-5 text-text-secondary">{c.email}</td>
                      <td className="px-8 py-5 text-text-secondary">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td className="px-8 py-5 text-brand-primary font-bold text-right">{c.total_orders}</td>
                      <td className="px-8 py-5 text-brand-primary font-bold text-right">₹{c.total_spent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
      {resolutionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-dark-border bg-dark-card p-6 shadow-2xl"><h2 className="text-xl font-bold text-white">Resolve report</h2><textarea value={resolutionAction} onChange={e => setResolutionAction(e.target.value)} placeholder="Resolution action" className="mt-5 min-h-28 w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white" /><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setResolutionDialog(null)} className="rounded-xl border border-dark-border px-4 py-2 text-sm font-semibold text-text-secondary">Cancel</button><button type="button" onClick={submitResolution} className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-dark-bg">Resolve</button></div></div>
        </div>
      )}
      {moderation && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-2xl border border-dark-border bg-dark-card p-6 shadow-2xl"><h2 className="text-xl font-bold text-white">Moderate {moderation.name}</h2><select value={moderationForm.status} onChange={e => setModerationForm({ ...moderationForm, status: e.target.value })} className="mt-5 w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white"><option value="ACTIVE">Restore access</option><option value="UNDER_REVIEW">Mark under review</option><option value="TEMPORARILY_BLOCKED">Temporarily block</option><option value="SUSPENDED">Suspend</option></select><textarea value={moderationForm.reason} onChange={e => setModerationForm({ ...moderationForm, reason: e.target.value })} placeholder="Reason required" className="mt-3 min-h-24 w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white" />{moderationForm.status === 'TEMPORARILY_BLOCKED' && <select value={moderationForm.duration} onChange={e => setModerationForm({ ...moderationForm, duration: parseInt(e.target.value, 10) })} className="mt-3 w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white"><option value="1">24 hours</option><option value="3">3 days</option><option value="7">7 days</option></select>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setModeration(null)} className="rounded-xl border border-dark-border px-4 py-2 text-sm font-semibold text-text-secondary">Cancel</button><button type="button" onClick={submitModeration} className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-dark-bg">Apply</button></div></div></div>}
    </div>
  );
};

export default AdminDashboard;
