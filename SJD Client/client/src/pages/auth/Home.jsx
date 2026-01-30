import { Link } from "react-router-dom";

const Home = () => {
  const user = {
    name: "Juan Dela Cruz",
    balance: "₱ 4,250.00",
    totalWeight: "124 kg",
    pendingPickups: 1,
  };

  const transactions = [
    {
      id: 1,
      type: "Sold",
      item: "Mixed Copper",
      weight: "5.2 kg",
      amount: "+ ₱1,976",
      date: "Oct 24",
      status: "Completed",
    },
    {
      id: 2,
      type: "Sold",
      item: "Aluminum Cans",
      weight: "12 kg",
      amount: "+ ₱780",
      date: "Oct 20",
      status: "Completed",
    },
    {
      id: 3,
      type: "Pickup",
      item: "Scheduled Pickup",
      weight: "---",
      amount: "Pending",
      date: "Oct 28",
      status: "In Progress",
    },
    {
      id: 4,
      type: "Sold",
      item: "Old Electronics",
      weight: "3.5 kg",
      amount: "+ ₱1,450",
      date: "Oct 15",
      status: "Completed",
    },
    {
      id: 5,
      type: "Sold",
      item: "Brass",
      weight: "2 kg",
      amount: "+ ₱420",
      date: "Oct 10",
      status: "Completed",
    },
    {
      id: 6,
      type: "Sold",
      item: "Cardboard",
      weight: "15 kg",
      amount: "+ ₱60",
      date: "Oct 08",
      status: "Completed",
    },
    {
      id: 7,
      type: "Sold",
      item: "Copper Wire",
      weight: "8 kg",
      amount: "+ ₱3,040",
      date: "Oct 05",
      status: "Completed",
    },
    {
      id: 8,
      type: "Pickup",
      item: "Large Pickup",
      weight: "---",
      amount: "Cancelled",
      date: "Oct 01",
      status: "Cancelled",
    },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-50 font-sans">
      {/* --- SECTION 1: HEADER --- */}
      <div className="bg-slate-900 text-white px-6 pt-6 pb-24 shadow-md shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        <div className="absolute inset-0 bg-[url('/large_bg.png')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>

        <div className="relative z-10 max-w-7xl mx-auto w-full flex justify-between items-stretch">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              Welcome Back
            </p>
            <h1 className="text-3xl font-black tracking-tight text-white">
              {user.name} <span className="text-[#F2C94C]">.</span>
            </h1>
          </div>

          <Link
            to="/auth/bookings"
            className="group bg-[#F2C94C] hover:bg-yellow-400 text-slate-900 font-bold px-4 md:px-5 rounded-xl text-sm shadow-lg shadow-yellow-500/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <div className="bg-slate-900/10 p-1 rounded-full group-hover:bg-slate-900/20 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
              </svg>
            </div>
            <span className="hidden md:inline">Book Pickup</span>
          </Link>
        </div>
      </div>

      {/* --- SECTION 2: CONTENT AREA --- */}
      {/* FIX: Removed 'overflow-hidden' here to prevent the bottom shadow from being cropped */}
      <div className="flex-grow flex flex-col max-w-7xl mx-auto w-full px-4 md:px-6 -mt-16 z-20 gap-4 mb-4">
        {/* STATS ROW */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 shrink-0">
          {[
            {
              label: "Earnings",
              val: user.balance.replace("₱ ", "₱"),
              icon: "text-yellow-600 bg-yellow-50",
              path: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
            },
            {
              label: "Recycled",
              val: user.totalWeight,
              icon: "text-emerald-600 bg-emerald-50",
              path: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
            },
            {
              label: "Pending",
              val: user.pendingPickups,
              icon: "text-blue-600 bg-blue-50",
              path: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white p-3 md:p-5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center md:justify-between justify-center gap-1 md:gap-0"
            >
              <div
                className={`h-8 w-8 md:h-12 md:w-12 rounded-xl flex items-center justify-center ${stat.icon} mb-1 md:mb-0 md:order-last`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 md:h-6 md:w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={stat.path}
                  />
                </svg>
              </div>

              <div className="text-center md:text-left">
                <p className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-wider">
                  {stat.label}
                </p>
                <h3 className="text-sm md:text-2xl font-black text-slate-900 leading-tight">
                  {stat.val}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* TRANSACTIONS TABLE */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col flex-grow overflow-hidden mt-0 md:mt-2">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F2C94C]"></span>
              Recent Activity
            </h3>
            <Link
              to="/auth/transactions"
              className="text-xs font-bold text-slate-400 hover:text-[#F2C94C] transition-colors"
            >
              View Full History &rarr;
            </Link>
          </div>

          <div className="overflow-auto flex-grow p-0">
            <table className="w-full h-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/50 text-slate-400 uppercase font-bold text-[10px] tracking-wider sticky top-0 z-10 backdrop-blur-sm h-10">
                <tr>
                  <th className="px-6 font-bold">Transaction</th>
                  <th className="px-6 font-bold">Date</th>
                  <th className="px-6 text-right font-bold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {/* FIX: Changed condition to index >= 4 to hide the 5th row on desktop */}
                {transactions.slice(0, 7).map((t, index) => (
                  <tr
                    key={t.id}
                    className={`hover:bg-slate-50 transition-colors group cursor-default ${index >= 4 ? "md:hidden" : ""}`}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                            t.type === "Sold"
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-orange-100 text-orange-600"
                          }`}
                        >
                          {t.type === "Sold" ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L9 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm group-hover:text-[#d6ae36] transition-colors">
                            {t.item}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                            {t.type} • {t.weight}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-500 text-xs">
                      {t.date}
                    </td>
                    <td
                      className={`px-6 py-3.5 text-right font-bold text-sm ${
                        t.amount === "Pending"
                          ? "text-slate-300 italic"
                          : "text-emerald-600"
                      }`}
                    >
                      {t.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
