import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");
  const [stats, setStats] = useState({
    balance: "₱ 0.00",
    totalWeight: "0 kg",
    pendingPickups: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        // 1. Fetch User Info (Name)
        const userRes = await fetch("http://localhost:5000/auth/home", {
          method: "GET",
          headers: { token },
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserName(`${userData.first_name} ${userData.last_name}`);
        }

        // 2. Fetch Bookings (Activity & Stats)
        const bookingsRes = await fetch(
          "http://localhost:5000/bookings/my-bookings",
          {
            method: "GET",
            headers: { token },
          },
        );

        if (bookingsRes.ok) {
          const bookings = await bookingsRes.json();

          // --- CALCULATE STATS ---
          let totalEarnings = 0;
          let totalWeight = 0;
          let pendingCount = 0;

          const formattedTransactions = bookings.map((b) => {
            // Helper: Safe date parsing
            const dateObj = new Date(b.pickup_date);
            const dateStr = !isNaN(dateObj)
              ? dateObj.toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                })
              : "N/A";

            // Helper: Item Name & Weight
            let displayItem = "Mixed Scrap";
            let bookingWeight = 0;

            if (Array.isArray(b.items)) {
              // Calculate total weight for this booking
              bookingWeight = b.items.reduce(
                (acc, item) => acc + (Number(item.estimated_weight) || 0),
                0,
              );

              // Get display name
              const names = b.items.map((i) => i.material_name).filter(Boolean);
              if (names.length > 0)
                displayItem =
                  names[0] + (names.length > 1 ? ` +${names.length - 1}` : "");
            }

            // Update Global Stats
            // Assuming "Completed" means money earned and weight recycled
            const status = b.status || "Pending Approval";
            if (status === "Completed") {
              totalEarnings += Number(b.total_amount) || 0;
              totalWeight += bookingWeight;
            } else if (
              ["Pending Approval", "Scheduled", "In Progress"].includes(status)
            ) {
              pendingCount++;
            }

            return {
              id: b.id,
              dbId: b.id, // For navigation
              type: b.transaction_type || "Pickup", // "Sell" or "Buy" usually, mapping to UI
              item: displayItem,
              weight: `${bookingWeight} kg`,
              amount: b.total_amount
                ? `+ ₱${Number(b.total_amount).toLocaleString()}`
                : "Pending",
              date: dateStr,
              status: status,
              rawType: b.transaction_type, // For icon logic
            };
          });

          // Set State
          setStats({
            balance: `₱ ${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            totalWeight: `${totalWeight} kg`,
            pendingPickups: pendingCount,
          });

          setTransactions(formattedTransactions);
        }
      } catch (err) {
        console.error("Error fetching home data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
              {userName} <span className="text-[#F2C94C]">.</span>
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
      <div className="flex-grow flex flex-col max-w-7xl mx-auto w-full px-4 md:px-6 -mt-16 z-20 gap-4 mb-4">
        {/* STATS ROW */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 shrink-0">
          {[
            {
              label: "Earnings",
              val: stats.balance,
              icon: "text-yellow-600 bg-yellow-50",
              path: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
            },
            {
              label: "Recycled",
              val: stats.totalWeight,
              icon: "text-emerald-600 bg-emerald-50",
              path: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
            },
            {
              label: "Pending",
              val: stats.pendingPickups,
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
                {loading ? (
                  <tr>
                    <td
                      colSpan="3"
                      className="px-6 py-8 text-center text-xs text-slate-400"
                    >
                      Loading activity...
                    </td>
                  </tr>
                ) : transactions.length > 0 ? (
                  transactions.slice(0, 7).map((t, index) => (
                    <tr
                      key={t.id}
                      onClick={() =>
                        navigate(`/auth/transaction-details/${t.dbId}`)
                      }
                      className={`hover:bg-slate-50 transition-colors group cursor-pointer ${index >= 4 ? "md:hidden" : ""}`}
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                              t.rawType === "Sell"
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-orange-100 text-orange-600"
                            }`}
                          >
                            {t.rawType === "Sell" ? (
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
                          t.amount.includes("Pending")
                            ? "text-slate-300 italic"
                            : "text-emerald-600"
                        }`}
                      >
                        {t.amount}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="3"
                      className="px-6 py-8 text-center text-xs text-slate-400"
                    >
                      No recent activity.
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

export default Home;
