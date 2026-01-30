import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [photoPreview, setPhotoPreview] = useState(null);

  // 1. State for form inputs (Added affiliation)
  const [inputs, setInputs] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    address: "",
    affiliation: "", // <--- Added here
    contactNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const {
    firstName,
    middleName,
    lastName,
    address,
    affiliation, // <--- Destructured here
    contactNumber,
    email,
    password,
    confirmPassword,
  } = inputs;

  // 2. Handle text changes
  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  // 3. Handle image preview
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // 4. Handle Form Submit
  const onSubmitForm = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      // Added affiliation to the body sent to backend
      const body = {
        firstName,
        middleName,
        lastName,
        address,
        affiliation,
        contactNumber,
        email,
        password,
      };

      const response = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const parseRes = await response.json();

      if (response.ok) {
        localStorage.setItem("token", parseRes.token);
        alert("Registration Successful!");
        navigate("/auth/home");
      } else {
        alert(parseRes);
      }
    } catch (err) {
      console.error(err.message);
      alert("Server Error");
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-white relative">
      {/* --- BACK BUTTON --- */}
      <button
        onClick={() => navigate("/")}
        type="button"
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

      {/* LEFT SIDE */}
      <div className="hidden lg:flex w-5/12 bg-slate-900 flex-col items-center justify-center relative p-10 shadow-2xl z-10">
        <div className="absolute inset-0 bg-[url('/large_bg.png')] opacity-10 bg-cover bg-center"></div>
        <img
          src="/seal.png"
          alt="South Junk Dealer Seal"
          className="relative z-10 w-2/3 max-w-sm object-contain drop-shadow-2xl mb-8"
        />
        <h2 className="relative z-10 text-white text-3xl font-bold text-center">
          Join the Revolution
        </h2>
        <p className="relative z-10 text-slate-400 text-center mt-4 max-w-xs text-sm leading-relaxed">
          Create an account to start trading scrap materials securely and
          efficiently.
        </p>
      </div>

      {/* RIGHT SIDE (Form) */}
      <div className="w-full lg:w-7/12 h-full flex flex-col items-center justify-start lg:justify-center p-6 pt-20 lg:p-0 z-0 overflow-y-auto lg:overflow-visible">
        <div className="w-full max-w-xl flex flex-col justify-center">
          <div className="mb-6 flex flex-col items-center text-center gap-4">
            <div>
              <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                Create Account
              </h2>
              <p className="text-slate-500 text-sm mt-1 font-medium">
                Join us today.
              </p>
            </div>

            {/* UPLOAD BUTTON */}
            <label className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer shadow-xl group bg-white border-4 border-white hover:border-[#F2C94C]/30 transition-all flex items-end justify-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <div className="w-full h-full flex items-center justify-center bg-slate-100">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-32 w-32 text-slate-300 translate-y-4"
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
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                <span className="text-white text-[10px] font-bold uppercase text-center leading-tight">
                  Upload
                  <br />
                  Profile
                </span>
              </div>
            </label>
          </div>

          {/* FORM */}
          <form
            className="flex flex-col gap-4 pb-8 lg:pb-0"
            onSubmit={onSubmitForm}
          >
            {/* NAMES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wide ml-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={firstName}
                  onChange={handleChange}
                  required
                  className="w-full p-3 lg:p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F2C94C] focus:ring-2 focus:ring-[#F2C94C]/20 bg-slate-50 lg:bg-white text-sm transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wide ml-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middleName"
                  value={middleName}
                  onChange={handleChange}
                  className="w-full p-3 lg:p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F2C94C] focus:ring-2 focus:ring-[#F2C94C]/20 bg-slate-50 lg:bg-white text-sm transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wide ml-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={lastName}
                  onChange={handleChange}
                  required
                  className="w-full p-3 lg:p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F2C94C] focus:ring-2 focus:ring-[#F2C94C]/20 bg-slate-50 lg:bg-white text-sm transition-all"
                />
              </div>
            </div>

            {/* ADDRESS & AFFILIATION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wide ml-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={address}
                  onChange={handleChange}
                  placeholder="Barangay, City"
                  className="w-full p-3 lg:p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F2C94C] focus:ring-2 focus:ring-[#F2C94C]/20 bg-slate-50 lg:bg-white text-sm transition-all"
                />
              </div>
              {/* NEW AFFILIATION INPUT */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wide ml-1">
                  Affiliation / Company
                </label>
                <input
                  type="text"
                  name="affiliation"
                  value={affiliation}
                  onChange={handleChange}
                  placeholder="e.g. South Junk Shop"
                  className="w-full p-3 lg:p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F2C94C] focus:ring-2 focus:ring-[#F2C94C]/20 bg-slate-50 lg:bg-white text-sm transition-all"
                />
              </div>
            </div>

            {/* CONTACTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wide ml-1">
                  Phone
                </label>
                <input
                  type="text"
                  name="contactNumber"
                  value={contactNumber}
                  onChange={handleChange}
                  className="w-full p-3 lg:p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F2C94C] focus:ring-2 focus:ring-[#F2C94C]/20 bg-slate-50 lg:bg-white text-sm transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wide ml-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  required
                  className="w-full p-3 lg:p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F2C94C] focus:ring-2 focus:ring-[#F2C94C]/20 bg-slate-50 lg:bg-white text-sm transition-all"
                />
              </div>
            </div>

            {/* PASSWORDS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wide ml-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={handleChange}
                  required
                  className="w-full p-3 lg:p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F2C94C] focus:ring-2 focus:ring-[#F2C94C]/20 bg-slate-50 lg:bg-white text-sm transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wide ml-1">
                  Confirm
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full p-3 lg:p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F2C94C] focus:ring-2 focus:ring-[#F2C94C]/20 bg-slate-50 lg:bg-white text-sm transition-all"
                />
              </div>
            </div>

            {/* SUBMIT */}
            <button className="mt-4 bg-[#F2C94C] hover:bg-yellow-400 text-slate-900 font-bold py-3 rounded-xl shadow-lg hover:shadow-yellow-400/30 transition-all transform hover:-translate-y-0.5 text-base">
              Create Account
            </button>

            <div className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                to="/auth/signin"
                className="font-bold text-[#F2C94C] hover:text-yellow-600 hover:underline transition-all"
              >
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
