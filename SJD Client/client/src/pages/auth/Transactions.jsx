import { useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Transactions = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ type: "All", status: "All" });

  const tableContainerRef = useRef(null);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // --- DYNAMIC HEIGHT LOGIC ---
  useLayoutEffect(() => {
    const calculateItems = () => {
      const container = tableContainerRef.current;
      if (!container) return;

      const containerHeight = container.getBoundingClientRect().height;
      const headerElement = container.querySelector("thead");
      const headerHeight = headerElement
        ? headerElement.getBoundingClientRect().height
        : 48;

      const rowElement = container.querySelector("tbody tr");
      const rowHeight = rowElement
        ? rowElement.getBoundingClientRect().height
        : 72;

      const availableHeight = containerHeight - headerHeight;
      const calculatedItems = Math.floor(availableHeight / rowHeight);

      setItemsPerPage(Math.max(1, calculatedItems));
    };

    calculateItems();

    const observer = new ResizeObserver(calculateItems);
    if (tableContainerRef.current) {
      observer.observe(tableContainerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // --- MOCK DATA ---
  const allData = [
    {
      id: "BK-2026-020",
      date: "Feb 28, 2026",
      type: "Sell",
      item: "Industrial Generators",
      weight: "Est. 500 kg",
      address: "Power Plant, Sector 7",
      amount: null,
      status: "Pending Approval",
    },
    {
      id: "BK-2026-019",
      date: "Feb 27, 2026",
      type: "Buy",
      item: "Copper Pipes",
      weight: "Est. 45 kg",
      address: "Plumbing Warehouse",
      amount: null,
      status: "In Progress",
    },
    {
      id: "BK-2026-018",
      date: "Feb 26, 2026",
      type: "Sell",
      item: "Office Monitors",
      weight: "Est. 120 kg",
      address: "IT Park, Bldg C",
      amount: null,
      status: "Scheduled",
    },
    {
      id: "TRX-1045",
      date: "Jan 30, 2026",
      type: "Sell",
      item: "Titanium Scrap",
      weight: "2 kg",
      address: "Walk-in",
      amount: "₱ 5,000",
      status: "Completed",
    },
    {
      id: "TRX-1044",
      date: "Jan 29, 2026",
      type: "Buy",
      item: "Stainless Steel 304",
      weight: "100 kg",
      address: "Delivered",
      amount: "₱ 8,500",
      status: "Completed",
    },
    {
      id: "BK-2026-017",
      date: "Feb 25, 2026",
      type: "Sell",
      item: "Mixed Aluminum",
      weight: "Est. 30 kg",
      address: "Renovation Site 4",
      amount: null,
      status: "Pending Approval",
    },
    {
      id: "TRX-1042",
      date: "Jan 28, 2026",
      type: "Sell",
      item: "Newspapers",
      weight: "50 kg",
      address: "Pick-up",
      amount: "₱ 150",
      status: "Completed",
    },
    {
      id: "BK-2026-016",
      date: "Feb 24, 2026",
      type: "Buy",
      item: "Steel Rebar",
      weight: "Est. 250 kg",
      address: "Construction Yard",
      amount: null,
      status: "Scheduled",
    },
    {
      id: "TRX-1039",
      date: "Jan 26, 2026",
      type: "Sell",
      item: "Insulated Wire",
      weight: "---",
      address: "Main St",
      amount: "Cancelled",
      status: "Cancelled",
    },
    {
      id: "BK-2026-012",
      date: "Feb 15, 2026",
      type: "Sell",
      item: "Assorted E-Waste",
      weight: "Est. 20 kg",
      address: "Tech Hub",
      amount: null,
      status: "Pending Approval",
    },
    {
      id: "TRX-1035",
      date: "Jan 25, 2026",
      type: "Sell",
      item: "High Grade Copper",
      weight: "10.5 kg",
      address: "Walk-in",
      amount: "₱ 3,990",
      status: "Completed",
    },
    {
      id: "BK-2026-006",
      date: "Feb 05, 2026",
      type: "Sell",
      item: "Brass Fittings",
      weight: "Est. 8 kg",
      address: "Plumbing Co.",
      amount: null,
      status: "Scheduled",
    },
    {
      id: "TRX-1030",
      date: "Jan 15, 2026",
      type: "Buy",
      item: "Iron Sheets",
      weight: "200 kg",
      address: "Warehouse 2",
      amount: "₱ 4,200",
      status: "Completed",
    },
    {
      id: "BK-2026-005",
      date: "Feb 03, 2026",
      type: "Buy",
      item: "Scrap Iron",
      weight: "Est. 150 kg",
      address: "Industrial Park",
      amount: null,
      status: "In Progress",
    },
    {
      id: "TRX-1029",
      date: "Jan 12, 2026",
      type: "Sell",
      item: "Plastic Bottles",
      weight: "15 kg",
      address: "Walk-in",
      amount: "₱ 225",
      status: "Completed",
    },
  ];

  const getFilteredData = () => {
    return allData.filter((item) => {
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
    <div className="flex flex-col h-full w-full bg-white font-sans text-slate-900 overflow-hidden relative">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-slate-100 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white z-20 sticky top-0 md:relative">
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
              All Transactions
            </h1>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">
              Manage bookings and view history
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
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => {
                        setFilters((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }));
                        setCurrentPage(1);
                      }}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold focus:border-[#F2C94C] outline-none"
                    >
                      <option value="All">All</option>
                      <option value="Completed">Completed</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Pending Approval">Pending</option>
                      <option value="Cancelled">Cancelled</option>
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

      {/* TABLE CONTAINER */}
      <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden relative">
        <div
          className="flex-1 w-full overflow-x-auto overflow-y-hidden"
          ref={tableContainerRef}
        >
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm">
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-[48px]">
                <th className="px-4 py-3 bg-white w-24">ID</th>
                <th className="px-4 py-3 bg-white w-28">Date</th>
                <th className="px-4 py-3 bg-white w-24 text-center">Type</th>
                <th className="px-4 py-3 bg-white w-full">Location</th>
                <th className="px-4 py-3 bg-white text-right">Amount</th>
                <th className="px-4 py-3 bg-white text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {currentData.map((t) => (
                <tr
                  key={t.id}
                  // --- NAVIGATION TO STATIC PAGE ---
                  onClick={() => navigate("/auth/transaction-details")}
                  className="hover:bg-slate-50/80 transition-colors group h-[72px] cursor-pointer"
                >
                  <td className="px-4 font-mono font-bold text-slate-400 text-xs group-hover:text-[#F2C94C] transition-colors whitespace-nowrap">
                    {t.id}
                  </td>
                  <td className="px-4 font-medium text-slate-600 text-xs whitespace-nowrap">
                    {t.date}
                  </td>
                  <td className="px-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                        t.type === "Sell"
                          ? "bg-green-50 text-green-700 border-green-100"
                          : "bg-blue-50 text-blue-700 border-blue-100"
                      }`}
                    >
                      {t.type === "Sell" ? "Selling" : "Buying"}
                    </span>
                  </td>
                  <td className="px-4 text-xs font-medium text-slate-500 max-w-[200px] truncate">
                    {t.address}
                  </td>
                  <td className="px-4 text-right whitespace-nowrap">
                    {t.amount ? (
                      <span
                        className={`font-black text-sm ${t.amount.includes("Cancel") ? "text-red-300" : "text-slate-900"}`}
                      >
                        {t.amount}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-300">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap border ${getStatusColor(t.status)}`}
                    >
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
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
