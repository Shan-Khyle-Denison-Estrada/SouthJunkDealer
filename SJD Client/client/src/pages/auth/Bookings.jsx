import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Bookings = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [transactionType, setTransactionType] = useState("sell");
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Added loading state

  // Logistics Data
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    address: "123 Mabini St, Barangay 40, Cagayan de Oro City",
    notes: "",
  });

  // Photo Uploads
  const [scrapPhotos, setScrapPhotos] = useState([]);

  // Line Items
  const [lineItems, setLineItems] = useState([
    { id: 1, material: "", estimatedWeight: "" },
    { id: 2, material: "", estimatedWeight: "" },
    { id: 3, material: "", estimatedWeight: "" },
  ]);

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScrapPhotos((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setScrapPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { id: Date.now(), material: "", estimatedWeight: "" },
    ]);
  };

  const updateLineItem = (id, field, value) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const removeLineItem = (id) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  // --- SUBMIT HANDLER (Updated for Backend Integration) ---
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Basic validation
      const validItems = lineItems.filter(
        (item) => item.material.trim() !== "",
      );
      if (validItems.length === 0) {
        alert("Please add at least one item with a material name.");
        setIsLoading(false);
        return;
      }

      // Prepare payload
      const body = {
        transactionType,
        ...formData,
        scrapPhotos,
        lineItems: validItems,
      };

      const response = await fetch("http://localhost:5000/auth/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: token,
        },
        body: JSON.stringify(body),
      });

      const parseRes = await response.json();

      if (response.ok) {
        alert("Booking Submitted Successfully!");
        navigate("/auth/transactions"); // Redirect to transactions list
      } else {
        alert(parseRes || "Failed to submit booking");
      }
    } catch (err) {
      console.error(err.message);
      alert("Server Error: Could not submit booking");
    } finally {
      setIsLoading(false);
    }
  };

  // --- TOGGLE COMPONENT ---
  const ToggleControl = ({ className = "" }) => (
    <div
      className={`flex bg-slate-200/50 p-1 rounded-full shadow-inner border border-slate-200 w-full max-w-sm ${className}`}
    >
      <button
        onClick={() => setTransactionType("sell")}
        className={`flex-1 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-300 ${
          transactionType === "sell"
            ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5 scale-100"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        I'm Selling
      </button>
      <button
        onClick={() => setTransactionType("buy")}
        className={`flex-1 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-300 ${
          transactionType === "buy"
            ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5 scale-100"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        I'm Buying
      </button>
    </div>
  );

  return (
    // ROOT CONTAINER
    <div className="flex flex-col h-full w-full bg-slate-50 font-sans text-slate-900 overflow-y-auto md:overflow-hidden">
      {/* --- PAGE HEADER --- */}
      <div className="shrink-0 px-4 md:px-6 py-3 border-b border-slate-100 flex items-center justify-between gap-4 bg-white sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            to="/auth/home"
            className="h-8 w-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-[#F2C94C] hover:text-slate-900 transition-all border border-slate-100 hover:border-[#F2C94C]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
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
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">
              New Booking
            </h1>
            <p className="text-slate-500 text-[10px] mt-0.5 font-medium">
              Request buy or sell
            </p>
          </div>
        </div>

        {/* NEW: Save Button in Header for Mobile */}
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="md:hidden px-4 py-2 bg-[#F2C94C] text-slate-900 text-xs font-bold uppercase rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
        >
          {isLoading ? "..." : "Save"}
        </button>
      </div>

      {/* --- CONTENT LAYOUT --- */}
      <div className="flex-1 flex flex-col md:flex-row md:min-h-0">
        {/* MOBILE TOGGLE (Scrolls with page) */}
        <div className="md:hidden shrink-0 p-4 pb-0 flex justify-center bg-slate-50 z-10">
          <ToggleControl />
        </div>

        {/* --- LEFT: LOGISTICS SIDEBAR --- */}
        <div className="w-full md:w-[350px] shrink-0 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col z-10 md:h-full md:overflow-y-auto custom-scrollbar">
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#F2C94C]"></span>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Logistics Details
              </h3>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                Scheduled Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#F2C94C] focus:ring-4 focus:ring-[#F2C94C]/10 text-slate-900 font-bold text-xs transition-all outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                {transactionType === "sell"
                  ? "Pickup Address"
                  : "Delivery Address"}
              </label>
              <textarea
                name="address"
                rows="2"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#F2C94C] focus:ring-4 focus:ring-[#F2C94C]/10 text-slate-900 font-medium text-xs transition-all outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                Notes / Instructions
              </label>
              <textarea
                name="notes"
                rows="2"
                placeholder="Gate code, landmark, etc..."
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#F2C94C] focus:ring-4 focus:ring-[#F2C94C]/10 text-slate-900 font-medium text-xs transition-all outline-none resize-none"
              />
            </div>

            {transactionType === "sell" && (
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-[#F2C94C]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Photos
                  </h3>
                  {scrapPhotos.length > 0 && (
                    <button
                      onClick={() => setIsPhotoModalOpen(true)}
                      className="text-[10px] font-bold text-[#F2C94C] hover:underline"
                    >
                      View ({scrapPhotos.length})
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {scrapPhotos.slice(0, 2).map((photo, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden border border-slate-200 relative group"
                    >
                      <img
                        src={photo}
                        alt="Scrap"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-lg bg-slate-50 border-2 border-dashed border-slate-300 hover:border-[#F2C94C] hover:bg-[#F2C94C]/5 cursor-pointer flex flex-col items-center justify-center transition-all group">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-slate-400 group-hover:text-[#F2C94C] transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- RIGHT: TABLE CONTENT --- */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 md:h-full md:overflow-hidden">
          {/* DESKTOP TOGGLE */}
          <div className="hidden md:flex shrink-0 p-4 pb-0 justify-center">
            <ToggleControl />
          </div>

          {/* TABLE CONTAINER */}
          <div className="flex-1 p-4 flex flex-col md:min-h-0">
            {/* Table Card */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-full md:overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-bold text-slate-800">Line Items</h3>
                  <p className="text-xs text-slate-500">
                    What materials are involved?
                  </p>
                </div>
                <button
                  onClick={addLineItem}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-[#F2C94C]/10 text-slate-600 hover:text-[#F2C94C] border border-slate-200 hover:border-[#F2C94C] rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Add Item
                </button>
              </div>

              {/* SCROLLABLE TABLE AREA */}
              <div className="overflow-y-auto flex-1 custom-scrollbar p-2">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider rounded-tl-lg">
                        Material
                      </th>
                      <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                        {transactionType === "sell"
                          ? "Est. Weight"
                          : "Quantity"}
                      </th>
                      <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-10 rounded-tr-lg">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lineItems.map((item) => (
                      <tr
                        key={item.id}
                        className="group hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="e.g. Copper Wire, Aluminum..."
                            value={item.material}
                            onChange={(e) =>
                              updateLineItem(
                                item.id,
                                "material",
                                e.target.value,
                              )
                            }
                            className="w-full p-2 bg-transparent border-b border-transparent focus:border-[#F2C94C] focus:bg-white text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-300"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="text"
                            placeholder="0"
                            value={item.estimatedWeight}
                            onChange={(e) =>
                              updateLineItem(
                                item.id,
                                "estimatedWeight",
                                e.target.value,
                              )
                            }
                            className="w-24 p-2 bg-transparent border-b border-transparent focus:border-[#F2C94C] focus:bg-white text-sm font-bold text-slate-900 text-right outline-none transition-all placeholder:text-slate-300 ml-auto block"
                          />
                        </td>
                        <td className="p-2 text-center">
                          {lineItems.length > 1 && (
                            <button
                              onClick={() => removeLineItem(item.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors p-1"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end shrink-0">
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-6 py-3 bg-[#F2C94C] hover:bg-[#E0B843] text-slate-900 text-sm font-bold uppercase tracking-wide rounded-xl shadow-lg shadow-[#F2C94C]/20 hover:shadow-xl hover:shadow-[#F2C94C]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    "Processing..."
                  ) : (
                    <>
                      Submit Booking
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- PHOTO MODAL --- */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-800">Photo Gallery</h3>
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-200 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-slate-500"
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
              </button>
            </div>
            <div className="p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-4">
              {scrapPhotos.map((photo, index) => (
                <div key={index} className="relative group aspect-square">
                  <img
                    src={photo}
                    alt="Detail"
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
