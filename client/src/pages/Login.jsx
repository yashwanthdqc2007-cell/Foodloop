import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [foodPreference, setFoodPreference] = useState('ALL');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isRegister) {
        const data = await api.post('/auth/register', { 
            name, email, phone, password, location, food_preference: foodPreference 
        });
        localStorage.setItem('foodloop_user', JSON.stringify(data.user));
        navigate('/');
      } else {
        const data = await api.post('/auth/login', { email, password });
        localStorage.setItem('foodloop_user', JSON.stringify(data.user));
        
        // Redirect based on role
        if (data.user.role === 'CUSTOMER') navigate('/');
        else if (data.user.role === 'RESTAURANT') navigate('/restaurant');
        else if (data.user.role === 'COMMUNITY') navigate('/community');
        else if (data.user.role === 'ADMIN') navigate('/admin');
      }
    } catch (err) {
      setError(err.message || (isRegister ? 'Registration failed' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const loginAs = async (testEmail) => {
    setIsRegister(false);
    setEmail(testEmail);
    const pass = testEmail === 'admin@foodloop.com' ? 'admin123' : 'password123';
    setPassword(pass);
    
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email: testEmail, password: pass });
      localStorage.setItem('foodloop_user', JSON.stringify(data.user));
      
      if (data.user.role === 'CUSTOMER') navigate('/');
      else if (data.user.role === 'RESTAURANT') navigate('/restaurant');
      else if (data.user.role === 'COMMUNITY') navigate('/community');
      else if (data.user.role === 'ADMIN') navigate('/admin');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-dark-bg text-text-primary">
      {/* Left Side: Branding & Impact */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark-secondary relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent pointer-events-none"></div>
        <div className="absolute -left-24 -bottom-24 w-96 h-96 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span className="text-brand-primary">Food</span>Loop
          </h1>
          <p className="mt-2 text-text-secondary font-medium tracking-wide uppercase text-sm">Predict. Allocate. Rescue.</p>
          
          <div className="mt-16 max-w-md">
            <h2 className="text-5xl font-extrabold text-white leading-tight">Good food deserves another chance.</h2>
            <p className="mt-6 text-lg text-text-secondary leading-relaxed">
              Connect surplus food with people who need it — before it becomes waste. A smarter, data-driven approach to food rescue.
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-8 mt-12">
          <div>
            <div className="text-3xl font-extrabold text-white">500+</div>
            <div className="text-sm font-medium text-text-muted mt-1 uppercase tracking-wider">Meals Rescued</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-brand-primary">₹25K+</div>
            <div className="text-sm font-medium text-text-muted mt-1 uppercase tracking-wider">Revenue Recovered</div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          
          <div className="lg:hidden mb-10 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white">
              <span className="text-brand-primary">Food</span>Loop
            </h1>
            <p className="mt-2 text-text-secondary font-medium">Predict. Allocate. Rescue.</p>
          </div>

          <div className="bg-dark-card border border-dark-border p-8 rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-2">
              {isRegister ? 'Create an account' : 'Welcome back'}
            </h2>
            <p className="text-sm text-text-secondary mb-8">
              {isRegister ? 'Join the movement to end food waste.' : 'Enter your details to access your dashboard.'}
            </p>
            
            {error && (
              <div className="bg-status-danger/10 border border-status-danger/20 text-status-danger px-4 py-3 rounded-xl text-sm mb-6">
                {error}
              </div>
            )}
            
            <form className="space-y-5" onSubmit={handleAuth}>
              {isRegister && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors sm:text-sm placeholder-text-muted" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Phone</label>
                    <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors sm:text-sm placeholder-text-muted" placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Location</label>
                    <input type="text" required value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors sm:text-sm placeholder-text-muted" placeholder="Chennai, TN" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Food Preference</label>
                    <select value={foodPreference} onChange={(e) => setFoodPreference(e.target.value)} className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors sm:text-sm">
                      <option value="ALL">All</option>
                      <option value="VEG">Vegetarian Only</option>
                      <option value="NON_VEG">Non-Vegetarian Only</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors sm:text-sm placeholder-text-muted"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors sm:text-sm placeholder-text-muted"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-dark-bg bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg focus:ring-brand-primary transition-all disabled:opacity-50"
                >
                  {loading ? (isRegister ? 'Creating Account...' : 'Signing in...') : (isRegister ? 'Create Account' : 'Sign In')}
                </button>
              </div>
            </form>
            
            <div className="text-center mt-6">
              <button type="button" onClick={() => setIsRegister(!isRegister)} className="text-sm text-brand-primary hover:text-brand-accent font-medium transition-colors">
                {isRegister ? 'Already have an account? Sign in' : 'New here? Create an account'}
              </button>
            </div>
            
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dark-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-dark-card text-text-muted uppercase tracking-wider font-semibold">Or use quick demo</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button onClick={() => loginAs('customer@foodloop.com')} className="text-xs bg-dark-elevated border border-dark-border hover:border-brand-primary/50 text-text-primary py-2.5 px-3 rounded-xl transition-all">Customer</button>
                <button onClick={() => loginAs('buhari@foodloop.com')} className="text-xs bg-dark-elevated border border-dark-border hover:border-brand-primary/50 text-text-primary py-2.5 px-3 rounded-xl transition-all">Restaurant</button>
                <button onClick={() => loginAs('kitchena@foodloop.com')} className="text-xs bg-dark-elevated border border-dark-border hover:border-brand-primary/50 text-text-primary py-2.5 px-3 rounded-xl transition-all">Community</button>
                <button onClick={() => loginAs('admin@foodloop.com')} className="text-xs bg-dark-elevated border border-dark-border hover:border-brand-primary/50 text-text-primary py-2.5 px-3 rounded-xl transition-all">Admin</button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
