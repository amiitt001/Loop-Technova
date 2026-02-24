import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import Team from './pages/Team';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Join from './pages/Join';
import Chatbot from './components/Chatbot';
import ThreeBackground from './components/ThreeBackground';

// Admin Imports
import AdminLayout from './layouts/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMembers from './pages/admin/AdminMembers';
import AdminCreateMember from './pages/admin/AdminCreateMember';
import AdminEditMember from './pages/admin/AdminEditMember';
import AdminCreateEvent from './pages/admin/AdminCreateEvent';
import AdminEditEvent from './pages/admin/AdminEditEvent';
import AdminLeaderboard from './pages/admin/AdminLeaderboard';
import AdminCreateContestant from './pages/admin/AdminCreateContestant';
import AdminEditContestant from './pages/admin/AdminEditContestant';
import AdminApplications from './pages/admin/AdminApplications';
import AdminMessages from './pages/admin/AdminMessages';

import AdminEvents from './pages/admin/AdminEvents';

// Layout for public pages that includes Navbar, Footer, and the global 3D background
const PublicLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-dark)] text-[var(--text-main)] font-[var(--font-main)]">
      {/* Global 3D background — fixed, renders behind all public pages */}
      <ThreeBackground variant="home" />
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Chatbot />
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Admin Routes - Protected by AdminLayout logic */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="members" element={<AdminMembers />} />
            <Route path="members/new" element={<AdminCreateMember />} />
            <Route path="members/edit/:id" element={<AdminEditMember />} />
            <Route path="contestants" element={<AdminLeaderboard />} />
            <Route path="contestants/new" element={<AdminCreateContestant />} />
            <Route path="contestants/edit/:id" element={<AdminEditContestant />} />
            <Route path="applications" element={<AdminApplications />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="events/new" element={<AdminCreateEvent />} />
            <Route path="events/edit/:id" element={<AdminEditEvent />} />
          </Route>

          {/* Public Routes */}
          <Route path="/*" element={
            <PublicLayout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/team" element={<Team />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetails />} />
                <Route path="/join" element={<Join />} />
              </Routes>
            </PublicLayout>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
