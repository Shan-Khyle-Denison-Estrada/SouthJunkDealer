import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Account = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    contactNumber: "",
    email: "",
    address: "",
    affiliation: "",
    profilePhoto: null, // Stores Base64 string
    password: "", // New password
    confirmPassword: "",
  });

  // 1. FETCH PROFILE ON LOAD
  const getUserProfile = async () => {
    try {
      const response = await fetch("http://localhost:5000/auth/account", {
        method: "GET",
        headers: { token: localStorage.getItem("token") },
      });

      if (response.ok) {
        const parseRes = await response.json();
        setFormData({
          firstName: parseRes.first_name,
          middleName: parseRes.middle_name || "",
          lastName: parseRes.last_name,
          contactNumber: parseRes.contact_number || "",
          email: parseRes.email,
          address: parseRes.address || "",
          affiliation: parseRes.affiliation || "",
          profilePhoto: parseRes.profile_photo || null,
          password: "",
          confirmPassword: "",
        });
      } else {
        console.error("Failed to load profile");
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    getUserProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- NEW: Handle Image Upload & Convert to Base64 ---
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, profilePhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 2. SAVE CHANGES
  const handleSave = async (e) => {
    e.preventDefault();

    // Password Validation
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const body = {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        contactNumber: formData.contactNumber,
        affiliation: formData.affiliation,
        address: formData.address,
        email: formData.email,
        profilePhoto: formData.profilePhoto, // Send Photo
        password: formData.password, // Send Password (empty if no change)
      };

      const response = await fetch("http://localhost:5000/auth/account", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          token: localStorage.getItem("token"),
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        alert("Profile Updated Successfully!");
        // Clear password fields after save for security
        setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      } else {
        alert("Error updating profile");
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure? This action cannot be undone.")) {
      localStorage.removeItem("token");
      navigate("/signin");
    }
  };

  return (
    <div className="h-full flex flex-col bg-white font-sans text-slate-900 overflow-hidden">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-slate-100 shrink-0 flex items-center justify-between gap-4 bg-white z-10">
        <div className="flex items-center gap-4">
          <Link
            to="/auth/home"
            className="h-9 w-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-[#F2C94C] hover:text-slate-900 transition-all border border-slate-100 hover:border-[#F2C94C]"
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
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
              Account Settings
            </h1>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">
              Update your personal details
            </p>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-grow flex flex-col overflow-hidden">
        <div className="flex-grow overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-5 content-start">
            {/* AVATAR (Restored Logic) */}
            <div className="md:col-span-2 md:row-span-2 flex flex-col items-center md:items-start pt-1">
              <label className="aspect-square w-32 md:w-full rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 hover:border-[#F2C94C] hover:bg-[#F2C94C]/5 transition-all cursor-pointer flex flex-col items-center justify-center group relative overflow-hidden">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                {formData.profilePhoto ? (
                  <img
                    src={formData.profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover absolute inset-0"
                  />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-slate-400 group-hover:text-[#F2C94C] transition-colors mb-2"
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

                {/* Overlay Text */}
                <div
                  className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity z-10 ${formData.profilePhoto ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}
                >
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wide ${formData.profilePhoto ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`}
                  >
                    Change Photo
                  </span>
                </div>
              </label>
            </div>

            {/* Names */}
            <div className="md:col-span-10 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-[#F2C94C] focus:ring-4 focus:ring-[#F2C94C]/10 text-slate-900 font-bold text-sm transition-all outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-[#F2C94C] focus:ring-4 focus:ring-[#F2C94C]/10 text-slate-900 font-bold text-sm transition-all outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-[#F2C94C] focus:ring-4 focus:ring-[#F2C94C]/10 text-slate-900 font-bold text-sm transition-all outline-none"
                />
              </div>
            </div>

            {/* Contact */}
            <div className="md:col-span-10 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-[#F2C94C] focus:ring-4 focus:ring-[#F2C94C]/10 text-slate-900 font-bold text-sm transition-all outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-[#F2C94C] focus:ring-4 focus:ring-[#F2C94C]/10 text-slate-900 font-bold text-sm transition-all outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                  Affiliation / Company
                </label>
                <input
                  type="text"
                  name="affiliation"
                  value={formData.affiliation}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-[#F2C94C] focus:ring-4 focus:ring-[#F2C94C]/10 text-slate-900 font-bold text-sm transition-all outline-none"
                />
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-12 space-y-1 mt-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                Complete Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-[#F2C94C] focus:ring-4 focus:ring-[#F2C94C]/10 text-slate-900 font-bold text-sm transition-all outline-none"
              />
            </div>

            {/* Security */}
            <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100 mt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                  New Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Leave empty to keep current"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-[#F2C94C] focus:ring-4 focus:ring-[#F2C94C]/10 text-slate-900 font-bold text-sm transition-all outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-[#F2C94C] focus:ring-4 focus:ring-[#F2C94C]/10 text-slate-900 font-bold text-sm transition-all outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-white border-t border-slate-100 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3 w-full md:w-auto p-3 bg-red-50 rounded-xl border border-red-100">
            {/* Delete button logic ... (unchanged) */}
            <div className="p-2 bg-white rounded-lg text-red-500 shadow-sm shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <div className="flex-grow">
              <p className="text-[10px] font-bold text-red-800 uppercase tracking-wider">
                Danger Zone
              </p>
              <p className="text-[10px] text-red-600/80">Irreversible action</p>
            </div>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
              Delete
            </button>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => navigate("/auth/home")}
              className="flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 transition-all uppercase tracking-wide"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 md:flex-none px-8 py-3 rounded-xl text-xs font-black bg-[#F2C94C] text-slate-900 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 hover:bg-[#e0b83e] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
