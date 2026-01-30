import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Footer = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const footerRef = useRef(null);
  const location = useLocation();

  const scrollToSection = (id) => {
    if (location.pathname === "/") {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowBackToTop(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => {
      if (footerRef.current) observer.unobserve(footerRef.current);
    };
  }, []);

  return (
    <footer
      ref={footerRef}
      className="bg-slate-900 text-white pt-16 md:pt-20 pb-10 relative"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* --- TOP ROW --- */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-12 mb-12 md:mb-16 items-center md:items-start text-center md:text-left">
          {/* Column 1: Icon & Branding */}
          <div className="md:col-span-2 flex flex-col items-center md:items-center text-center gap-6">
            <div className="flex items-center justify-center w-full">
              <img
                src="/seal.png"
                alt="South Junk Dealer Logo"
                className="aspect-square h-40 md:h-52 object-contain"
              />
            </div>
            {/* <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Redefining waste management in Zamboanga City with AI precision
              and secure cloud technology. Join us in building a sustainable
              future.
            </p> */}
          </div>

          {/* Column 2: Explore */}
          <div className="md:col-span-1 md:pt-2">
            <h3 className="text-lg font-bold mb-4 md:mb-6 text-[#F2C94C] tracking-wide uppercase text-sm">
              Explore
            </h3>
            <ul className="space-y-4 text-slate-300 font-medium cursor-pointer">
              <li>
                <Link
                  to="/#about"
                  onClick={() => scrollToSection("about")}
                  className="hover:text-white transition-colors hover:translate-x-1 inline-block duration-200"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/#mission"
                  onClick={() => scrollToSection("mission")}
                  className="hover:text-white transition-colors hover:translate-x-1 inline-block duration-200"
                >
                  Mission
                </Link>
              </li>
              <li>
                <Link
                  to="/#vision"
                  onClick={() => scrollToSection("vision")}
                  className="hover:text-white transition-colors hover:translate-x-1 inline-block duration-200"
                >
                  Vision
                </Link>
              </li>
              <li>
                <Link
                  to="/#faqs"
                  onClick={() => scrollToSection("faqs")}
                  className="hover:text-white transition-colors hover:translate-x-1 inline-block duration-200"
                >
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Us */}
          <div className="md:col-span-1 md:pt-2">
            <h3 className="text-lg font-bold mb-4 md:mb-6 text-[#F2C94C] tracking-wide uppercase text-sm">
              Contact Us
            </h3>
            <ul className="space-y-4 text-slate-300 text-sm flex flex-col items-center md:items-start">
              <li className="flex items-center gap-3 group">
                <span className="bg-slate-800 p-2 rounded-full group-hover:bg-[#F2C94C] group-hover:text-slate-900 transition-colors">
                  📧
                </span>
                <span>info@southjunk.com</span>
              </li>
              <li className="flex items-center gap-3 group">
                <span className="bg-slate-800 p-2 rounded-full group-hover:bg-[#F2C94C] group-hover:text-slate-900 transition-colors">
                  📞
                </span>
                <span>+63 912 345 6789</span>
              </li>
              <li className="flex items-center gap-3 group">
                <span className="bg-slate-800 p-2 rounded-full group-hover:bg-[#F2C94C] group-hover:text-slate-900 transition-colors">
                  📍
                </span>
                <span>Zamboanga City, PH</span>
              </li>
            </ul>
          </div>

          {/* Column 4: CTA Button */}
          <div className="md:col-span-1 flex flex-col items-center md:items-start md:pt-2">
            <h3 className="text-lg font-bold mb-4 md:mb-6 text-[#F2C94C] tracking-wide uppercase text-sm">
              Ready to trade?
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Get the best rates for your scrap today.
            </p>
            {/* BUTTON: #F2C94C + Dark Text */}
            <Link to="/auth/register">
              <button className="bg-[#F2C94C] hover:bg-yellow-400 text-slate-900 font-bold py-3 px-8 rounded-full transition-all shadow-lg hover:shadow-yellow-400/30 transform hover:-translate-y-1 w-full md:w-auto">
                Get Started
              </button>
            </Link>
          </div>
        </div>

        {/* --- SEPARATOR LINE --- */}
        <div className="w-full h-px bg-slate-800 rounded-full mb-8"></div>

        {/* --- BOTTOM ROW --- */}
        <div className="flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm gap-4 text-center">
          <p>&copy; 2026 South Junk Dealer. All rights reserved.</p>

          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>

      {/* --- BACK TO TOP BUTTON --- */}
      {/* Changed to #F2C94C + Dark Text */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-[#F2C94C] text-slate-900 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full shadow-lg hover:bg-yellow-400 transition-all duration-300 transform z-50 ${
          showBackToTop
            ? "translate-y-0 opacity-100"
            : "translate-y-20 opacity-0"
        }`}
        aria-label="Back to Top"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 md:h-6 md:w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 15l7-7 7 7"
          />
        </svg>
      </button>
    </footer>
  );
};

export default Footer;
