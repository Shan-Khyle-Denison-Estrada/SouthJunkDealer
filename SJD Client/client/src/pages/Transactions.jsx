import { useState } from "react";
import { Link } from "react-router-dom";

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Filter States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: "All",
    status: "All",
  });

  // Mock Data
  const allTransactions = [
    {
      id: "TRX-1024",
      date: "Oct 24, 2025",
      item: "Mixed Copper",
      type: "Sold",
      weight: "5.2 kg",
      amount: "₱ 1,976",
      status: "Completed",
    },
    {
      id: "TRX-1023",
      date: "Oct 20, 2025",
      item: "Aluminum Cans",
      type: "Sold",
      weight: "12 kg",
      amount: "₱ 780",
      status: "Completed",
    },
    {
      id: "TRX-1022",
      date: "Oct 28, 2025",
      item: "Scheduled Pickup",
      type: "Pickup",
      weight: "---",
      amount: "Pending",
      status: "In Progress",
    },
    {
      id: "TRX-1021",
      date: "Oct 15, 2025",
      item: "Old Electronics",
      type: "Sold",
      weight: "3.5 kg",
      amount: "₱ 1,450",
      status: "Completed",
    },
    {
      id: "TRX-1020",
      date: "Oct 12, 2025",
      item: "Steel Scraps",
      type: "Sold",
      weight: "45 kg",
      amount: "₱ 810",
      status: "Completed",
    },
    {
      id: "TRX-1019",
      date: "Oct 10, 2025",
      item: "Brass",
      type: "Sold",
      weight: "2 kg",
      amount: "₱ 420",
      status: "Completed",
    },
    {
      id: "TRX-1018",
      date: "Oct 08, 2025",
      item: "Cardboard Bulk",
      type: "Sold",
      weight: "15 kg",
      amount: "₱ 60",
      status: "Completed",
    },
    {
      id: "TRX-1017",
      date: "Oct 05, 2025",
      item: "Copper Wire",
      type: "Sold",
      weight: "8 kg",
      amount: "₱ 3,040",
      status: "Completed",
    },
    {
      id: "TRX-1016",
      date: "Oct 01, 2025",
      item: "Large Pickup",
      type: "Pickup",
      weight: "---",
      amount: "Cancelled",
      status: "Cancelled",
    },
    {
      id: "TRX-1015",
      date: "Sep 28, 2025",
      item: "Mixed Metal",
      type: "Sold",
      weight: "20 kg",
      amount: "₱ 360",
      status: "Completed",
    },
  ];

  const itemsPerPage = 6;

  // --- Filtering & Sorting Logic ---
  const filteredData = allTransactions.filter((item) => {
    const matchesSearch =
      item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filters.type === "All" || item.type === filters.type;
    const matchesStatus =
      filters.status === "All" || item.status === filters.status;

    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const currentData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const hasActiveFilters = filters.type !== "All" || filters.status !== "All";

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 font-sans text-slate-800 relative">
      {/* --- 1. TITLE & TOOLBAR --- */}
      <div className="px-8 py-6 shrink-0 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Link
            to="/home"
            className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-slate-500 hover:text-[#F2C94C] hover:shadow-md transition-all border border-slate-200"
            title="Back to Home"
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Transactions
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Manage your history
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search Bar - Elongated */}
          <div className="relative group w-full md:w-96">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#F2C94C] focus:ring-2 focus:ring-[#F2C94C]/20 bg-white shadow-sm transition-all"
            />
            <svg
              className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-[#F2C94C]"
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
          </div>

          {/* Filter Trigger */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className={`p-2.5 border rounded-xl transition-all flex items-center gap-2 ${
              hasActiveFilters
                ? "bg-[#F2C94C] border-[#F2C94C] text-slate-900 shadow-md"
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
            title="Filter"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                clipRule="evenodd"
              />
            </svg>
            {hasActiveFilters && (
              <span className="text-xs font-bold hidden sm:inline">Active</span>
            )}
          </button>

          {/* New Button - bg-primary */}
          <Link
            to="/bookings"
            className="flex items-center gap-2 bg-primary hover:opacity-90 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
          >
            <span className="text-white/80 text-lg leading-none font-black">
              +
            </span>
            <span className="hidden sm:inline">New</span>
          </Link>
        </div>
      </div>

      {/* --- 2. TABLE CARD --- */}
      <div className="flex-grow px-8 pb-8 overflow-hidden flex flex-col min-h-0">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col h-full overflow-hidden">
          <div className="flex-grow overflow-auto">
            <table className="w-full text-left border-collapse h-full">
              <thead className="bg-slate-50/50 text-slate-500 uppercase font-bold text-[11px] tracking-wider sticky top-0 z-10 border-b border-slate-100">
                <tr>
                  {[
                    { label: "ID", key: "id", width: "w-44" }, // Wider ID column
                    { label: "Date", key: "date", width: "w-32" },
                    { label: "Item", key: "item", width: "w-auto" },
                    { label: "Type", key: "type", width: "w-28" },
                    { label: "Weight", key: "weight", width: "w-28" },
                    {
                      label: "Amount",
                      key: "amount",
                      align: "right",
                      width: "w-32",
                    },
                    {
                      label: "Status",
                      key: "status",
                      align: "center",
                      width: "w-32",
                    },
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => requestSort(col.key)}
                      className={`px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"} ${col.width}`}
                    >
                      <div
                        className={`flex items-center gap-1.5 ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : "justify-start"}`}
                      >
                        {col.label}
                        {sortConfig.key === col.key && (
                          <span className="text-[#F2C94C] font-black text-xs">
                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentData.length > 0 ? (
                  currentData.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/80 transition-all group h-1/6"
                    >
                      <td className="px-6 py-3">
                        <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 group-hover:border-[#F2C94C] group-hover:text-slate-600 transition-colors">
                          {t.id}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-slate-500">
                        {t.date}
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-800 text-sm">
                          {t.item}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${t.type === "Sold" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-slate-600">
                        {t.weight}
                      </td>
                      <td
                        className={`px-6 py-3 text-right text-sm font-black tracking-tight ${t.amount === "Pending" ? "text-slate-400 italic" : t.amount === "Cancelled" ? "text-red-400 line-through decoration-2" : "text-emerald-600"}`}
                      >
                        {t.amount}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${t.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : t.status === "In Progress" ? "bg-sky-50 text-sky-700 border-sky-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${t.status === "Completed" ? "bg-emerald-500" : t.status === "In Progress" ? "bg-sky-500" : "bg-rose-500"}`}
                          />
                          {t.status}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="h-full text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400 py-12">
                        <p>No transactions found.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {/* Filler rows */}
                {currentData.length > 0 &&
                  currentData.length < itemsPerPage &&
                  Array.from({ length: itemsPerPage - currentData.length }).map(
                    (_, idx) => (
                      <tr
                        key={`empty-${idx}`}
                        className="h-1/6 pointer-events-none"
                      >
                        <td colSpan="7"></td>
                      </tr>
                    ),
                  )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 px-6 py-4 bg-white shrink-0 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>
              Showing{" "}
              <span className="text-slate-900 font-bold">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="text-slate-900 font-bold">
                {Math.min(currentPage * itemsPerPage, sortedData.length)}
              </span>{" "}
              of {sortedData.length}
            </span>
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                ←
              </button>
              <span className="px-3 py-1 text-slate-900 font-bold">
                {currentPage}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- FILTER MODAL --- */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsFilterOpen(false)}
          ></div>

          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden transform transition-all scale-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg">
                Filter Transactions
              </h3>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
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

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Transaction Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["All", "Sold", "Pickup"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilters((prev) => ({ ...prev, type }))}
                      className={`py-2 px-3 rounded-xl text-sm font-bold border transition-all ${
                        filters.type === type
                          ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#F2C94C] focus:ring-1 focus:ring-[#F2C94C] bg-slate-50 focus:bg-white transition-all appearance-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex gap-3 bg-slate-50/30">
              <button
                onClick={() => setFilters({ type: "All", status: "All" })}
                className="flex-1 px-4 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors text-sm"
              >
                Reset
              </button>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#F2C94C] text-slate-900 font-bold shadow-md hover:bg-[#e6bd3f] transition-colors text-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
