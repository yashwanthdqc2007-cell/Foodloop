import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Search, MapPin } from 'lucide-react';
import { FoodCard } from '../components/FoodCard';
import { isPast } from 'date-fns';

const CustomerMarketplace = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const user = JSON.parse(localStorage.getItem('foodloop_user'));

  const fetchFoods = async () => {
    try {
      const data = await api.get('/foods');
      let filtered = data;
      if (user?.food_preference === 'VEG') {
        filtered = data.filter(f => f.veg_type === 'Vegetarian' || f.veg_type === 'VEG');
      } else if (user?.food_preference === 'NON_VEG') {
        filtered = data.filter(f => f.veg_type === 'Non-Vegetarian' || f.veg_type === 'NON-VEG');
      }
      setFoods(filtered);
    } catch (err) {
      setError('Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
    const interval = setInterval(fetchFoods, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOrder = async (food) => {
    setSelectedFood(food);
    setOrderQuantity(1);
  };

  const submitOrder = async () => {
    if (!selectedFood || orderQuantity < 1 || orderQuantity > selectedFood.quantity) return;
    try {
      await api.post('/orders', {
        customer_id: user.id,
        food_batch_id: selectedFood.id,
        quantity: orderQuantity
      });
      setSelectedFood(null);
      fetchFoods();
    } catch (err) {
      setError(err.message || 'Order failed');
    }
  };

  const visibleFoods = foods.filter(food => {
    const term = search.trim().toLowerCase();
    return !term || `${food.food_name} ${food.restaurant_name} ${food.category}`.toLowerCase().includes(term);
  });

  if (loading) return (
    <div className="flex justify-center p-12">
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-full bg-dark-elevated h-10 w-10"></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="bg-dark-card rounded-3xl p-8 md:p-12 border border-dark-border shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            Rescue great food near you.
          </h1>
          <p className="text-lg text-text-secondary mb-8">
            Fresh surplus. Better prices. Less waste.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={20} className="text-text-muted" />
              </div>
              <input
                type="text"
                placeholder="Search biryani, meals, restaurants..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-dark-bg border border-dark-border rounded-xl text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all placeholder-text-muted"
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-3.5 bg-dark-bg border border-dark-border rounded-xl text-text-secondary whitespace-nowrap">
              <MapPin size={20} className="text-brand-primary" />
              <span className="font-medium text-sm">Near you</span>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="bg-status-danger/10 border border-status-danger/20 text-status-danger px-6 py-4 rounded-xl font-medium">
          {error}
        </div>
      )}

      {selectedFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true" aria-labelledby="order-title">
          <div className="w-full max-w-md rounded-2xl border border-dark-border bg-dark-card p-6 shadow-2xl">
            <h2 id="order-title" className="text-xl font-bold text-white">Confirm your order</h2>
            <p className="mt-2 text-sm text-text-secondary">{selectedFood.food_name} at ₹{selectedFood.surplus_price} per portion</p>
            <label className="mt-5 block text-sm font-medium text-text-secondary" htmlFor="order-quantity">Portions</label>
            <input id="order-quantity" type="number" min="1" max={selectedFood.quantity} value={orderQuantity} onChange={e => setOrderQuantity(parseInt(e.target.value, 10) || 1)} className="mt-2 w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white focus:border-brand-primary focus:outline-none" />
            <p className="mt-3 text-right font-bold text-brand-primary">Total: ₹{orderQuantity * selectedFood.surplus_price}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setSelectedFood(null)} className="rounded-xl border border-dark-border px-4 py-2 text-sm font-semibold text-text-secondary hover:text-white">Cancel</button>
              <button type="button" onClick={submitOrder} className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-dark-bg hover:bg-brand-secondary">Confirm Order</button>
            </div>
          </div>
        </div>
      )}

      {/* Nearby Surplus Section */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">Nearby Surplus</h2>
        </div>

        {visibleFoods.length === 0 ? (
          <div className="py-16 text-center text-text-muted bg-dark-card rounded-2xl border border-dark-border border-dashed flex flex-col items-center justify-center">
             <div className="w-16 h-16 bg-dark-elevated rounded-full flex items-center justify-center mb-4">
                <Search size={24} className="text-text-secondary" />
             </div>
             <p className="font-medium text-lg text-text-secondary mb-1">{foods.length === 0 ? 'No surplus food nearby yet.' : 'No listings match your search.'}</p>
             <p className="text-sm">{foods.length === 0 ? 'Check again soon — new rescued meals appear throughout the day.' : 'Try another food, restaurant, or category.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleFoods.map(food => (
              <div key={food.id} className={isPast(new Date(food.handling_deadline)) ? 'opacity-50 grayscale pointer-events-none' : ''}>
                <FoodCard 
                  food={food} 
                  onAction={handleOrder}
                  actionLabel="Buy Now"
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CustomerMarketplace;
