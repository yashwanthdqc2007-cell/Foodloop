import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { CountdownTimer } from '../components/CountdownTimer';
import { Heart, Tag, MapPin } from 'lucide-react';
import { isPast } from 'date-fns';

const CommunityDashboard = () => {
  const user = JSON.parse(localStorage.getItem('foodloop_user'));
  const [requirements, setRequirements] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [claimQuantity, setClaimQuantity] = useState(1);
  const [claimRequirementId, setClaimRequirementId] = useState('');
  const [requirementDialog, setRequirementDialog] = useState(false);
  const [requirementForm, setRequirementForm] = useState({ category: '', food_type: 'ALL', quantity_required: '' });

  const fetchDashboardData = async () => {
    try {
      const reqData = await api.get('/community/requirements');
      const myReqs = reqData.filter(r => r.community_partner_id === user.community_partner_id);
      setRequirements(myReqs);
      
      const foodData = await api.get('/foods');
      
      const scoredMatches = foodData.map(f => {
        const req = myReqs.find(item => item.category === f.category) || myReqs[0];
        const distanceKm = req?.community_latitude != null && f.latitude != null
          ? Math.sqrt(Math.pow((f.latitude - req.community_latitude) * 111, 2) + Math.pow((f.longitude - req.community_longitude) * 96, 2))
          : 5;
        const distance = Math.max(0, Math.min(100, 100 - distanceKm * 20));
        const requirement = req && req.category === f.category && (req.food_type === 'ALL' || req.food_type === f.veg_type) ? 100 : 25;
        const hoursLeft = Math.max(0, (new Date(f.handling_deadline) - Date.now()) / 3600000);
        const urgency = Math.max(0, Math.min(100, 100 - hoursLeft * 20));
        const quantity = req ? Math.max(0, Math.min(100, f.quantity / Math.max(1, req.quantity_required - (req.quantity_received || 0)) * 100)) : 25;
        return {
          ...f,
          matchScore: Math.round(distance * 0.35 + requirement * 0.30 + urgency * 0.20 + quantity * 0.15),
          scoreBreakdown: { distance: Math.round(distance), requirement: Math.round(requirement), urgency: Math.round(urgency), quantity: Math.round(quantity) }
        };
      });
      
      scoredMatches.sort((a, b) => new Date(a.handling_deadline) - new Date(b.handling_deadline));
      setMatches(scoredMatches);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleClaim = async (batchId, maxQty) => {
    setSelectedMatch({ batchId, maxQty });
    setClaimQuantity(1);
    setClaimRequirementId(requirements[0]?.id?.toString() || '');
  };

  const submitClaim = async () => {
    if (!selectedMatch || claimQuantity < 1 || claimQuantity > selectedMatch.maxQty) return;
    try {
      await api.post(`/community/matches/${selectedMatch.batchId}/claim`, {
        community_partner_id: user.community_partner_id,
        quantity: claimQuantity,
        requirement_id: claimRequirementId ? parseInt(claimRequirementId, 10) : null
      });
      setSelectedMatch(null);
      fetchDashboardData();
    } catch (err) {
      setLoading(false);
    }
  };

  const submitRequirement = async () => {
    if (!requirementForm.category || !requirementForm.quantity_required) return;
    await api.post('/community/requirements', {
      community_partner_id: user.community_partner_id,
      ...requirementForm,
      quantity_required: parseInt(requirementForm.quantity_required, 10),
      required_by: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      pickup_available: 1
    });
    setRequirementDialog(false);
    fetchDashboardData();
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
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Community Partner Portal</h1>
        <p className="mt-2 text-text-secondary">Find and claim surplus food for community distribution.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Requirements Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-dark-card rounded-3xl shadow-sm border border-dark-border overflow-hidden">
            <div className="px-6 py-5 border-b border-dark-border bg-dark-secondary">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Heart size={16} className="text-brand-primary" /> Active Requirements
              </h2>
            </div>
            <div className="divide-y divide-dark-border">
              {requirements.length === 0 ? (
                <div className="p-8 text-sm text-text-muted text-center flex flex-col items-center">
                  <Heart size={32} className="opacity-20 mb-3" />
                  <p>No active requirements.</p>
                </div>
              ) : (
                requirements.map(req => {
                  const progress = Math.min(100, ((req.quantity_received || 0) / req.quantity_required) * 100);
                  return (
                    <div key={req.id} className="p-6 bg-dark-card hover:bg-dark-elevated transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          {req.category}
                        </span>
                        <Badge variant="neutral" className="!px-2">
                          {req.quantity_received || 0} / {req.quantity_required}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-text-secondary mb-4">
                        <span className="flex items-center gap-1"><Tag size={12}/> {req.food_type}</span>
                        <span>Needed by {new Date(req.required_by).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      
                      <div className="w-full bg-dark-bg rounded-full h-1.5 overflow-hidden border border-dark-border">
                        <div className="bg-brand-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="p-6 border-t border-dark-border bg-dark-secondary">
              <Button 
                variant="secondary"
                onClick={() => { setRequirementForm({ category: '', food_type: 'ALL', quantity_required: '' }); setRequirementDialog(true); }}
                className="w-full border-dashed hover:border-brand-primary hover:text-brand-primary"
              >
                + Post New Requirement
              </Button>
            </div>
          </div>
        </div>

        {/* Matches Area */}
        <div className="lg:col-span-8 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Available Matches
          </h2>
          
          <div className="space-y-4">
            {matches.length === 0 ? (
              <div className="py-16 text-center text-text-muted bg-dark-card rounded-3xl border border-dark-border border-dashed flex flex-col items-center">
                <div className="w-16 h-16 bg-dark-elevated rounded-full flex items-center justify-center mb-4">
                   <Heart size={24} className="text-text-secondary" />
                </div>
                <p className="font-medium text-lg text-text-secondary mb-1">No matches found right now.</p>
                <p className="text-sm">Check back later or add new requirements.</p>
              </div>
            ) : (
              matches.map(match => {
                const isExpired = isPast(new Date(match.handling_deadline));
                const isVeg = match.veg_type === 'Vegetarian' || match.veg_type === 'VEG';
                return (
                  <div key={match.id} className={`bg-dark-card rounded-3xl shadow-sm border border-dark-border p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center transition-all hover:border-dark-border/80 hover:shadow-lg ${isExpired ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                          <Heart size={12} className="fill-brand-primary"/> {match.matchScore}% Match
                        </span>
                        <span className="text-xs text-text-muted">35% distance · 30% requirement · 20% urgency · 15% quantity</span>
                        <Badge variant={isVeg ? 'success' : 'danger'} className="!px-2.5">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${isVeg ? 'bg-status-success' : 'bg-status-danger'}`}></span>
                          {isVeg ? 'VEG' : 'NON-VEG'}
                        </Badge>
                        <Badge variant="neutral" className="!px-2.5 flex items-center gap-1">
                          <Tag size={10} /> {match.category}
                        </Badge>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white leading-tight">{match.food_name}</h3>
                      <div className="flex items-center gap-1.5 text-sm text-text-secondary mt-2">
                        <MapPin size={14} className="text-brand-primary" />
                        <span className="font-medium">{match.restaurant_name}</span>
                        <span className="mx-1">•</span>
                        <span>{match.quantity} portions available</span>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-dark-border flex items-center">
                        <CountdownTimer deadline={match.handling_deadline} />
                      </div>
                      {match.scoreBreakdown && <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[10px] text-text-muted"><span>Distance<br /><strong className="text-text-secondary">{match.scoreBreakdown.distance}%</strong></span><span>Requirement<br /><strong className="text-text-secondary">{match.scoreBreakdown.requirement}%</strong></span><span>Urgency<br /><strong className="text-text-secondary">{match.scoreBreakdown.urgency}%</strong></span><span>Quantity<br /><strong className="text-text-secondary">{match.scoreBreakdown.quantity}%</strong></span></div>}
                    </div>
                    
                    <div className="w-full sm:w-auto mt-2 sm:mt-0">
                      <Button 
                        variant="primary"
                        onClick={() => handleClaim(match.id, match.quantity)}
                        disabled={isExpired || match.quantity === 0}
                        className="w-full sm:w-auto !px-8 !py-3 shadow-brand-primary/20 shadow-lg"
                      >
                        Claim Donation
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true" aria-labelledby="claim-title">
          <div className="w-full max-w-md rounded-2xl border border-dark-border bg-dark-card p-6 shadow-2xl">
            <h2 id="claim-title" className="text-xl font-bold text-white">Claim donation</h2>
            <label className="mt-5 block text-sm font-medium text-text-secondary" htmlFor="claim-quantity">Portions</label>
            <input id="claim-quantity" type="number" min="1" max={selectedMatch.maxQty} value={claimQuantity} onChange={e => setClaimQuantity(parseInt(e.target.value, 10) || 1)} className="mt-2 w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white focus:border-brand-primary focus:outline-none" />
            {requirements.length > 0 && (
              <>
                <label className="mt-4 block text-sm font-medium text-text-secondary" htmlFor="claim-requirement">Requirement</label>
                <select id="claim-requirement" value={claimRequirementId} onChange={e => setClaimRequirementId(e.target.value)} className="mt-2 w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white focus:border-brand-primary focus:outline-none">
                  <option value="">No linked requirement</option>
                  {requirements.map(req => <option key={req.id} value={req.id}>{req.category} ({req.quantity_required - (req.quantity_received || 0)} left)</option>)}
                </select>
              </>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setSelectedMatch(null)} className="rounded-xl border border-dark-border px-4 py-2 text-sm font-semibold text-text-secondary hover:text-white">Cancel</button>
              <button type="button" onClick={submitClaim} className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-dark-bg hover:bg-brand-secondary">Confirm Claim</button>
            </div>
          </div>
        </div>
      )}
      {requirementDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-dark-border bg-dark-card p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">Post requirement</h2>
            <div className="mt-5 space-y-3"><input placeholder="Category" value={requirementForm.category} onChange={e => setRequirementForm({ ...requirementForm, category: e.target.value })} className="w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white" /><select value={requirementForm.food_type} onChange={e => setRequirementForm({ ...requirementForm, food_type: e.target.value })} className="w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white"><option>ALL</option><option>VEG</option><option>NON_VEG</option></select><input type="number" min="1" placeholder="Quantity required" value={requirementForm.quantity_required} onChange={e => setRequirementForm({ ...requirementForm, quantity_required: e.target.value })} className="w-full rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-white" /></div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setRequirementDialog(false)} className="rounded-xl border border-dark-border px-4 py-2 text-sm font-semibold text-text-secondary">Cancel</button><button type="button" onClick={submitRequirement} className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-dark-bg">Submit</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityDashboard;
