import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("bookings");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ type: "All", status: "All" });

  // Ref to measure the available space for the table
  const tableContainerRef = useRef(null);

  // State for dynamic items per page
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // --- DYNAMIC HEIGHT CALCULATION ---
  useLayoutEffect(() => {
    const calculateItemsPerPage = () => {
      if (tableContainerRef.current) {
        // Get the full height of the scrollable container
        const containerHeight = tableContainerRef.current.clientHeight;

        // Estimate Header Height (approx 54px based on padding/font)
        const headerHeight = 54;

        // Estimate Row Height (approx 76px based on h-10 icon + py-4 padding + borders)
        const rowHeight = 76;

        // Calculate available height for rows
        const availableHeight = containerHeight - headerHeight;

        // Calculate how many full rows fit.
        // Math.floor ensures we don't include a row that would trigger a scrollbar.
        const calculatedItems = Math.floor(availableHeight / rowHeight);

        // Ensure at least 1 item is shown
        setItemsPerPage(Math.max(1, calculatedItems));
      }
    };

    // Calculate on mount
    calculateItemsPerPage();

    // Recalculate on window resize
    window.addEventListener("resize", calculateItemsPerPage);
    return () => window.removeEventListener("resize", calculateItemsPerPage);
  }, []);

  // --- MOCK DATA ---
  const allData = [
    // ACTIVE BOOKINGS
    {
      id: "BK-2026-020",
      date: "Feb 28, 2026",
      type: "Sell",
      item: "Industrial Generators",
      estWeight: "500 kg",
      address: "Power Plant, Sector 7",
      status: "Pending Approval",
      category: "bookings",
    },
    {
      id: "BK-2026-019",
      date: "Feb 27, 2026",
      type: "Buy",
      item: "Copper Pipes",
      estWeight: "45 kg",
      address: "Plumbing Warehouse",
      status: "In Progress",
      category: "bookings",
    },
    {
      id: "BK-2026-018",
      date: "Feb 26, 2026",
      type: "Sell",
      item: "Office Monitors (CRT)",
      estWeight: "120 kg",
      address: "IT Park, Bldg C",
      status: "Scheduled",
      category: "bookings",
    },
    {
      id: "BK-2026-017",
      date: "Feb 25, 2026",
      type: "Sell",
      item: "Mixed Aluminum Siding",
      estWeight: "30 kg",
      address: "Renovation Site 4",
      status: "Pending Approval",
      category: "bookings",
    },
    {
      id: "BK-2026-016",
      date: "Feb 24, 2026",
      type: "Buy",
      item: "Steel Rebar (Rusted)",
      estWeight: "250 kg",
      address: "Construction Yard",
      status: "Scheduled",
      category: "bookings",
    },
    {
      id: "BK-2026-015",
      date: "Feb 22, 2026",
      type: "Sell",
      item: "Old Server Racks",
      estWeight: "80 kg",
      address: "Data Center, Uptown",
      status: "Rejected",
      category: "bookings",
    },
    {
      id: "BK-2026-014",
      date: "Feb 20, 2026",
      type: "Buy",
      item: "Lead Acid Batteries",
      estWeight: "60 kg",
      address: "Auto Shop 2",
      status: "In Progress",
      category: "bookings",
    },
    {
      id: "BK-2026-013",
      date: "Feb 18, 2026",
      type: "Sell",
      item: "Brass Shells",
      estWeight: "5 kg",
      address: "Shooting Range",
      status: "Cancelled",
      category: "bookings",
    },
    {
      id: "BK-2026-012",
      date: "Feb 15, 2026",
      type: "Sell",
      item: "Assorted E-Waste",
      estWeight: "20 kg",
      address: "Tech Hub, Downtown",
      status: "Pending Approval",
      category: "bookings",
    },
    {
      id: "BK-2026-011",
      date: "Feb 14, 2026",
      type: "Buy",
      item: "Rebar Scraps (Grade A)",
      estWeight: "200 kg",
      address: "Construction Site B",
      status: "In Progress",
      category: "bookings",
    },
    {
      id: "BK-2026-010",
      date: "Feb 12, 2026",
      type: "Sell",
      item: "Old Car Batteries",
      estWeight: "50 kg",
      address: "Auto Shop, Mabini St",
      status: "Scheduled",
      category: "bookings",
    },
    {
      id: "BK-2026-009",
      date: "Feb 10, 2026",
      type: "Sell",
      item: "Copper Wires",
      estWeight: "5 kg",
      address: "Residential, Subd 2",
      status: "Rejected",
      category: "bookings",
    },
    {
      id: "BK-2026-008",
      date: "Feb 09, 2026",
      type: "Buy",
      item: "Aluminum Sheets",
      estWeight: "30 kg",
      address: "Warehouse 1",
      status: "Pending Approval",
      category: "bookings",
    },
    {
      id: "BK-2026-007",
      date: "Feb 08, 2026",
      type: "Sell",
      item: "Mixed Plastic Bottles",
      estWeight: "10 kg",
      address: "Recycle Center",
      status: "Cancelled",
      category: "bookings",
    },
    {
      id: "BK-2026-006",
      date: "Feb 05, 2026",
      type: "Sell",
      item: "Brass Fittings",
      estWeight: "8 kg",
      address: "Plumbing Co.",
      status: "Scheduled",
      category: "bookings",
    },
    {
      id: "BK-2026-005",
      date: "Feb 03, 2026",
      type: "Buy",
      item: "Scrap Iron",
      estWeight: "150 kg",
      address: "Industrial Park",
      status: "In Progress",
      category: "bookings",
    },
    {
      id: "BK-2026-004",
      date: "Feb 02, 2026",
      type: "Sell",
      item: "Old AC Units",
      estWeight: "100 kg",
      address: "Hotel Renovation",
      status: "Pending Approval",
      category: "bookings",
    },
    {
      id: "BK-2026-003",
      date: "Feb 01, 2026",
      type: "Sell",
      item: "Mixed Paper",
      estWeight: "40 kg",
      address: "Office Bldg 3",
      status: "Scheduled",
      category: "bookings",
    },
    {
      id: "BK-2026-002",
      date: "Jan 28, 2026",
      type: "Buy",
      item: "Zinc Plates",
      estWeight: "15 kg",
      address: "Print Shop",
      status: "Scheduled",
      category: "bookings",
    },
    {
      id: "BK-2026-001",
      date: "Jan 25, 2026",
      type: "Sell",
      item: "Glass Cullet",
      estWeight: "500 kg",
      address: "Bottle Factory",
      status: "Pending Approval",
      category: "bookings",
    },

    // HISTORY
    {
      id: "TRX-1045",
      date: "Jan 30, 2026",
      type: "Sell",
      item: "Titanium Scrap",
      finalWeight: "2 kg",
      amount: "₱ 5,000",
      status: "Completed",
      category: "history",
    },
    {
      id: "TRX-1044",
      date: "Jan 29, 2026",
      type: "Buy",
      item: "Stainless Steel 304",
      finalWeight: "100 kg",
      amount: "₱ 8,500",
      status: "Completed",
      category: "history",
    },
    {
      id: "TRX-1043",
      date: "Jan 29, 2026",
      type: "Sell",
      item: "Cardboard Bales",
      finalWeight: "200 kg",
      amount: "₱ 600",
      status: "Completed",
      category: "history",
    },
    {
      id: "TRX-1042",
      date: "Jan 28, 2026",
      type: "Sell",
      item: "Newspapers",
      finalWeight: "50 kg",
      amount: "₱ 150",
      status: "Completed",
      category: "history",
    },
    {
      id: "TRX-1041",
      date: "Jan 27, 2026",
      type: "Buy",
      item: "Engine Blocks",
      finalWeight: "300 kg",
      amount: "₱ 9,000",
      status: "Completed",
      category: "history",
    },
    {
      id: "TRX-1040",
      date: "Jan 27, 2026",
      type: "Sell",
      item: "Radiators (Copper)",
      finalWeight: "15 kg",
      amount: "₱ 2,200",
      status: "Completed",
      category: "history",
    },
    {
      id: "TRX-1039",
      date: "Jan 26, 2026",
      type: "Sell",
      item: "Insulated Wire",
      finalWeight: "---",
      amount: "Cancelled",
      status: "Cancelled",
      category: "history",
    },
    {
      id: "TRX-1038",
      date: "Jan 26, 2026",
      type: "Buy",
      item: "HMS 1&2",
      finalWeight: "1000 kg",
      amount: "₱ 28,000",
      status: "Completed",
      category: "history",
    },
    {
      id: "TRX-1037",
      date: "Jan 25, 2026",
      type: "Sell",
      item: "Electric Motors",
      finalWeight: "25 kg",
      amount: "₱ 1,500",
      status: "Completed",
      category: "history",
    },
    {
      id: "TRX-1036",
      date: "Jan 25, 2026",
      type: "Sell",
      item: "Alternators",
      finalWeight: "10 kg",
      amount: "₱ 800",
      status: "Completed",
      category: "history",
    },
    {
      id: "TRX-1035",
      date: "Jan 25, 2026",
      type: "Sell",
      item: "High Grade Copper",
      finalWeight: "10.5 kg",
      amount: "₱ 3,990",
      status: "Completed",
      category: "history",
    },
    {
      id: "TRX-1034",
      date: "Jan 24, 2026",
      type: "Sell",
      item: "Mixed Scrap",
      finalWeight: "50 kg",
      amount: "₱ 950",
      status: "Completed",
      category: "history",
    },
    {
      id: "TRX-1033",
      date: "Jan 22, 2026",
      type: "Buy",
      item: "Steel Beams",
      finalWeight: "500 kg",
      amount: "₱ 12,500",
      status: "Completed",
      category: "history",
    },
    {
      id: "TRX-1032",
      date: "Jan 20, 2026",
      type: "Sell",
      item: "Brass",
      finalWeight: "---",
      amount: "Cancelled",
      status: "Cancelled",
      category: "history",
    },
    {
      id: "TRX-1031",
      date: "Jan 18, 2026",
      type: "Sell",
      item: "E-Waste Motherboards",
      finalWeight: "2 kg",
      amount: "₱ 800",
      status: "Completed",
      category: "history",
    },
    {
      id: "TRX-1030",
      date: "Jan 15, 2026",
      type: "Buy",
      item: "Iron Sheets",
      finalWeight: "200 kg",
      amount: "₱ 4,200",
      status: "Completed",
      category: "history",
    },
    {
      id: "TRX-1029",
      date: "Jan 12, 2026",
      type: "Sell",
      item: "Plastic Bottles",
      finalWeight: "15 kg",
      amount: "₱ 225",
      status: "Completed",
      category: "history",
    },
    {
      id: "TRX-1028",
      date: "Jan 10, 2026",
      type: "Sell",
      item: "Car Battery",
      finalWeight: "12 kg",
      amount: "₱ 300",
      status: "Completed",
      category: "history",
    },
    {
      id: "TRX-1027",
      date: "Jan 08, 2026",
      type: "Buy",
      item: "Mixed Metal",
      finalWeight: "---",
      amount: "Refunded",
      status: "Cancelled",
      category: "history",
    },
  ];

  const getFilteredData = () => {
    return allData.filter((item) => {
      if (item.category !== activeTab) return false;
      const matchesSearch =
        item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filters.type === "All" || item.type === filters.type;
      const matchesStatus =
        filters.status === "All" || item.status === filters.status;
      return matchesSearch && matchesType && matchesStatus;
    });
  };

  const filteredItems = getFilteredData();
  const currentData = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Scheduled":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "Pending Approval":
        return "bg-orange-50 text-orange-700 border-orange-100";
      case "In Progress":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "Rejected":
      case "Cancelled":
        return "bg-red-50 text-red-700 border-red-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    // FIX 1: Root container uses `h-full` (fits parent container) instead of `min-h-screen`
    // This stops it from growing taller than the screen on desktop.
    <div className="flex flex-col h-full w-full bg-white font-sans text-slate-900 overflow-hidden relative">
      {/* --- HEADER --- */}
      <div className="px-6 py-4 border-b border-slate-100 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white z-20">
        <div className="flex items-center gap-4">
          <Link
            to="/auth/home"
            className="h-9 w-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-[#F2C94C] hover:text-slate-900 transition-all border border-slate-100 hover:border-[#F2C94C] shrink-0"
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
              Transaction History
            </h1>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">
              View and filter past activities
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-64 pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-[#F2C94C] focus:bg-white transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`h-[42px] px-3.5 rounded-xl border flex items-center justify-center transition-all ${isFilterOpen ? "bg-[#F2C94C] border-[#F2C94C] text-slate-900" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}
            >
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </button>
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-30">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                      Type
                    </label>
                    <select
                      value={filters.type}
                      onChange={(e) => {
                        setFilters((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }));
                        setCurrentPage(1);
                      }}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold focus:border-[#F2C94C] outline-none"
                    >
                      <option value="All">All</option>
                      <option value="Sell">Sold</option>
                      <option value="Buy">Bought</option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      setFilters({ type: "All", status: "All" });
                      setIsFilterOpen(false);
                      setCurrentPage(1);
                    }}
                    className="w-full py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- TAB SWITCHER --- */}
      <div className="shrink-0 px-6 bg-white border-b border-slate-100">
        <div className="flex gap-6">
          <button
            onClick={() => {
              setActiveTab("bookings");
              setCurrentPage(1);
            }}
            className={`py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-all ${activeTab === "bookings" ? "border-[#F2C94C] text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            Active Bookings
          </button>
          <button
            onClick={() => {
              setActiveTab("history");
              setCurrentPage(1);
            }}
            className={`py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-all ${activeTab === "history" ? "border-[#F2C94C] text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            History
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT CONTAINER --- */}
      {/* FIX 2: flex-1, min-h-0, overflow-hidden 
          This ensures the container fills the remaining space between Header and Bottom of screen,
          but NEVER pushes the bottom boundary down.
      */}
      <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden relative">
        {/* FIX 3: Scrollable Table Wrapper 
          - flex-1: Fills the space above pagination
          - overflow-auto: Handles BOTH Vertical (Y) and Horizontal (X) scrolling
          - ref: Attached to this div to measure available height
        */}
        <div className="flex-1 w-full overflow-auto" ref={tableContainerRef}>
          {/* min-w-[800px] ensures table triggers horizontal scroll on mobile instead of squishing */}
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm">
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4 bg-white">ID</th>
                <th className="px-6 py-4 bg-white">Date</th>
                <th className="px-6 py-4 bg-white">Details</th>
                {activeTab === "bookings" ? (
                  <th className="px-6 py-4 bg-white">Location</th>
                ) : (
                  <th className="px-6 py-4 bg-white text-right">Amount</th>
                )}
                <th className="px-6 py-4 bg-white text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {currentData.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="px-6 py-4 font-mono font-bold text-slate-400 text-xs group-hover:text-[#F2C94C] transition-colors">
                    {t.id}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600 text-xs whitespace-nowrap">
                    {t.date}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${t.type === "Sell" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}
                      >
                        {t.type === "Sell" ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                            <path
                              fillRule="evenodd"
                              d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0014 7z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm whitespace-nowrap">
                          {t.item}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">
                          {t.type} •{" "}
                          {activeTab === "bookings"
                            ? `Est. ${t.estWeight}`
                            : t.finalWeight}
                        </p>
                      </div>
                    </div>
                  </td>
                  {activeTab === "bookings" ? (
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 max-w-[150px] truncate">
                      {t.address}
                    </td>
                  ) : (
                    <td
                      className={`px-6 py-4 text-right font-black text-base whitespace-nowrap ${t.amount.includes("Cancel") ? "text-red-300" : "text-slate-900"}`}
                    >
                      {t.amount}
                    </td>
                  )}
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap border ${getStatusColor(t.status)}`}
                    >
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION (Sticky Footer) --- */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between z-20">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            {filteredItems.length > 0
              ? `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredItems.length)} of ${filteredItems.length}`
              : "No Records"}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-100 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-30 disabled:hover:bg-white transition-all"
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="flex gap-1">
              {getPageNumbers().map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${currentPage === pageNum ? "bg-[#F2C94C] text-slate-900 shadow-sm" : "text-slate-400 hover:bg-slate-50"}`}
                >
                  {pageNum}
                </button>
              ))}
            </div>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-100 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-30 disabled:hover:bg-white transition-all"
            >
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
