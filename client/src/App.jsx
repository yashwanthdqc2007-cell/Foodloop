import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import CustomerMarketplace from './pages/CustomerMarketplace';
import CustomerProfile from './pages/CustomerProfile';
import RestaurantProfile from './pages/RestaurantProfile';
import RestaurantDashboard from './pages/RestaurantDashboard';
import CommunityDashboard from './pages/CommunityDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Layout from './layouts/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<CustomerMarketplace />} />
          <Route path="profile" element={<CustomerProfile />} />
          <Route path="restaurant-view/:id" element={<RestaurantProfile />} />
          <Route path="restaurant" element={<RestaurantDashboard />} />
          <Route path="community" element={<CommunityDashboard />} />
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
