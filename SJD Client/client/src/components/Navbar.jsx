import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isHome = location.pathname === "/";

  const scrollToSection = (id) => {
    setIsMenuOpen(false);
    if (isHome) {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isHome) {
        if (window.scrollY >= window.innerHeight - 80) {
          setIsScrolled(true);
        } else {
          setIsScrolled(false);
        }
      } else {
        setIsScrolled(true);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMenuOpen]);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-slate-900 shadow-lg py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-between items-center">
        {/* LOGO */}
        <Link
          to="/"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            setIsMenuOpen(false);
          }}
          className="flex items-center gap-3 group"
        >
          <img
            src="/icon.png"
            alt="South Junk Dealer Logo"
            className="h-10 w-10 md:h-12 md:w-12 transition-transform duration-300 group-hover:rotate-12"
          />
          <span className="text-xl md:text-2xl font-bold text-white tracking-tight group-hover:text-[#F2C94C] transition-colors">
            South Junk Dealer
          </span>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <div className="hidden lg:flex items-center gap-8">
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-white hover:text-[#F2C94C] font-medium transition-colors text-sm uppercase tracking-wide"
          >
            Home
          </Link>

          <Link
            to="/#about"
            onClick={() => scrollToSection("about")}
            className="text-white hover:text-[#F2C94C] font-medium transition-colors text-sm uppercase tracking-wide cursor-pointer"
          >
            About Us
          </Link>

          <Link
            to="/#mission"
            onClick={() => scrollToSection("mission")}
            className="text-white hover:text-[#F2C94C] font-medium transition-colors text-sm uppercase tracking-wide cursor-pointer"
          >
            Mission
          </Link>

          <Link
            to="/#vision"
            onClick={() => scrollToSection("vision")}
            className="text-white hover:text-[#F2C94C] font-medium transition-colors text-sm uppercase tracking-wide cursor-pointer"
          >
            Vision
          </Link>

          <Link
            to="/#faqs"
            onClick={() => scrollToSection("faqs")}
            className="text-white hover:text-[#F2C94C] font-medium transition-colors text-sm uppercase tracking-wide cursor-pointer"
          >
            FAQs
          </Link>

          {/* GET STARTED BUTTON (Desktop) */}
          <Link
            to="/register"
            className="flex items-center justify-center w-36 bg-[#F2C94C] hover:bg-yellow-400 text-slate-900 font-bold py-2.5 rounded-full shadow-lg hover:shadow-yellow-400/30 transition-all transform hover:-translate-y-1 text-sm"
          >
            Get Started!
          </Link>
        </div>

        {/* MOBILE HAMBURGER BUTTON */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="lg:hidden text-white focus:outline-none"
          aria-label="Toggle Menu"
        >
          {isMenuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          )}
        </button>
      </div>

      {/* MOBILE FULLSCREEN MENU */}
      <div
        className={`fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-40 flex flex-col items-center justify-center gap-8 transition-all duration-300 lg:hidden ${
          isMenuOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <Link
          to="/"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            setIsMenuOpen(false);
          }}
          className="text-2xl text-white font-bold hover:text-[#F2C94C]"
        >
          Home
        </Link>
        <Link
          to="/#about"
          onClick={() => scrollToSection("about")}
          className="text-2xl text-white font-bold hover:text-[#F2C94C]"
        >
          About Us
        </Link>
        <Link
          to="/#mission"
          onClick={() => scrollToSection("mission")}
          className="text-2xl text-white font-bold hover:text-[#F2C94C]"
        >
          Mission
        </Link>
        <Link
          to="/#vision"
          onClick={() => scrollToSection("vision")}
          className="text-2xl text-white font-bold hover:text-[#F2C94C]"
        >
          Vision
        </Link>
        <Link
          to="/#faqs"
          onClick={() => scrollToSection("faqs")}
          className="text-2xl text-white font-bold hover:text-[#F2C94C]"
        >
          FAQs
        </Link>

        {/* GET STARTED BUTTON (Mobile Menu) */}
        <Link
          to="/register"
          onClick={() => setIsMenuOpen(false)}
          className="mt-4 flex items-center justify-center w-48 bg-[#F2C94C] hover:bg-yellow-400 text-slate-900 font-bold py-3 rounded-full shadow-lg text-lg transition-transform active:scale-95"
        >
          Get Started!
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
