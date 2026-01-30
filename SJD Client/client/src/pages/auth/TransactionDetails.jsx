import { useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const TransactionDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);

  // --- MOCK DATABASE FETCH ---
  useLayoutEffect(() => {
    // Determine if it is a Booking (BK) or Transaction (TRX) based on ID prefix
    const isBooking = id?.startsWith("BK");

    if (isBooking) {
      // --- BOOKING PHASE MOCK DATA ---
      setData({
        table: "bookings",
        id: id,
        type: "Sell",
        status: "Pending Approval",
        date: "Feb 28, 2026",
        pickup_address: "Power Plant, Sector 7, Industrial District, Zone 4",
        vehicle_type: "Truck (6-Wheeler)",
        estimated_weight: "Est. 500 kg",
        notes: "Requires crane for lifting. Gate pass needed.",
        // Bookings usually have 1 main material category
        material: {
          name: "Industrial Generators",
          category: "Heavy Equipment",
        },
        items: [], // Bookings might not have broken down line items yet
      });
    } else {
      // --- COMPLETED TRANSACTION MOCK DATA ---
      // Generate 15 Line Items to demonstrate scrolling
      const generatedItems = Array.from({ length: 15 }).map((_, i) => {
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
        pickup_address: "Main Warehouse (Walk-in)", // Transactions often happen at the yard
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

  // --- STYLES ---
  const getStatusStyle = (status) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Pending Approval":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "In Progress":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    // ROOT LAYOUT:
    // 1. h-full: Fits parent container exactly.
    // 2. overflow-y-auto (Mobile): Allows THIS page to scroll vertically.
    // 3. md:overflow-hidden (Desktop): Locks page scroll, enables internal panel scroll.
    <div className="flex flex-col h-full w-full bg-slate-50 font-sans text-slate-900 overflow-y-auto md:overflow-hidden">
      {/* --- PAGE HEADER --- */}
      <div className="shrink-0 px-4 md:px-6 py-3 border-b border-slate-100 flex items-center justify-between gap-4 bg-white sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
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
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">
              {data.id}
            </h1>
            <p className="text-slate-500 text-[10px] mt-0.5 font-medium">
              {isBooking ? "Booking Request" : "Official Transaction"}
            </p>
          </div>
        </div>
        <div>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide border ${getStatusStyle(data.status)}`}
          >
            {data.status}
          </span>
        </div>
      </div>

      {/* --- CONTENT LAYOUT --- */}
      <div className="flex-1 flex flex-col md:flex-row md:min-h-0">
        {/* --- LEFT: SIDEBAR (Context) --- */}
        {/* Mobile: Part of flow. Desktop: Fixed width, internal scroll. */}
        <div className="w-full md:w-[350px] shrink-0 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col z-10 md:h-full md:overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-6">
            {/* Amount Box */}
            <div className="bg-slate-900 rounded-xl p-5 text-white shadow-lg shadow-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Total Value
              </p>
              <p className="text-3xl font-black tracking-tight">
                {data.total_amount
                  ? `₱${data.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : "Pending"}
              </p>
            </div>

            {/* Meta Data Grid */}
            <div className="grid grid-cols-2 md:grid-cols-1 gap-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Date
                </label>
                <p className="text-sm font-bold text-slate-700">{data.date}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Type
                </label>
                <p className="text-sm font-bold text-slate-700">{data.type}</p>
              </div>

              {data.pickup_address && (
                <div className="col-span-2 md:col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Location / Address
                  </label>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed">
                    {data.pickup_address}
                  </p>
                </div>
              )}

              <div className="col-span-2 md:col-span-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Vehicle Info
                </label>
                <p className="text-sm font-bold text-slate-700">
                  {data.vehicle_type || data.truck_plate || "N/A"}
                </p>
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
              <div className="pt-4 border-t border-slate-100">
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

        {/* --- RIGHT: TABLE CONTENT --- */}
        {/* Mobile: Part of flow. Desktop: Fills space, internal scroll. */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 md:h-full md:overflow-hidden">
          {/* TABLE CONTAINER */}
          <div className="flex-1 p-4 flex flex-col md:min-h-0">
            {/* Table Card: min-h-[400px] on mobile to ensure visibility */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 min-h-[400px] md:min-h-0 md:overflow-hidden">
              {/* HEADER */}
              <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-white shrink-0 gap-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  {isBooking ? "Material Specs" : "Line Items"}
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px]">
                    {isBooking ? 1 : data.items?.length}
                  </span>
                </h3>

                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#F2C94C] hover:bg-[#eebc2d] text-slate-900 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95 w-full sm:w-auto">
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

              {/* TABLE BODY (Internal Scroll) */}
              <div className="flex-1 overflow-x-auto md:overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
                  <thead className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                    <tr className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                      <th className="px-6 py-3 bg-white">Item Description</th>
                      <th className="px-6 py-3 bg-white text-right">Weight</th>
                      <th className="px-6 py-3 bg-white text-right">
                        {isBooking ? "Category" : "Rate"}
                      </th>
                      <th className="px-6 py-3 bg-white text-right">
                        {isBooking ? "Est. Total" : "Subtotal"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {isBooking ? (
                      // BOOKING ROW (Pending State)
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
                      // TRANSACTION ROWS (Completed State)
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

              {/* FOOTER */}
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
      </div>
    </div>
  );
};

export default TransactionDetails;
