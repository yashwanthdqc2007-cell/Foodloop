import React, { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/Button';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('foodloop_user'));

  useEffect(() => {
    if (!user && location.pathname !== '/login') {
      navigate('/login');
    } else if (user) {
      const roleRoutes = {
        CUSTOMER: ['/', '/profile', '/restaurant-view/*'],
        RESTAURANT: ['/restaurant'],
        COMMUNITY: ['/community'],
        ADMIN: ['/admin']
      };
      const allowed = roleRoutes[user.role] || [];
      const canAccess = allowed.some(route => route.endsWith('/*') ? location.pathname.startsWith(route.slice(0, -1)) : location.pathname === route);
      if (!canAccess) {
        if (user.role === 'RESTAURANT') navigate('/restaurant');
        else if (user.role === 'COMMUNITY') navigate('/community');
        else if (user.role === 'ADMIN') navigate('/admin');
        else navigate('/');
      }
    }
  }, [user, navigate, location]);

  const handleLogout = () => {
    localStorage.removeItem('foodloop_user');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-dark-bg text-text-primary">
      <header className="bg-dark-secondary border-b border-dark-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 min-w-0 gap-3">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <span className="text-2xl font-extrabold text-white">
                  <span className="text-brand-primary">Food</span>Loop
                </span>
                <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  BETA
                </span>
              </Link>
            </div>
            <nav className="flex min-w-0 flex-1 justify-center gap-4 overflow-x-auto sm:space-x-8 sm:gap-0">
              {user.role === 'CUSTOMER' && (
                <>
                  <Link to="/" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${location.pathname === '/' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-secondary hover:text-white'}`}>Marketplace</Link>
                  <Link to="/profile" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${location.pathname === '/profile' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-secondary hover:text-white'}`}>My Profile</Link>
                </>
              )}
              {user.role === 'RESTAURANT' && <Link to="/restaurant" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${location.pathname === '/restaurant' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-secondary hover:text-white'}`}>Dashboard</Link>}
              {user.role === 'COMMUNITY' && <Link to="/community" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${location.pathname === '/community' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-secondary hover:text-white'}`}>Community</Link>}
              {user.role === 'ADMIN' && <Link to="/admin" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${location.pathname === '/admin' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-secondary hover:text-white'}`}>Admin Dashboard</Link>}
            </nav>
            <div className="flex items-center gap-6">
              <div className="hidden text-sm flex-col items-end sm:flex">
                <span className="font-bold text-white">{user.name}</span>
                <span className="text-[10px] uppercase tracking-widest text-brand-primary font-semibold">{user.role}</span>
              </div>
              <Button variant="secondary" onClick={handleLogout} className="!py-1.5 !px-3 text-xs">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
