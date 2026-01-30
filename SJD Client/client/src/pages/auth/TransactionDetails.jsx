import { useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const TransactionDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);

  // --- MOCK DATABASE FETCH ---
  useLayoutEffect(() => {
    const isBooking = id?.startsWith("BK");
    if (isBooking) {
      setData({
        table: "bookings",
        id: id || "BK-2026-020",
        type: "Sell",
        status: "Pending Approval",
        date: "Feb 28, 2026",
        pickup_address: "Power Plant, Sector 7, Industrial District, Zone 4",
        vehicle_type: "Truck (6-Wheeler)",
        estimated_weight: "Est. 500 kg",
        notes: "Requires crane for lifting. Gate pass needed.",
        material: {
          name: "Industrial Generators",
          category: "Heavy Equipment",
        },
      });
    } else {
      // --- GENERATE 20 LINE ITEMS ---
      const generatedItems = Array.from({ length: 20 }).map((_, i) => {
        const materials = [
          "Copper Wire",
          "Aluminum Sheet",
          "Scrap Iron",
          "Brass Fittings",
          "Steel Rebar",
        ];
        const material = materials[i % materials.length];
        const weight = (Math.random() * 100 + 10).toFixed(1);
        const price = (Math.random() * 300 + 20).toFixed(2);
        return {
          name: `${material} - Batch #${i + 101}`,
          weight: weight,
          price: price,
          subtotal: (weight * price).toFixed(2),
        };
      });

      const total = generatedItems.reduce(
        (acc, item) => acc + Number(item.subtotal),
        0,
      );

      setData({
        table: "transactions",
        id: id || "TRX-1045",
        type: "Sell",
        status: "Completed",
        date: "Jan 30, 2026",
        pickup_address: "Main Warehouse (Walk-in)",
        total_amount: total,
        payment_method: "Cash on Pickup",
        driver_name: "Michael Ray",
        truck_plate: "ABC-1234",
        notes: "Verified weight at scale 2. Material purity confirmed.",
        items: generatedItems,
      });
    }
  }, [id]);

  if (!data)
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        Loading...
      </div>
    );

  const isBooking = data.table === "bookings";

  const getStatusStyle = (status) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Pending Approval":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    // --- ROOT CONTAINER FIX ---
    // Mobile: overflow-y-auto (Allows this specific page to scroll within the App wrapper)
    // Desktop (lg): overflow-hidden (Locks the page so only the table scrolls internally)
    <div className="flex flex-col lg:flex-row h-full w-full bg-slate-50 font-sans text-slate-900 overflow-y-auto lg:overflow-hidden">
      {/* --- LEFT SIDEBAR --- */}
      {/* Mobile: Part of the vertical flow. Desktop: Fixed sidebar. */}
      <div className="w-full lg:w-[280px] shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col z-20 shadow-sm lg:shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors text-xs font-bold mb-4"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </button>
          <div className="flex justify-between items-start lg:block">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight break-all">
                {data.id}
              </h1>
              <span
                className={`inline-flex mt-2 items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide border ${getStatusStyle(data.status)}`}
              >
                {data.status}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Content */}
        {/* Mobile: Just a div. Desktop: Scrollable area. */}
        <div className="p-6 space-y-6 flex-1 lg:overflow-y-auto custom-scrollbar">
          {/* Amount Box */}
          <div className="bg-slate-900 rounded-xl p-5 text-white shadow-lg shadow-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Total Value
            </p>
            <p className="text-2xl font-black tracking-tight">
              {data.total_amount
                ? `₱${data.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "Pending"}
            </p>
          </div>

          {/* Meta Data */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Date
              </label>
              <p className="text-sm font-bold text-slate-700">{data.date}</p>
            </div>

            <div className="col-span-2 lg:col-span-1">
              {data.pickup_address && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Location / Address
                  </label>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed">
                    {data.pickup_address}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Type
              </label>
              <p className="text-sm font-bold text-slate-700">{data.type}</p>
            </div>

            {!isBooking && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Payment
                </label>
                <p className="text-sm font-bold text-slate-700">
                  {data.payment_method}
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          {data.notes && (
            <div className="pt-4 border-t border-slate-100 col-span-2 lg:col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Notes
              </label>
              <p className="text-xs text-slate-500 leading-relaxed italic">
                "{data.notes}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* --- RIGHT CONTENT AREA --- */}
      {/* Mobile: Flows naturally. Desktop: Fixed to full height, handles internal scroll. */}
      <div className="flex-1 flex flex-col bg-slate-50/50 p-4 lg:p-6 lg:h-full lg:overflow-hidden">
        {/* TABLE CONTAINER */}
        {/* Mobile: h-auto (grows with table). Desktop: h-full (fills space). */}
        <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-auto lg:h-full">
          {/* Table Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0 gap-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              {isBooking ? "Material Specs" : "Line Items"}
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px]">
                {isBooking ? 1 : data.items?.length}
              </span>
            </h3>

            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#F2C94C] hover:bg-[#eebc2d] text-slate-900 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95 w-full sm:w-auto group">
              <svg
                className="w-4 h-4 text-slate-900"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span className="text-xs font-bold">Export Data</span>
            </button>
          </div>

          {/* TABLE BODY WRAPPER */}
          {/* Mobile: overflow-x-auto (horizontal scroll only), vertical expands. */}
          {/* Desktop: overflow-y-auto (internal vertical scroll). */}
          <div className="flex-1 overflow-x-auto lg:overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[600px] lg:min-w-0">
              <thead className="bg-slate-50/95 sticky top-0 z-10 backdrop-blur-sm border-b border-slate-200 shadow-sm">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Item Description
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                    Weight
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                    {isBooking ? "Category" : "Rate"}
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                    {isBooking ? "Est. Total" : "Subtotal"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isBooking ? (
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm text-slate-900">
                      {data.material?.name}
                    </td>
                    <td className="px-6 py-4 font-medium text-sm text-slate-600 text-right">
                      {data.estimated_weight}
                    </td>
                    <td className="px-6 py-4 font-medium text-sm text-slate-600 text-right">
                      {data.material?.category}
                    </td>
                    <td className="px-6 py-4 font-bold text-sm text-slate-400 text-right italic">
                      Pending Weigh-in
                    </td>
                  </tr>
                ) : (
                  data.items?.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="px-6 py-3 font-bold text-sm text-slate-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-3 font-medium text-sm text-slate-600 text-right font-mono">
                        {item.weight} kg
                      </td>
                      <td className="px-6 py-3 font-medium text-sm text-slate-600 text-right font-mono">
                        ₱{item.price}
                      </td>
                      <td className="px-6 py-3 font-bold text-sm text-slate-900 text-right font-mono">
                        ₱
                        {Number(item.subtotal).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center shrink-0 gap-3">
            <span className="text-xs font-bold text-slate-500">
              {isBooking
                ? "Awaiting Arrival"
                : `${data.items?.length} items recorded`}
            </span>
            {!isBooking && (
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-400 uppercase">
                  Grand Total
                </span>
                <span className="text-lg font-black text-slate-900">
                  ₱
                  {data.total_amount?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetails;
