import { Link, useNavigate } from "react-router-dom";

const SignIn = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full flex overflow-hidden relative bg-white">
      {/* --- BACK BUTTON --- */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-slate-600 hover:text-slate-900 lg:text-white/80 lg:hover:text-white transition-colors bg-white/80 lg:bg-black/20 hover:bg-white lg:hover:bg-black/40 px-4 py-2 rounded-full backdrop-blur-md shadow-sm lg:shadow-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm font-medium">Back to Home</span>
      </button>

      {/* COLUMN 1: LEFT SIDE (Dark Branding) - Hidden on Mobile */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 items-center justify-center relative shadow-2xl z-10">
        <div className="absolute inset-0 bg-[url('/large_bg.png')] opacity-10 bg-cover bg-center"></div>
        <img
          src="/seal.png"
          alt="South Junk Dealer Seal"
          className="relative z-10 w-2/3 max-w-md object-contain drop-shadow-2xl"
        />
      </div>

      {/* COLUMN 2: RIGHT SIDE (Form) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 h-full relative z-0">
        <div className="w-full max-w-md mx-auto flex flex-col justify-center h-full py-6">
          <div className="mb-8 lg:mb-10 text-center lg:text-left">
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-3 tracking-tight">
              Welcome Back!
            </h2>
            <p className="text-slate-500 text-base lg:text-lg">
              Enter your credentials to access your account.
            </p>
          </div>

          <form className="flex flex-col gap-5 lg:gap-6">
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-slate-700 text-sm ml-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="juan@example.com"
                className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F2C94C] focus:ring-4 focus:ring-[#F2C94C]/20 transition-all bg-slate-50 lg:bg-white shadow-sm"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-slate-700 text-sm ml-1">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F2C94C] focus:ring-4 focus:ring-[#F2C94C]/20 transition-all bg-slate-50 lg:bg-white shadow-sm"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex justify-between items-center text-sm text-slate-500 font-medium px-1">
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-700 transition-colors">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-[#F2C94C] rounded border-gray-300"
                />
                <span>Remember me</span>
              </label>
              <a
                href="#"
                className="hover:text-[#F2C94C] transition-colors font-semibold"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button className="mt-2 bg-[#F2C94C] hover:bg-yellow-400 text-slate-900 font-bold py-4 rounded-xl shadow-lg hover:shadow-yellow-400/30 transition-all transform hover:-translate-y-1 text-lg">
              Sign In
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 text-center text-sm lg:text-base text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-bold text-[#F2C94C] hover:text-yellow-600 hover:underline transition-all"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
