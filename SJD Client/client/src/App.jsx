import { useEffect } from "react";
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import AuthHeader from "./components/AuthHeader";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";

import Account from "./pages/auth/Account";
import Bookings from "./pages/auth/Bookings";
import Home from "./pages/auth/Home";
import Register from "./pages/auth/Register";
import SignIn from "./pages/auth/SignIn";
import TransactionDetails from "./pages/auth/TransactionDetails";
import Transactions from "./pages/auth/Transactions";
import Index from "./pages/Index";

// --- HELPER: Check if JWT is expired ---
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    const { exp } = JSON.parse(jsonPayload);
    return exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
};

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  // 1. Identify if we are in the 'auth' folder structure
  const isAuthPage = path.startsWith("/auth");

  // 2. Identify if this is a Login or Register page (Public Auth pages)
  const isPublicAuthPage = path === "/auth/signin" || path === "/auth/register";

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);

    // Protect /auth routes, BUT skip protection for SignIn and Register
    if (isAuthPage && !isPublicAuthPage) {
      const token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        localStorage.removeItem("token");
        navigate("/auth/signin");
      }
    }
  }, [isAuthPage, isPublicAuthPage, navigate, path]);

  // Layout for Auth Pages (Dashboard, etc.) AND Signin/Register
  if (isAuthPage) {
    return (
      <div className="flex flex-col h-screen w-screen bg-slate-50 overflow-hidden text-slate-900">
        {/* Only show AuthHeader if NOT on SignIn or Register pages */}
        {!isPublicAuthPage && (
          <div className="shrink-0 z-50">
            <AuthHeader />
          </div>
        )}

        <main className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">{children}</div>
        </main>
      </div>
    );
  }

  // Layout for Public Website (Landing page, etc.)
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow">{children}</div>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/home" element={<Home />} />
          <Route path="/auth/bookings" element={<Bookings />} />

          <Route path="/auth/transactions" element={<Transactions />} />

          <Route
            path="/auth/transaction-details/:id"
            element={<TransactionDetails />}
          />

          <Route path="/auth/account" element={<Account />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
