import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MetricCard } from '../components/MetricCard';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { CheckCircle2, AlertTriangle, XCircle, BrainCircuit, TrendingUp, ShoppingBag, Utensils, HeartHandshake } from 'lucide-react';

const getLocalDateTimeValue = () => {
  const date = new Date();
  const pad = value => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const RestaurantDashboard = () => {
  const user = JSON.parse(localStorage.getItem('foodloop_user'));
  
  const [formData, setFormData] = useState({
    food_name: '',
    quantity: '',
    original_price: '',
    surplus_price: '',
    prepared_at: getLocalDateTimeValue(),
    storage_method: 'HOT_HELD',
    temperature: ''
  });
  
  const [activeTab, setActiveTab] = useState('DASHBOARD'); // DASHBOARD, MENU, SURPLUS
  const [profile, setProfile] = useState(null);
  const [menu, setMenu] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [actionDialog, setActionDialog] = useState(null);
  const [actionForm, setActionForm] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profData, menuData, anData, reviewsData, ordersData] = await Promise.all([
          api.get(`/restaurants/${user.restaurant_id}`),
          api.get(`/restaurants/${user.restaurant_id}/menu`),
          api.get(`/restaurants/${user.restaurant_id}/analytics`),
          api.get(`/restaurants/${user.restaurant_id}/reviews`),
          api.get(`/orders?restaurant_id=${user.restaurant_id}`)
        ]);
        setProfile(profData);
        setMenu(menuData);
        setAnalytics(anData);
        setReviews(reviewsData);
        setOrders(ordersData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [user.restaurant_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setAllocation(null);
    try {
      const data = await api.post('/foods', {
        ...formData,
        restaurant_id: user.restaurant_id,
        quantity: parseInt(formData.quantity),
        original_price: parseFloat(formData.original_price),
        surplus_price: parseFloat(formData.surplus_price),
        menu_item_id: formData.menu_item_id ? parseInt(formData.menu_item_id) : undefined
      });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Batch creation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = async () => {
    if (!result || !result.batchId) return;
    try {
      const allocData = await api.post(`/foods/${result.batchId}/allocate`);
      setAllocation(allocData);
    } catch (err) {
      setError(err.message || 'Allocation failed');
    }
  };

  const handleMenuItemSelected = (e) => {
    const id = e.target.value;
    if (id) {
      const item = menu.find(m => m.id === parseInt(id));
      setFormData({
        ...formData,
        menu_item_id: id,
        food_name: item.name,
        original_price: item.normal_price,
        surplus_price: Math.floor(item.normal_price * 0.4) // 60% discount default
      });
    } else {
      setFormData({
        ...formData,
        menu_item_id: '',
        food_name: '',
        original_price: '',
        surplus_price: ''
      });
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (actionForm.fssai_number) {
      try {
        await api.post(`/restaurants/${user.restaurant_id}/verification`, { fssai_number: actionForm.fssai_number });
        setActionDialog(null);
        window.location.reload();
      } catch (err) {
        setError(err.message || 'Verification submission failed');
      }
    }
  };

  const openMenuDialog = () => {
    setActionForm({ name: '', category: '', food_type: 'VEG', normal_price: '' });
    setActionDialog('menu');
  };

  const submitMenuItem = async () => {
    if (!actionForm.name || !actionForm.normal_price) return;
    await api.post('/restaurants/menu', { restaurant_id: user.restaurant_id, ...actionForm });
    setActionDialog(null);
    window.location.reload();
  };

  const advanceOrder = async (order) => {
    const next = { CONFIRMED: 'PREPARING', PREPARING: 'READY', READY: 'COMPLETED' }[order.status];
    if (!next) return;
    try {
      await api.put(`/orders/${order.order_id}/status`, { status: next, restaurant_id: user.restaurant_id });
      setOrders(orders.map(item => item.order_id === order.order_id ? { ...item, status: next } : item));
    } catch (err) {
      setError(err.message || 'Order status update failed');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Restaurant Dashboard</h1>
          <p className="mt-2 text-text-secondary">Manage surplus, monitor operations, and track sustainability impact.</p>
        </div>
        {error && <div className="rounded-xl border border-status-danger/20 bg-status-danger/10 px-6 py-4 text-status-danger">{error}</div>}
        {profile?.operational_status && profile.operational_status !== 'ACTIVE' && <div className="rounded-xl border border-status-danger/30 bg-status-danger/10 px-6 py-4 text-status-danger"><strong>Restaurant unavailable: {profile.operational_status}</strong><div className="text-sm mt-1">Your restaurant is temporarily unavailable while an issue is under review. {profile.block_reason || ''}</div></div>}
        <div className="flex gap-2">
           {profile?.verification_status === 'VERIFIED' && <Badge variant="success">Verified Partner</Badge>}
           {profile?.verification_status === 'PENDING' && <Badge variant="warning">Verification Pending</Badge>}
           {profile?.verification_status === 'UNVERIFIED' && <Badge variant="danger">Unverified</Badge>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-dark-border gap-8 overflow-x-auto custom-scrollbar">
        {['DASHBOARD', 'MENU', 'SURPLUS'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`py-3 px-1 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === tab ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-muted hover:text-white hover:border-text-secondary'}`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {profile?.verification_status === 'UNVERIFIED' && (
            <div className="bg-status-danger/10 border border-status-danger/30 text-status-danger p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                 <AlertTriangle size={24} />
                 <div>
                    <h3 className="font-bold text-white">Verification Required</h3>
                    <p className="text-sm">Your restaurant must be verified before posting surplus food.</p>
                 </div>
              </div>
              <Button variant="danger" onClick={() => { setActionForm({ fssai_number: '' }); setActionDialog('verification'); }}>Verify Now</Button>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard title="Revenue Recovered" value={`₹${analytics?.revenueRecovered || 0}`} icon={TrendingUp} highlight={true} />
            <MetricCard title="Food Rescued" value={analytics?.foodRescued || 0} description="portions saved from waste" icon={Utensils} />
            <MetricCard title="Discount Given" value={`₹${analytics?.discountGiven || 0}`} icon={HeartHandshake} />
            <MetricCard title="Total Sold" value={Math.floor((analytics?.foodRescued || 0) * 0.7)} icon={ShoppingBag} />
          </div>

          <div className="bg-dark-card border border-dark-border rounded-3xl p-6">
            <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-white">Recent Reviews</h2><span className="text-brand-primary font-bold">{profile?.rating?.toFixed?.(1) || profile?.rating || 'New'} ★</span></div>
            <p className="mt-1 text-sm text-text-secondary">Based on {profile?.total_reviews || 0} reviews</p>
            <div className="mt-5 space-y-3">{reviews.length === 0 ? <p className="text-sm text-text-muted">No customer reviews yet.</p> : reviews.slice(0, 3).map(review => <div key={review.id} className="rounded-xl border border-dark-border bg-dark-elevated p-4"><div className="flex justify-between"><span className="font-semibold text-white">{review.customer_name}</span><span className="text-brand-primary">{'★'.repeat(review.rating)}</span></div>{review.review_text && <p className="mt-2 text-sm text-text-secondary">{review.review_text}</p>}</div>)}</div>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-3xl p-6"><h2 className="text-xl font-bold text-white">Incoming Orders</h2><div className="mt-5 space-y-3">{orders.length === 0 ? <p className="text-sm text-text-muted">No orders yet.</p> : orders.map(order => <div key={order.order_id} className="flex flex-col gap-3 rounded-xl border border-dark-border bg-dark-elevated p-4 sm:flex-row sm:items-center sm:justify-between"><div><strong className="text-white">#{order.order_id} {order.food_name}</strong><div className="text-sm text-text-secondary">{order.customer_name} · {order.quantity} portions · {order.status}</div></div>{['CONFIRMED','PREPARING','READY'].includes(order.status) && <Button variant="secondary" onClick={() => advanceOrder(order)}>{order.status === 'CONFIRMED' ? 'Start preparing' : order.status === 'PREPARING' ? 'Mark ready' : 'Complete order'}</Button>}</div>)}</div></div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-dark-card border border-dark-border rounded-3xl p-8 h-80 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiMzMzMiLz48L3N2Zz4=')] opacity-10"></div>
                <div className="text-center relative z-10">
                   <TrendingUp size={48} className="text-brand-primary/20 mx-auto mb-4" />
                   <p className="text-text-muted font-medium">Sales vs Donations chart will appear here</p>
                </div>
            </div>
            <div className="bg-dark-card border border-dark-border rounded-3xl p-8 h-80 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiMzMzMiLz48L3N2Zz4=')] opacity-10"></div>
                <div className="text-center relative z-10">
                   <Utensils size={48} className="text-brand-primary/20 mx-auto mb-4" />
                   <p className="text-text-muted font-medium">Rescued Food volume chart will appear here</p>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* MENU TAB */}
      {activeTab === 'MENU' && (
        <div className="bg-dark-card rounded-3xl shadow-sm border border-dark-border overflow-hidden">
          <div className="p-8 border-b border-dark-border flex justify-between items-center bg-dark-secondary">
            <h2 className="text-xl font-bold text-white">Menu Management</h2>
            <Button variant="primary" onClick={openMenuDialog}>
              + Add Item
            </Button>
          </div>
          <div className="p-8">
            {menu.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-dark-border rounded-2xl">
                <Utensils size={32} className="text-text-muted mx-auto mb-3" />
                <p className="text-text-secondary font-medium">No menu items added.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menu.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-5 border border-dark-border rounded-2xl bg-dark-elevated hover:border-brand-primary/30 transition-colors">
                    <div>
                      <div className="font-bold text-white text-lg">{item.name}</div>
                      <div className="text-sm text-text-secondary mt-1">{item.category} <span className="mx-1">•</span> <span className={item.food_type === 'VEG' || item.food_type === 'Vegetarian' ? 'text-status-success' : 'text-status-danger'}>{item.food_type}</span></div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-brand-primary text-xl">₹{item.normal_price}</div>
                      <button onClick={() => api.delete(`/restaurants/menu/${item.id}`).then(() => window.location.reload())} className="text-xs text-status-danger hover:text-white transition-colors mt-2 font-medium">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SURPLUS TAB */}
      {activeTab === 'SURPLUS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Create Batch Form */}
          <div className="lg:col-span-7 bg-dark-card rounded-3xl shadow-sm border border-dark-border overflow-hidden flex flex-col h-full">
            <div className="px-8 py-6 border-b border-dark-border bg-dark-secondary">
              <h2 className="text-xl font-bold text-white">Declare Surplus Batch</h2>
              <p className="text-sm text-text-secondary mt-1">Provide details for the AI classification and safety engine.</p>
            </div>
            
            {profile?.verification_status !== 'VERIFIED' ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-text-secondary">
                <div className="w-20 h-20 bg-dark-elevated rounded-full flex items-center justify-center mb-6 border-2 border-dark-border">
                   <AlertTriangle className="text-status-warning" size={40} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Verification Required</h3>
                <p className="max-w-sm">You must be verified by an admin before you can post surplus food batches to the marketplace.</p>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="p-8 space-y-8 flex-1">
              
              {/* Section 1: Food Details */}
              <div>
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 pb-2 border-b border-dark-border">1. Food Details</h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Select from Menu</label>
                    <select value={formData.menu_item_id || ''} onChange={handleMenuItemSelected} className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all sm:text-sm appearance-none">
                      <option value="">-- Custom Item --</option>
                      {menu.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {!formData.menu_item_id && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">Food Name</label>
                      <input type="text" required value={formData.food_name} onChange={e => setFormData({...formData, food_name: e.target.value})} className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all sm:text-sm placeholder-text-muted" placeholder="e.g., Chicken Biryani" />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Quantity (portions)</label>
                    <input type="number" required min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all sm:text-sm placeholder-text-muted" placeholder="10" />
                  </div>
                </div>
              </div>

              {/* Section 2: Pricing */}
              <div>
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 pb-2 border-b border-dark-border">2. Pricing</h3>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Original Price (₹)</label>
                    <input type="number" required min="1" value={formData.original_price} onChange={e => setFormData({...formData, original_price: e.target.value})} className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all sm:text-sm placeholder-text-muted" placeholder="200" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5 flex justify-between">
                      <span>Surplus Price (₹)</span> 
                      <span className="text-xs text-brand-primary font-semibold hidden sm:inline">(Max {formData.original_price ? formData.original_price * 0.5 : '50% off'})</span>
                    </label>
                    <input type="number" required min="0" max={formData.original_price ? formData.original_price * 0.5 : ''} value={formData.surplus_price} onChange={e => setFormData({...formData, surplus_price: e.target.value})} className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all sm:text-sm placeholder-text-muted" placeholder="80" />
                  </div>
                </div>
              </div>

              {/* Section 3: Handling & Safety */}
              <div>
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 pb-2 border-b border-dark-border">3. Preparation & Handling</h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Prepared At</label>
                    <input type="datetime-local" required value={formData.prepared_at} onChange={e => setFormData({...formData, prepared_at: e.target.value})} className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all sm:text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">Storage Method</label>
                      <select value={formData.storage_method} onChange={e => setFormData({...formData, storage_method: e.target.value})} className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all sm:text-sm appearance-none">
                        <option value="HOT_HELD">Hot Held</option>
                        <option value="COLD_HELD">Cold Held</option>
                        <option value="ROOM_TEMP">Room Temperature</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">Recorded Temp (°C)</label>
                      <input type="number" required value={formData.temperature} onChange={e => setFormData({...formData, temperature: e.target.value})} className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all sm:text-sm placeholder-text-muted" placeholder="65" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={loading} className="w-full !py-3.5 text-base shadow-brand-primary/20 shadow-lg">
                  {loading ? 'Evaluating Safety & Publishing...' : 'Publish Batch & Evaluate'}
                </Button>
              </div>
            </form>
            )}
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-5 space-y-6">
            {!result ? (
               <div className="bg-dark-card border border-dark-border rounded-3xl h-full p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 bg-dark-elevated rounded-full flex items-center justify-center border-4 border-dark-bg mb-6">
                     <BrainCircuit size={40} className="text-dark-border" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Awaiting Submission</h3>
                  <p className="text-text-secondary text-sm">Submit a batch to view AI classification, safety eligibility, and allocation insights.</p>
               </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                {/* AI Classification */}
                <div className="bg-dark-card rounded-3xl shadow-sm border border-brand-primary/20 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                  <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <BrainCircuit size={16} className="text-brand-primary" /> AI Classification
                    </h3>
                    <span className="text-[10px] font-mono bg-dark-elevated text-text-muted px-2 py-1 rounded border border-dark-border">ID: {result.batchId}</span>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-4">
                    <div className="bg-dark-elevated rounded-xl p-3 border border-dark-border">
                       <div className="text-xs text-text-muted mb-1">Category</div>
                       <div className="font-semibold text-white">{result.classification?.category || 'Menu Item Selected'}</div>
                    </div>
                    <div className="bg-dark-elevated rounded-xl p-3 border border-dark-border">
                       <div className="text-xs text-text-muted mb-1">Type</div>
                       <div className="font-semibold text-white">{result.classification?.type || 'Menu Item Selected'}</div>
                    </div>
                    {result.classification && (
                       <div className="col-span-2 text-xs text-brand-primary font-medium text-right flex items-center justify-end gap-1">
                          <CheckCircle2 size={12} /> High Confidence
                       </div>
                    )}
                  </div>
                </div>

                {/* Safety Engine Result */}
                <div className={`rounded-3xl p-6 border shadow-sm ${
                    result.eligibility.status === 'ELIGIBLE' ? 'bg-status-success/5 border-status-success/20' : 
                    result.eligibility.status === 'URGENT' ? 'bg-status-warning/5 border-status-warning/20' : 
                    'bg-status-danger/5 border-status-danger/20'
                  }`}>
                  
                  <div className="flex items-start gap-4">
                     <div className={`p-3 rounded-2xl ${
                        result.eligibility.status === 'ELIGIBLE' ? 'bg-status-success/20 text-status-success' : 
                        result.eligibility.status === 'URGENT' ? 'bg-status-warning/20 text-status-warning' : 
                        'bg-status-danger/20 text-status-danger'
                      }`}>
                       {result.eligibility.status === 'ELIGIBLE' ? <CheckCircle2 size={24} /> : 
                        result.eligibility.status === 'URGENT' ? <AlertTriangle size={24} /> : 
                        <XCircle size={24} />}
                     </div>
                     <div className="flex-1">
                        <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-wider">
                          {result.eligibility.status === 'ELIGIBLE' ? 'Eligible for Listing' : 
                           result.eligibility.status === 'URGENT' ? 'Urgent Handling Needed' : 
                           'Blocked'}
                        </h3>
                        <p className="text-sm text-text-secondary leading-relaxed mb-4">
                          {result.eligibility.reason}
                        </p>
                        
                        <div className="bg-dark-bg/50 rounded-xl p-3 flex justify-between items-center border border-dark-border">
                          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Handling Deadline</span>
                          <span className={`text-sm font-mono font-bold ${
                              result.eligibility.status === 'ELIGIBLE' ? 'text-status-success' : 
                              result.eligibility.status === 'URGENT' ? 'text-status-warning' : 
                              'text-status-danger'
                            }`}>
                            {new Date(result.eligibility.handlingDeadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Allocate Button / Result */}
                {result.eligibility.status !== 'BLOCKED' && !allocation && (
                  <Button variant="secondary" onClick={handleAllocate} className="w-full !py-3.5 !rounded-2xl border-brand-primary/30 hover:bg-brand-primary/10">
                    <BrainCircuit size={18} className="mr-2 text-brand-primary" /> Request AI Allocation Strategy
                  </Button>
                )}

                {/* Allocation Result */}
                {allocation && (
                  <div className="bg-dark-card rounded-3xl shadow-sm border border-brand-primary/30 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="px-6 py-4 border-b border-dark-border bg-gradient-to-r from-brand-primary/10 to-transparent">
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <BrainCircuit size={16} className="text-brand-primary" /> 
                        Allocation Engine Recommendation
                      </h2>
                    </div>
                    <div className="p-6 space-y-5">
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-dark-elevated rounded-xl p-4 border border-dark-border text-center">
                          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Marketplace</div>
                          <div className="text-4xl font-extrabold text-white">{allocation.allocation.customerAllocation}</div>
                          <div className="text-xs text-brand-primary font-medium mt-1">Portions</div>
                        </div>
                        <div className="bg-brand-primary/10 rounded-xl p-4 border border-brand-primary/20 text-center relative overflow-hidden">
                          <div className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-2 relative z-10">Donation</div>
                          <div className="text-4xl font-extrabold text-brand-primary relative z-10">{allocation.allocation.communityAllocation}</div>
                          <div className="text-xs text-brand-primary font-medium mt-1 relative z-10">Portions</div>
                          <HeartHandshake className="absolute -bottom-4 -right-4 text-brand-primary/10 w-24 h-24" />
                        </div>
                      </div>

                      <div className="bg-dark-elevated rounded-xl p-4 border border-dark-border text-sm">
                        <strong className="block mb-2 text-white flex items-center gap-1.5"><BrainCircuit size={14} className="text-text-secondary"/> AI Reasoning</strong>
                        <p className="text-text-secondary leading-relaxed">{allocation.allocation.explanation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {actionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-dark-border bg-dark-card p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">{actionDialog === 'menu' ? 'Add menu item' : 'Submit verification'}</h2>
            {actionDialog === 'menu' ? <div className="mt-5 space-y-3">
              <input placeholder="Item name" value={actionForm.name} onChange={e => setActionForm({ ...actionForm, name: e.target.value })} className="w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white" />
              <input placeholder="Category" value={actionForm.category} onChange={e => setActionForm({ ...actionForm, category: e.target.value })} className="w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white" />
              <select value={actionForm.food_type} onChange={e => setActionForm({ ...actionForm, food_type: e.target.value })} className="w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white"><option value="VEG">VEG</option><option value="NON_VEG">NON_VEG</option></select>
              <input type="number" min="1" placeholder="Normal price" value={actionForm.normal_price} onChange={e => setActionForm({ ...actionForm, normal_price: e.target.value })} className="w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white" />
            </div> : <input placeholder="FSSAI number" value={actionForm.fssai_number} onChange={e => setActionForm({ ...actionForm, fssai_number: e.target.value })} className="mt-5 w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white" />}
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setActionDialog(null)} className="rounded-xl border border-dark-border px-4 py-2 text-sm font-semibold text-text-secondary">Cancel</button><button type="button" onClick={actionDialog === 'menu' ? submitMenuItem : handleVerificationSubmit} className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-dark-bg">Submit</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDashboard;
