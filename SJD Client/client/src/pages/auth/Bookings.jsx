import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Bookings = () => {
  const navigate = useNavigate();

  // Mode: "buy" or "sell"
  const [transactionType, setTransactionType] = useState("sell");

  // Form State
  const [formData, setFormData] = useState({
    firstName: "Juan",
    lastName: "Dela Cruz",
    affiliation: "South Scrappers Co.",
    contactNumber: "0917-123-4567",
    email: "juan@southscrappers.com",
    clientAddress: "123 Mabini St, Barangay 40, Cagayan de Oro City",
    pickupAddress: "123 Mabini St, Barangay 40, Cagayan de Oro City",
    date: new Date().toISOString().split("T")[0],
  });

  // Line Items State
  const [lineItems, setLineItems] = useState([
    { id: 1, material: "Mixed Copper", weight: 5, price: 380 },
    { id: 2, material: "Aluminum Cans", weight: 12, price: 65 },
    { id: 3, material: "Steel", weight: 50, price: 18 },
    { id: 4, material: "Brass", weight: 8, price: 210 },
    { id: 5, material: "Cardboard", weight: 20, price: 4 },
    { id: 6, material: "Copper Wire", weight: 3, price: 420 },
    { id: 7, material: "Mixed Copper", weight: 5, price: 380 },
    { id: 8, material: "Aluminum Cans", weight: 12, price: 65 },
    { id: 9, material: "Steel", weight: 50, price: 18 },
    { id: 10, material: "Brass", weight: 8, price: 210 },
    { id: 11, material: "Cardboard", weight: 20, price: 4 },
    { id: 12, material: "Copper Wire", weight: 3, price: 420 },
  ]);

  const materials = [
    { name: "Mixed Copper", price: 380 },
    { name: "Aluminum Cans", price: 65 },
    { name: "Brass", price: 210 },
    { name: "Cardboard", price: 4 },
    { name: "Copper Wire", price: 420 },
    { name: "Steel", price: 18 },
  ];

  const handleAddItem = () => {
    const newItem = {
      id: Date.now(),
      material: materials[0].name,
      weight: 0,
      price: materials[0].price,
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateItem = (id, field, value) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (field === "material") {
            const mat = materials.find((m) => m.name === value);
            return { ...item, material: value, price: mat ? mat.price : 0 };
          }
          return { ...item, [field]: value };
        }
        return item;
      }),
    );
  };

  const removeItem = (id) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log("Saving Booking:", {
      type: transactionType,
      ...formData,
      items: transactionType === "buy" ? lineItems : "Photo Uploads",
    });
    navigate("/");
  };

  return (
    // FIX APPLIED:
    // 1. Changed `fixed inset-0` back to `relative w-full` to respect the Auth Header (it will sit below it).
    // 2. Used `h-[calc(100dvh-64px)]`. This assumes your Auth Header is roughly 64px tall.
    //    It ensures the container fits the REMAINING screen space so internal scrolling works.
    <div className="relative w-full h-[calc(100dvh-64px)] flex flex-col bg-white font-sans text-slate-900 overflow-hidden">
      {/* --- HEADER (Fixed Height) --- */}
      <div className="shrink-0 px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-white z-20">
        <div className="flex items-center gap-3 md:gap-4">
          <Link
            to="/auth/home"
            className="h-8 w-8 md:h-9 md:w-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-[#F2C94C] hover:text-slate-900 transition-all border border-slate-100 hover:border-[#F2C94C]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 md:h-5 md:w-5"
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
            <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight leading-none">
              New Transaction
            </h1>
            <p className="text-slate-500 text-[10px] md:text-xs mt-0.5 font-medium">
              Request buy or sell
            </p>
          </div>
        </div>

        <div className="flex gap-2 md:gap-3">
          <button
            onClick={() => navigate("/auth/home")}
            className="hidden md:block px-5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 transition-all uppercase tracking-wide"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 md:px-6 py-2 rounded-xl text-xs font-black bg-[#F2C94C] text-slate-900 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 hover:bg-[#e0b83e] hover:-translate-y-0.5 transition-all flex items-center gap-2 uppercase tracking-wide"
          >
            <span className="hidden md:inline">Confirm</span>
            <span className="md:hidden">Save</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* --- MAIN LAYOUT (Flex-1 takes remaining height) --- */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* --- LEFT SIDEBAR (Scrolls independently if needed) --- */}
        <div className="w-full md:w-[320px] lg:w-[360px] shrink-0 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50 flex flex-row md:flex-col items-center md:items-stretch p-4 md:p-6 gap-4 md:gap-0 z-10">
          <div className="shrink-0 flex md:flex-col items-center gap-3 md:mb-6">
            <div className="relative">
              <div className="w-12 h-12 md:w-24 md:h-24 rounded-full bg-white border-2 md:border-4 border-white shadow-sm flex items-center justify-center text-slate-300 overflow-hidden">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 md:h-14 md:w-14"
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
            </div>
            <div className="text-left md:text-center">
              <h2 className="text-sm md:text-xl font-black text-slate-900 leading-tight">
                {formData.firstName} {formData.lastName}
              </h2>
              <span className="inline-block mt-0.5 md:mt-2 px-2 py-0.5 md:px-3 md:py-1 bg-[#F2C94C]/10 text-slate-800 text-[9px] md:text-[10px] font-bold uppercase tracking-widest rounded-full border border-[#F2C94C]/20">
                {formData.affiliation}
              </span>
            </div>
          </div>

          <div className="hidden md:flex md:flex-col gap-4 md:w-full md:mt-2">
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Phone
                </p>
                <p className="text-sm font-bold text-slate-800 truncate">
                  {formData.contactNumber}
                </p>
              </div>
            </div>
            {/* ... other sidebar details ... */}
            <div className="flex gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm text-left">
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Registered Address
                </p>
                <p className="text-xs font-bold text-slate-800 leading-relaxed">
                  {formData.clientAddress}
                </p>
              </div>
            </div>
          </div>
          <div className="hidden md:block mt-auto pt-6 text-[10px] text-slate-400 font-medium">
            User ID: <span className="font-mono text-slate-500">CLI-8821</span>
          </div>
        </div>

        {/* --- RIGHT SIDE (Main Content) --- */}
        <div className="flex-1 flex flex-col min-w-0 bg-white relative h-full">
          {/* TOOLBAR (Fixed Height) */}
          <div className="shrink-0 px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 bg-white shadow-sm z-10">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center shadow-inner shrink-0 justify-center">
              <button
                onClick={() => setTransactionType("sell")}
                className={`flex-1 md:flex-none px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wide transition-all ${transactionType === "sell" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                Selling
              </button>
              <button
                onClick={() => setTransactionType("buy")}
                className={`flex-1 md:flex-none px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wide transition-all ${transactionType === "buy" ? "bg-[#F2C94C] text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                Buying
              </button>
            </div>
            <div className="flex-grow relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-slate-400 group-focus-within:text-[#F2C94C] transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                name="pickupAddress"
                value={formData.pickupAddress}
                onChange={handleChange}
                placeholder="Enter Pickup Address..."
                className="w-full pl-9 pr-2 md:pr-4 py-2 md:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-700 focus:bg-white focus:border-[#F2C94C] focus:ring-1 focus:ring-[#F2C94C] outline-none transition-all placeholder:font-normal placeholder:text-slate-400"
              />
            </div>
            <div className="shrink-0 relative">
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full md:w-auto pl-3 pr-2 py-2 md:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-700 focus:bg-white focus:border-[#F2C94C] outline-none transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* --- SCROLLABLE CONTENT AREA --- */}
          {/* This area expands to fill remaining space, but clamps its children. */}
          <div className="flex-1 min-h-0 relative flex flex-col bg-white">
            {transactionType === "buy" ? (
              // --- BUYING VIEW ---
              <div className="absolute inset-0 flex flex-col p-4 md:p-8">
                <div className="flex justify-between items-end mb-4 shrink-0">
                  <div>
                    <h3 className="text-base md:text-lg font-black text-slate-900">
                      Purchase Order
                    </h3>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wide">
                      List items client needs
                    </p>
                  </div>
                  <button
                    onClick={handleAddItem}
                    className="text-[10px] md:text-xs font-bold bg-slate-900 text-[#F2C94C] px-3 md:px-4 py-2 md:py-2.5 rounded-lg hover:bg-black hover:-translate-y-0.5 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10"
                  >
                    <span>+ Add Item</span>
                  </button>
                </div>

                {/* SCROLLING MAGIC: 
                   1. Parent has 'relative flex-1'
                   2. Child has 'absolute inset-0 overflow-auto'
                   This creates a sealed scrolling context that CANNOT grow the parent.
                */}
                <div className="flex-1 relative border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden">
                  <div className="absolute inset-0 overflow-auto">
                    <table className="w-full text-left min-w-[500px] border-collapse">
                      <thead className="bg-slate-50 text-[10px] md:text-xs text-slate-500 uppercase font-bold sticky top-0 z-20 shadow-sm ring-1 ring-slate-900/5">
                        <tr>
                          <th className="px-4 md:px-6 py-3 bg-slate-50">
                            Material
                          </th>
                          <th className="px-2 md:px-4 py-3 text-right bg-slate-50">
                            Qty (kg)
                          </th>
                          <th className="px-2 md:px-4 py-3 text-right bg-slate-50">
                            Price
                          </th>
                          <th className="px-4 py-3 text-right bg-slate-50">
                            Total
                          </th>
                          <th className="px-2 md:px-4 py-3 text-center bg-slate-50"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {lineItems.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/80 group"
                          >
                            <td className="px-4 md:px-6 py-2">
                              <select
                                value={item.material}
                                onChange={(e) =>
                                  updateItem(
                                    item.id,
                                    "material",
                                    e.target.value,
                                  )
                                }
                                className="w-full py-2 bg-transparent font-bold text-slate-700 text-xs md:text-sm outline-none cursor-pointer appearance-none"
                              >
                                {materials.map((m) => (
                                  <option key={m.name} value={m.name}>
                                    {m.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-2 md:px-4 py-2 text-right">
                              <input
                                type="number"
                                value={item.weight}
                                onChange={(e) =>
                                  updateItem(item.id, "weight", e.target.value)
                                }
                                className="w-16 md:w-24 text-right p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs md:text-sm outline-none focus:border-[#F2C94C] focus:bg-white transition-all"
                              />
                            </td>
                            <td className="px-2 md:px-4 py-2 text-right font-mono text-xs md:text-sm text-slate-500 pt-3">
                              ₱{item.price}
                            </td>
                            <td className="px-4 py-2 text-right font-black text-xs md:text-sm text-slate-800 pt-3">
                              ₱{(item.weight * item.price).toLocaleString()}
                            </td>
                            <td className="px-2 md:px-4 py-2 text-center">
                              <button
                                onClick={() => removeItem(item.id)}
                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
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
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              // --- SELLING VIEW ---
              <div className="absolute inset-0 flex flex-col p-4 md:p-8 overflow-y-auto">
                {/* ... (Photo upload UI) ... */}
                <div className="mb-4 shrink-0">
                  <h3 className="text-base md:text-lg font-black text-slate-900">
                    Upload Scrap Photos
                  </h3>
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Take pictures for evaluation
                  </p>
                </div>
                <div className="flex-grow min-h-[200px] border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50 hover:bg-slate-100 hover:border-[#F2C94C] transition-all flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden p-6 text-center">
                  <div className="h-20 w-20 md:h-24 md:w-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-5 group-hover:scale-110 group-hover:shadow-md transition-all z-10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 md:h-10 md:w-10 text-slate-400 group-hover:text-[#F2C94C] transition-colors"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h4 className="text-base md:text-lg font-black text-slate-700 group-hover:text-slate-900 transition-colors z-10">
                    Tap to Capture
                  </h4>
                  <p className="text-xs md:text-sm text-slate-400 mt-1 font-medium z-10">
                    Supports JPG, PNG (Max 5MB)
                  </p>
                </div>
                <div className="h-24 md:h-28 mt-4 md:mt-6 shrink-0 grid grid-cols-4 md:grid-cols-5 gap-3 md:gap-4 overflow-x-auto no-scrollbar">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="min-w-[80px] bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-slate-300 relative group cursor-pointer overflow-hidden"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 md:h-8 md:w-8 opacity-50"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  ))}
                  <div className="min-w-[80px] bg-white border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-300 hover:text-[#F2C94C] hover:border-[#F2C94C] cursor-pointer transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 md:h-8 md:w-8"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bookings;
