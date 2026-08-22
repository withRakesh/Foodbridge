import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import RoleRoute from './components/RoleRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import NgoDashboard from './pages/NgoDashboard';
import RestaurantDashboard from './pages/RestaurantDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Placeholder shown for a route that's approved architecture but not yet
// built — swap each of these out as the real dashboard lands. Keeping
// them wired into App.jsx now means RoleRoute guards are already correct
// and don't need touching later.
function ComingSoon({ title }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-2xl font-700 text-accent">{title}</h1>
      <p className="mt-2 text-neutral-600">This dashboard is being built next.</p>
    </div>
  );
}

function Unauthorized() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-2xl font-700 text-accent">Not authorized</h1>
      <p className="mt-2 text-neutral-600">Your account doesn't have access to that page.</p>
    </div>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route element={<PrivateRoute />}>
            <Route element={<RoleRoute allowed={['restaurant']} />}>
              <Route path="/restaurant" element={<RestaurantDashboard />} />
            </Route>
            <Route element={<RoleRoute allowed={['ngo']} />}>
              <Route path="/ngo" element={<NgoDashboard />} />
            </Route>
            <Route element={<RoleRoute allowed={['volunteer']} />}>
              <Route path="/volunteer" element={<VolunteerDashboard />} />
            </Route>
            <Route element={<RoleRoute allowed={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Route>

          <Route path="*" element={<ComingSoon title="Page not found" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
