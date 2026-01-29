import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Bookings = () => {
  const navigate = useNavigate();

  // 1. Form State
  const [formData, setFormData] = useState({
    type: "Pickup",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "Cash",
    clientName: "Juan Dela Cruz",
    clientAffiliation: "South Scrappers Co.",
    clientContact: "0917-123-4567",
    clientEmail: "juan@example.com",
    clientAddress: "123 Mabini St, Cagayan de Oro",
    status: "Draft",
  });

  // 2. Line Items State
  const [lineItems, setLineItems] = useState([
    { id: 1, material: "Mixed Copper", weight: 5, price: 380 },
    { id: 2, material: "Aluminum Cans", weight: 10, price: 65 },
  ]);

  // Mock Materials Data
  const materials = [
    { name: "Mixed Copper", price: 380 },
    { name: "Aluminum Cans", price: 65 },
    { name: "Brass", price: 210 },
    { name: "Cardboard", price: 4 },
    { name: "Copper Wire", price: 420 },
    { name: "Steel Scraps", price: 18 },
  ];

  // --- Handlers ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateLineItem = (id, field, value) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "material") {
            const mat = materials.find((m) => m.name === value);
            updated.price = mat ? mat.price : 0;
          }
          return updated;
        }
        return item;
      }),
    );
  };

  const addLineItem = () => {
    const newId =
      lineItems.length > 0 ? Math.max(...lineItems.map((i) => i.id)) + 1 : 1;
    setLineItems([
      ...lineItems,
      { id: newId, material: "Mixed Copper", weight: 0, price: 380 },
    ]);
  };

  const removeLineItem = (id) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting:", { ...formData, items: lineItems });
    navigate("/transactions");
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 font-sans">
      {/* --- HEADER --- */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 shrink-0 flex items-center justify-between gap-4 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-[#F2C94C] hover:text-slate-900 transition-all border border-slate-200 hover:border-[#F2C94C]"
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
              New Booking
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Create transaction record
            </p>
          </div>
        </div>

        {/* Main Actions moved to Header for easier access */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="hidden md:block px-5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 border border-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 rounded-xl text-xs font-bold bg-[#F2C94C] text-slate-900 hover:bg-[#e0b83e] shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <span>Confirm</span>
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

      {/* --- MAIN CONTENT: COLUMN LAYOUT --- */}
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden p-4 md:p-6 gap-6 min-h-0">
        {/* --- LEFT COLUMN: DETAILS FORM --- */}
        <div className="w-full md:w-[24rem] lg:w-[26rem] shrink-0 flex flex-col gap-6 overflow-y-auto pr-1">
          {/* Card 1: Transaction Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
              Transaction Details
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">
                  Transaction Type
                </label>
                <div className="flex bg-slate-100 rounded-xl p-1">
                  {["Pickup", "Sold"].map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setFormData({ ...formData, type })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        formData.type === type
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:border-[#F2C94C] focus:ring-1 focus:ring-[#F2C94C] bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Client Info (Expanded) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
              Client Information
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">
                  Full Name
                </label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#F2C94C] bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">
                  Affiliation / Company
                </label>
                <input
                  type="text"
                  name="clientAffiliation"
                  value={formData.clientAffiliation}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#F2C94C] bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">
                    Contact No.
                  </label>
                  <input
                    type="text"
                    name="clientContact"
                    value={formData.clientContact}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#F2C94C] bg-slate-50 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">
                    Email
                  </label>
                  <input
                    type="email"
                    name="clientEmail"
                    value={formData.clientEmail}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#F2C94C] bg-slate-50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">
                  Address
                </label>
                <textarea
                  name="clientAddress"
                  value={formData.clientAddress}
                  onChange={handleFormChange}
                  rows="3"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#F2C94C] bg-slate-50 focus:bg-white transition-all resize-none"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: LINE ITEMS TABLE --- */}
        <div className="flex-grow flex flex-col min-w-0 bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Line Items</h3>
              <p className="text-xs text-slate-500 font-medium">
                Manage materials for this transaction
              </p>
            </div>
            <button
              type="button"
              onClick={addLineItem}
              className="text-xs font-bold bg-slate-900 text-[#F2C94C] px-4 py-2 rounded-xl hover:bg-black hover:shadow-lg transition-all flex items-center gap-2"
            >
              <span className="text-sm leading-none">+</span>
              <span>Add Item</span>
            </button>
          </div>

          {/* Scrollable Table Area */}
          <div className="flex-grow overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 w-5/12">Material</th>
                  <th className="px-4 py-3 w-1/4">Weight (kg)</th>
                  <th className="px-4 py-3 w-1/4">Price / kg</th>
                  <th className="px-4 py-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lineItems.map((item) => (
                  <tr
                    key={item.id}
                    className="group hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <div className="relative">
                        <select
                          value={item.material}
                          onChange={(e) =>
                            updateLineItem(item.id, "material", e.target.value)
                          }
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 text-sm focus:border-[#F2C94C] focus:ring-1 focus:ring-[#F2C94C] appearance-none cursor-pointer hover:border-slate-300 transition-all shadow-sm"
                        >
                          {materials.map((m) => (
                            <option key={m.name} value={m.name}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-3 pointer-events-none">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-slate-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <input
                          type="number"
                          value={item.weight}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              "weight",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-full p-2.5 pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-[#F2C94C] focus:ring-1 focus:ring-[#F2C94C] shadow-sm transition-all"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                          kg
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-sm font-medium text-slate-500">
                        ₱ {item.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Remove Item"
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

                {/* Empty State */}
                {lineItems.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-300">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 mb-3 opacity-50"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <p className="text-sm font-bold">
                          No items in this transaction
                        </p>
                        <p className="text-xs">Click "Add Item" to start</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bookings;
