import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import TrackComplaint from './pages/TrackComplaint';
import SubmitComplaint from './pages/SubmitComplaint';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Complaints from './pages/Complaints';
import ComplaintDetail from './pages/ComplaintDetail';
import Admin from './pages/Admin';
import AdminUsers from './pages/AdminUsers';
import AdminCategories from './pages/AdminCategories';
import AdminAgents from './pages/AdminAgents';
import AdminActivity from './pages/AdminActivity';
import AdminSettings from './pages/AdminSettings';
import Profile from './pages/Profile';
import MainLayout from './layouts/MainLayout';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

const AdminRoute = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/track" element={<TrackComplaint />} />
        <Route path="/submit" element={<SubmitComplaint />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="complaints" element={<Complaints />} />
            <Route path="complaints/:id" element={<ComplaintDetail />} />
            <Route element={<AdminRoute />}>
              <Route path="admin" element={<Admin />} />
              <Route path="admin/users" element={<AdminUsers />} />
              <Route path="admin/categories" element={<AdminCategories />} />
              <Route path="admin/agents" element={<AdminAgents />} />
              <Route path="admin/activity" element={<AdminActivity />} />
              <Route path="admin/settings" element={<AdminSettings />} />
            </Route>
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
