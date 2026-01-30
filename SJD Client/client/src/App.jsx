import {
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from "react-router-dom";

import AuthHeader from "./components/AuthHeader"; // Ensure this path is correct
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";

import Account from "./pages/auth/Account";
import Bookings from "./pages/auth/Bookings";
import Home from "./pages/auth/Home";
import Register from "./pages/auth/Register";
import SignIn from "./pages/auth/SignIn";
import Transactions from "./pages/auth/Transactions";
import Index from "./pages/Index";

const Layout = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;

  // 1. Standalone Pages (No Headers/Footers)
  if (["/auth/signin", "/auth/register"].includes(path)) {
    return <>{children}</>;
  }

  // 2. Authenticated Dashboard Layout (Fixed Screen, No Scroll)
  // This layout forces the header to be fixed and the content to fill the rest.
  const authRoutes = [
    "/auth/home",
    "/auth/bookings",
    "/auth/transactions",
    "/auth/account",
  ];
  const isAuthPage = authRoutes.some((route) => path.startsWith(route));

  if (isAuthPage) {
    return (
      <div className="flex flex-col h-screen w-screen bg-slate-50 overflow-hidden text-slate-900">
        {/* Header takes natural height, does not shrink */}
        <div className="shrink-0 z-50">
          <AuthHeader />
        </div>

        {/* Main takes remaining height. Relative positioning allows children to be absolute. */}
        <main className="flex-1 relative overflow-hidden">
          {/* Absolute inset-0 forces the child to fit EXACTLY into this container */}
          <div className="absolute inset-0 overflow-hidden">{children}</div>
        </main>
      </div>
    );
  }

  // 3. Public Website Layout (Scrollable)
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
