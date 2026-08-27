import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from './Badge';
import { Button } from './Button';
import { CountdownTimer } from './CountdownTimer';
import { MapPin } from 'lucide-react';

export const FoodCard = ({ food, onAction, actionLabel = "Add" }) => {
  const discount = Math.round((1 - (food.surplus_price / food.original_price)) * 100);
  const isVeg = food.veg_type === 'Vegetarian' || food.veg_type === 'VEG';

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-dark-border/80 transition-all group flex flex-col h-full">
      <div className="relative h-40 bg-dark-elevated">
        {/* Placeholder for food image since we don't have real images yet, use a pattern or gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-elevated to-dark-bg opacity-50"></div>
        <div className="absolute top-3 left-3 flex gap-2">
           {discount > 0 && <Badge variant="primary">{discount}% OFF</Badge>}
        </div>
        <div className="absolute top-3 right-3">
           <Badge variant={isVeg ? 'success' : 'danger'}>
             <span className={`inline-block w-2 h-2 rounded-full mr-1 ${isVeg ? 'bg-status-success' : 'bg-status-danger'}`}></span>
             {isVeg ? 'VEG' : 'NON-VEG'}
           </Badge>
        </div>
        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-dark-bg/90 to-transparent">
          <h3 className="text-lg font-bold text-text-primary line-clamp-1">{food.food_name}</h3>
          <Link to={`/restaurant-view/${food.restaurant_id}`} className="text-sm text-text-secondary hover:text-brand-primary">{food.restaurant_name}</Link>
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-text-muted mb-4">
            <MapPin size={14} className="text-brand-primary" /> 
            <span>{food.address || 'Nearby'}</span>
            <span className="mx-1">•</span>
            <span>{food.quantity} left</span>
          </div>
          
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-bold text-text-primary">₹{food.surplus_price}</span>
            <span className="text-sm text-text-muted line-through">₹{food.original_price}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-dark-border mt-auto">
          <CountdownTimer deadline={food.handling_deadline} />
          {onAction && (
             <Button variant="primary" onClick={() => onAction(food)} className="!px-6 !py-2">
               {actionLabel}
             </Button>
          )}
        </div>
      </div>
    </div>
  );
};
