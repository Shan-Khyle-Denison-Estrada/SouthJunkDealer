import { useEffect } from "react"; // Import useEffect
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
  useNavigate, // Import useNavigate
} from "react-router-dom";

import AuthHeader from "./components/AuthHeader";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";

import Account from "./pages/auth/Account";
import Bookings from "./pages/auth/Bookings";
import Home from "./pages/auth/Home";
import Register from "./pages/auth/Register";
import SignIn from "./pages/auth/SignIn";
import Transactions from "./pages/auth/Transactions";
import Index from "./pages/Index";

// --- HELPER: Check if JWT is expired ---
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    // Decode the payload (2nd part of the token)
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    const { exp } = JSON.parse(jsonPayload);
    // Check if expiration time is less than current time
    return exp * 1000 < Date.now();
  } catch (error) {
    return true; // If we can't decode it, assume it's invalid
  }
};

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate(); // Get navigate hook
  const path = location.pathname;

  // 1. Standalone Pages
  if (["/auth/signin", "/auth/register"].includes(path)) {
    return <>{children}</>;
  }

  // 2. Authenticated Dashboard Layout
  const authRoutes = [
    "/auth/home",
    "/auth/bookings",
    "/auth/transactions",
    "/auth/account",
  ];
  const isAuthPage = authRoutes.some((route) => path.startsWith(route));

  // --- NEW: Security Check ---
  useEffect(() => {
    if (isAuthPage) {
      const token = localStorage.getItem("token");
      // If no token OR token is expired
      if (!token || isTokenExpired(token)) {
        localStorage.removeItem("token"); // Clear invalid token
        navigate("/auth/signin"); // Kick user out
      }
    }
  }, [isAuthPage, navigate, path]); // Runs whenever path changes

  if (isAuthPage) {
    return (
      <div className="flex flex-col h-screen w-screen bg-slate-50 overflow-hidden text-slate-900">
        <div className="shrink-0 z-50">
          <AuthHeader />
        </div>
        <main className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">{children}</div>
        </main>
      </div>
    );
  }

  // 3. Public Website Layout
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
          <Route path="/auth/account" element={<Account />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
