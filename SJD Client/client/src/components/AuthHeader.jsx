import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const AuthHeader = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Mock User Data
  const user = { name: "Juan Dela Cruz" };

  const handleLogout = () => {
    navigate("/signin");
  };

  useEffect(() => {
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
      <Link to="/home" className="flex items-center gap-2 group">
        <img
          src="/icon.png"
          alt="Logo"
          className="h-8 w-8 transition-transform duration-300 group-hover:rotate-12"
        />
        <span className="text-lg font-bold tracking-tight text-white group-hover:text-[#F2C94C] transition-colors">
          South Junk Dealer
        </span>
      </Link>

      {/* RIGHT: User Profile */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          // UPDATED CLASSES:
          // 1. Mobile: rounded-full, p-1.5 (creates circle around the icon)
          // 2. Desktop (sm:): rounded-lg, specific padding (restores rectangle)
          className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 p-1.5 sm:pl-3 sm:pr-1.5 sm:py-1 rounded-full sm:rounded-lg font-bold transition-all shadow-sm active:scale-95 border border-slate-200"
        >
          {/* Name: Hidden on mobile, visible on sm+ */}
          <span className="text-sm font-bold hidden sm:block">{user.name}</span>

          {/* User Icon Circle */}
          <div className="h-7 w-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Chevron: Hidden on mobile to keep the button circular */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`hidden sm:block h-3 w-3 mr-1 text-slate-500 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        <div
          className={`absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-1 border border-slate-100 transform origin-top-right transition-all duration-200 z-50 ${
            isDropdownOpen
              ? "scale-100 opacity-100 visible"
              : "scale-95 opacity-0 invisible"
          }`}
        >
          <Link
            to="/account"
            onClick={() => setIsDropdownOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#F2C94C] font-medium transition-colors"
          >
            Account Settings
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default AuthHeader;
