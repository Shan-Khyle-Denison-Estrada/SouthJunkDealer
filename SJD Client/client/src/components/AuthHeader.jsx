import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const AuthHeader = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState({ name: "User", photo: null });
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth/signin");
  };

  // 1. Fetch User Data on Mount
  const getUserProfile = async () => {
    try {
      const response = await fetch("http://localhost:5000/auth/account", {
        method: "GET",
        headers: { token: localStorage.getItem("token") },
      });

      // --- FIX: Check for Expired Session (401/403) ---
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        return;
      }

      if (response.ok) {
        const parseRes = await response.json();
        setUser({
          name: `${parseRes.first_name} ${parseRes.last_name}`,
          photo: parseRes.profile_photo, // FIX: Use 'profile_photo' from DB
        });
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    getUserProfile(); // Call the fetch function

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-slate-900 text-white py-2 px-4 md:px-6 flex justify-between items-center shadow-md z-50 shrink-0">
      {/* LEFT: Compact Logo */}
      <Link to="/auth/home" className="flex items-center gap-2 group">
        <img
          src="/icon.png"
          alt="Logo"
          className="h-8 w-8 transition-transform duration-300 group-hover:rotate-12"
        />
        <span className="text-lg font-bold tracking-tight text-white group-hover:text-[#F2C94C] transition-colors">
          SOUTH<span className="text-[#F2C94C]">JUNK</span>DEALER
        </span>
      </Link>

      {/* RIGHT: User Profile */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-3 focus:outline-none group p-1 rounded-full hover:bg-white/10 transition-all px-4"
        >
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-white group-hover:text-[#F2C94C] transition-colors">
              {user.name}
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Verified User
            </p>
          </div>

          {/* USER AVATAR */}
          <div className="h-10 w-10 rounded-full border-2 border-[#F2C94C] overflow-hidden bg-slate-800">
            {user.photo ? (
              <img
                src={user.photo}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-full w-full text-slate-400 p-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </button>

        {/* DROPDOWN MENU */}
        <div
          className={`absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-slate-100 transform origin-top-right transition-all duration-200 z-50 ${
            isDropdownOpen
              ? "scale-100 opacity-100 visible"
              : "scale-95 opacity-0 invisible"
          }`}
        >
          <Link
            to="/auth/home"
            onClick={() => setIsDropdownOpen(false)}
            className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#F2C94C] font-medium transition-colors border-b border-slate-50"
          >
            Dashboard
          </Link>
          <Link
            to="/auth/transactions"
            onClick={() => setIsDropdownOpen(false)}
            className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#F2C94C] font-medium transition-colors border-b border-slate-50"
          >
            Transactions
          </Link>
          <Link
            to="/auth/account"
            onClick={() => setIsDropdownOpen(false)}
            className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#F2C94C] font-medium transition-colors border-b border-slate-50"
          >
            Account Settings
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 font-bold transition-colors rounded-b-xl"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default AuthHeader;
