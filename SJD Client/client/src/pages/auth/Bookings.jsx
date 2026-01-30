import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Bookings = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [transactionType, setTransactionType] = useState("sell");
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Logistics Data
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    address: "123 Mabini St, Barangay 40, Cagayan de Oro City",
    notes: "",
  });

  // Photo Uploads (Base64 strings)
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

  const handleSave = () => {
    console.log("Submitting:", {
      type: transactionType,
      ...formData,
      items: lineItems,
      photos: scrapPhotos,
    });
    navigate("/auth/home");
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
    <div className="flex flex-col h-full w-full bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* --- PAGE HEADER --- */}
      <div className="shrink-0 px-4 md:px-6 py-3 border-b border-slate-100 flex items-center justify-between gap-4 bg-white z-20">
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
      </div>

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
        {/* MOBILE TOGGLE (Top) */}
        <div className="md:hidden shrink-0 p-4 pb-0 flex justify-center bg-slate-50 z-10">
          <ToggleControl />
        </div>

        {/* --- LEFT COLUMN: LOGISTICS --- */}
        <div className="w-full md:w-[350px] shrink-0 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col z-10 h-auto md:h-full md:overflow-y-auto">
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

        {/* --- RIGHT COLUMN: FLEX LAYOUT FOR INTERNAL SCROLLING --- */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 h-auto md:h-full overflow-hidden">
          {/* DESKTOP TOGGLE */}
          <div className="hidden md:flex shrink-0 p-4 pb-0 justify-center">
            <ToggleControl />
          </div>

          {/* TABLE CONTAINER - flex-1 and min-h-0 ensure it takes space but allows internal scrolling */}
          <div className="flex-1 p-4 md:p-4 min-h-0 flex flex-col">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
              {/* TABLE HEADER (Fixed) */}
              <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {transactionType === "sell"
                    ? "Items to Dispose"
                    : "Items to Purchase"}
                </h3>
                <button
                  onClick={addLineItem}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600 hover:text-[#F2C94C] hover:border-[#F2C94C] transition-all uppercase tracking-wide shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Add Item
                </button>
              </div>

              {/* SCROLLABLE TABLE BODY AREA */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                    <tr className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                      <th className="px-4 py-3 bg-white">Material</th>
                      <th className="px-4 py-3 w-24 md:w-32 bg-white">
                        {transactionType === "sell"
                          ? "Est. Weight"
                          : "Qty Needed"}
                      </th>
                      <th className="px-4 py-3 w-12 md:w-16 text-center bg-white"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {lineItems.map((item) => (
                      <tr
                        key={item.id}
                        className="group hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            placeholder={
                              transactionType === "sell"
                                ? "e.g. Mixed Copper"
                                : "e.g. Clean Aluminum"
                            }
                            value={item.material}
                            onChange={(e) =>
                              updateLineItem(
                                item.id,
                                "material",
                                e.target.value,
                              )
                            }
                            className="w-full h-10 px-3 rounded-lg bg-slate-50 border border-transparent focus:bg-white focus:border-[#F2C94C] focus:ring-2 focus:ring-[#F2C94C]/10 text-slate-900 font-bold text-sm transition-all outline-none"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="relative">
                            <input
                              type="number"
                              placeholder="0"
                              value={item.estimatedWeight}
                              onChange={(e) =>
                                updateLineItem(
                                  item.id,
                                  "estimatedWeight",
                                  e.target.value,
                                )
                              }
                              className="w-full h-10 pl-3 pr-8 rounded-lg bg-slate-50 border border-transparent focus:bg-white focus:border-[#F2C94C] focus:ring-2 focus:ring-[#F2C94C]/10 text-slate-900 font-bold text-sm transition-all outline-none"
                            />
                            <span className="absolute right-3 top-3 text-[10px] font-bold text-slate-400 pointer-events-none">
                              kg
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => removeLineItem(item.id)}
                            className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* BOTTOM BUTTONS (Fixed Footer) */}
          <div className="shrink-0 p-4 md:p-6 pt-2 bg-slate-50/50 backdrop-blur-sm border-t border-slate-200/50">
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/auth/home")}
                className="flex-1 py-3.5 rounded-xl text-xs font-bold text-slate-500 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all uppercase tracking-wide shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-[2] py-3.5 rounded-xl text-sm font-black bg-gradient-to-r from-[#F2C94C] to-[#F2994A] text-slate-900 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:to-[#f28e36] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 uppercase tracking-wide relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative">
                  Confirm {transactionType === "sell" ? "Sale" : "Purchase"}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-slate-900 relative"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL --- */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">
                Captured Photos ({scrapPhotos.length})
              </h3>
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="text-slate-400 hover:text-slate-900"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
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
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {scrapPhotos.map((photo, index) => (
                <div
                  key={index}
                  className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200"
                >
                  <img
                    src={photo}
                    alt="Scrap Full"
                    className="w-full h-full object-cover"
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
