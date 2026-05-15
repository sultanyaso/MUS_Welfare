import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing         from './pages/Landing';
import Login           from './pages/Login';
import Signup          from './pages/Signup';
import AdminDashboard  from './pages/AdminDashboard';
import MemberDashboard from './pages/MemberDashboard';
import { useResponsive } from './hooks/useResponsive';

/* ── Route guards ── */
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return children;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"          element={<Landing />} />
      <Route path="/login"     element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup"    element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><MemberDashboard /></PrivateRoute>} />
      <Route path="/admin"     element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
