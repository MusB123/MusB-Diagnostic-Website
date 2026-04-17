import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop/index.js';
import Navbar from './components/Navbar/index.js';
import { CartProvider } from './context/CartContext';
import Home from './pages/Home/index.js'; // Keep Home eager for LCP
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import FloatingCart from './components/FloatingCart/index.js';
import Footer from './components/Footer/index.js';

// Lazy load heavy portal and admin pages
const TestCatalog = lazy(() => import('./pages/TestCatalog/index.js'));
const Booking = lazy(() => import('./pages/Booking/index.js'));
const OffersHub = lazy(() => import('./pages/OffersHub/index.js'));
const EmployerHub = lazy(() => import('./pages/EmployerHub/index.js'));
const ResearchCentralLab = lazy(() => import('./pages/ResearchCentralLab/index.js'));
const ResearchLogin = lazy(() => import('./pages/ResearchPortal/Login.js'));
const ResearchDashboard = lazy(() => import('./pages/ResearchPortal/Dashboard.js'));
const Cart = lazy(() => import('./pages/Cart/index.js'));
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage/index.js'));
const EmployerDashboard = lazy(() => import('./pages/EmployerDashboard/index.js'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute/index.js'));
const SuperAdminLayout = lazy(() => import('./components/Admin/SuperAdminLayout.js'));
const SuperAdminRoute = lazy(() => import('./components/ProtectedRoute/SuperAdminRoute.js'));
const SuperAdminLogin = lazy(() => import('./pages/SuperAdmin/Login.js'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdmin/Dashboard.js'));
const OffersEngine = lazy(() => import('./pages/SuperAdmin/OffersEngine.js'));
const CatalogManager = lazy(() => import('./pages/SuperAdmin/CatalogManager.js'));
const PhlebotomyManagement = lazy(() => import('./pages/SuperAdmin/PhlebotomyManagement.js'));
const EmployeeEnrollment = lazy(() => import('./pages/EmployeeEnrollment/index.js'));
const MobilePhlebotomy = lazy(() => import('./pages/MobilePhlebotomy/index.js'));
const AssistedLiving = lazy(() => import('./pages/AssistedLiving/index.js'));
const CommunityPrograms = lazy(() => import('./pages/CommunityPrograms/index.js'));
const PhysicianPortal = lazy(() => import('./pages/PhysicianPortal/index.js'));
const EarlyDiagnostics = lazy(() => import('./pages/EarlyDiagnostics/index.js'));
const SelfPayPatients = lazy(() => import('./pages/SelfPay/index.js'));
const PhlebotomistDashboard = lazy(() => import('./pages/MobilePhlebotomy/Dashboard.js'));
const PhlebotomistLogin = lazy(() => import('./pages/MobilePhlebotomy/Login.js'));
const PhlebotomyHub = lazy(() => import('./pages/PhlebotomyHub/index'));
const DiagnosticLogin = lazy(() => import('./pages/DiagnosticPortal/DiagnosticLogin.js'));
const DiagnosticDashboard = lazy(() => import('./pages/DiagnosticPortal/DiagnosticDashboard.js'));
const PatientAuth = lazy(() => import('./pages/MobilePhlebotomy/PatientPortal/Auth.js'));
const BookingWizard = lazy(() => import('./pages/MobilePhlebotomy/PatientPortal/BookingWizard.js'));
const PatientDashboard = lazy(() => import('./pages/MobilePhlebotomy/PatientPortal/PatientDashboard.js'));
const PatientTracking = lazy(() => import('./pages/MobilePhlebotomy/PatientPortal/Tracking.js'));
const PhlebotomistProfilePage = lazy(() => import('./pages/MobilePhlebotomy/PatientPortal/PhlebotomistProfile.js'));
const PatientRating = lazy(() => import('./pages/MobilePhlebotomy/PatientPortal/RatingScreen.js'));
const SpecialistOnboarding = lazy(() => import('./pages/MobilePhlebotomy/SpecialistPortal/Onboarding.js'));

// Loading Fallback
const PageLoader = () => (
  <div className="page-loader-minimal">
    <div className="loader-orbit"></div>
  </div>
);

// Layout component for public-facing site
const PublicLayout = ({ children }) => (
  <div className="app-container">
    <Navbar />
    <main>
      {children}
    </main>
    <Footer />
    <FloatingCart />
  </div>
);

function App() {
  return (
    <Router>
      <AdminAuthProvider>
        <AuthProvider>
          <CartProvider>
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Super Admin Routes (Shared Layout) */}
                <Route path="/superadmin/login" element={<SuperAdminLogin />} />
                <Route path="/superadmin" element={
                  <SuperAdminRoute>
                    <SuperAdminLayout />
                  </SuperAdminRoute>
                }>
                  <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
                  <Route path="dashboard" element={<SuperAdminDashboard />} />
                  <Route path="identity" element={<PlaceholderPage title="Identity & Access" />} />
                  <Route path="cms" element={<PlaceholderPage title="Website/CMS Oversight" />} />
                  <Route path="commerce" element={<CatalogManager />} />
                  <Route path="offers" element={<OffersEngine />} />
                  <Route path="phlebotomy" element={<PhlebotomyManagement />} />
                  <Route path="integrations" element={<PlaceholderPage title="Integrations" />} />
                  <Route path="crm" element={<PlaceholderPage title="CRM & Marketing" />} />
                  <Route path="portals" element={<PlaceholderPage title="Portals Management" />} />
                  <Route path="activity-log" element={<PlaceholderPage title="System Activity Log" />} />
                </Route>

                {/* Portal Routes */}
                <Route path="/portal/employer" element={
                  <ProtectedRoute>
                    <EmployerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/portal/research/login" element={<ResearchLogin />} />
                <Route path="/portal/research/*" element={<ResearchDashboard />} />
                <Route path="/portal/diagnostic/login" element={<DiagnosticLogin />} />
                <Route path="/portal/diagnostic/*" element={<DiagnosticDashboard />} />
                <Route path="/portal/phlebotomist/login" element={<PhlebotomistLogin isOpen={true} onClose={() => window.location.href='/mobile-phlebotomy'} />} />
                <Route path="/portal/phlebotomist/dashboard" element={<PhlebotomistDashboard />} />
                <Route path="/portal/phlebotomy-hub/*" element={<PhlebotomyHub />} />
                <Route path="/portal/patient/login" element={<PatientAuth />} />
                <Route path="/portal/patient/book" element={<BookingWizard />} />
                <Route path="/portal/patient/dashboard" element={<PatientDashboard />} />
                <Route path="/portal/patient/tracking" element={<PatientTracking />} />
                <Route path="/portal/patient/phlebotomist/:id" element={<PhlebotomistProfilePage />} />
                <Route path="/portal/patient/rate" element={<PatientRating />} />
                <Route path="/mobile-phlebotomy/onboarding" element={<SpecialistOnboarding />} />
                <Route path="/enroll/:token" element={<EmployeeEnrollment />} />

                {/* Public Site Routes */}
                <Route path="*" element={
                  <PublicLayout>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/tests" element={<TestCatalog />} />
                      <Route path="/test-catalog" element={<TestCatalog />} />
                      <Route path="/book" element={<Booking />} />
                      <Route path="/offers" element={<OffersHub />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/employer-health-program" element={<EmployerHub />} />
                      <Route path="/about" element={<PlaceholderPage />} />
                      <Route path="/contact" element={<PlaceholderPage />} />
                      <Route path="/locations" element={<PlaceholderPage />} />
                      <Route path="/panels" element={<PlaceholderPage />} />
                      <Route path="/pricing" element={<PlaceholderPage />} />
                      <Route path="/blog" element={<PlaceholderPage />} />
                      <Route path="/login" element={<PlaceholderPage />} />
                      <Route path="/research-central-lab" element={<ResearchCentralLab />} />
                      <Route path="/mobile-phlebotomy" element={<MobilePhlebotomy />} />
                      <Route path="/assisted-living-testing" element={<AssistedLiving />} />
                      <Route path="/community-programs" element={<CommunityPrograms />} />
                      <Route path="/physicians" element={<PhysicianPortal />} />
                      <Route path="/early-diagnostics" element={<EarlyDiagnostics />} />
                      <Route path="/self-pay-lab-tests" element={<SelfPayPatients />} />
                      <Route path="*" element={<PlaceholderPage />} />
                    </Routes>
                  </PublicLayout>
                } />
              </Routes>
            </Suspense>
          </CartProvider>
        </AuthProvider>
      </AdminAuthProvider>
    </Router>
  );
}
export default App;
