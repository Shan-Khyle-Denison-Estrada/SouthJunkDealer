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
    {
      id: "TRX-1014",
      date: "Sep 25, 2025",
      item: "Bottles",
      type: "Sold",
      weight: "50 kg",
      amount: "₱ 150",
      status: "Completed",
    },
  ];

  // CHANGED: Reduced to 9 items per page to "omit one row"
  const itemsPerPage = 5;

  // Logic
  const filteredData = allTransactions.filter(
    (item) =>
      (item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filters.type === "All" || item.type === filters.type) &&
      (filters.status === "All" || item.status === filters.status),
  );

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

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Helper for generating page numbers
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="h-full flex flex-col bg-white font-sans text-slate-900 overflow-hidden">
      {/* --- UNIFIED HEADER --- */}
      <div className="px-6 py-4 border-b border-slate-100 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white z-20">
        {/* Left: Back + Title */}
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

        {/* Right: Search & Filter */}
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
              placeholder="Search ID or Item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-[#F2C94C] focus:bg-white transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Filter Toggle */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`h-[42px] px-3.5 rounded-xl border flex items-center justify-center transition-all ${
                isFilterOpen
                  ? "bg-[#F2C94C] border-[#F2C94C] text-slate-900"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
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

            {/* Dropdown */}
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-30">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                      Type
                    </label>
                    <select
                      value={filters.type}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium focus:border-[#F2C94C] outline-none"
                    >
                      <option value="All">All Types</option>
                      <option value="Sold">Sold</option>
                      <option value="Pickup">Pickup</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium focus:border-[#F2C94C] outline-none"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      setFilters({ type: "All", status: "All" });
                      setIsFilterOpen(false);
                    }}
                    className="w-full py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- FULL SCREEN BODY --- */}
      <div className="flex-grow flex flex-col overflow-hidden relative">
        {/* Scrollable Table Area */}
        <div className="flex-grow overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 shadow-sm">
              <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th
                  className="px-8 py-4 cursor-pointer hover:text-slate-800 transition-colors"
                  onClick={() => handleSort("id")}
                >
                  Transaction ID
                </th>
                <th
                  className="px-6 py-4 cursor-pointer hover:text-slate-800 transition-colors"
                  onClick={() => handleSort("date")}
                >
                  Date
                </th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm bg-white">
              {currentData.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="px-8 py-5 font-mono font-bold text-slate-400 group-hover:text-[#F2C94C] transition-colors">
                    {t.id}
                  </td>
                  <td className="px-6 py-5 font-medium text-slate-600">
                    {t.date}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${t.type === "Sold" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}
                      >
                        {t.type === "Sold" ? (
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
                        <p className="font-bold text-slate-900 text-base">
                          {t.item}
                        </p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                          {t.type} • {t.weight}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td
                    className={`px-6 py-5 text-right font-black text-base ${t.amount === "Pending" ? "text-slate-300 italic font-medium" : "text-slate-900"}`}
                  >
                    {t.amount}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        t.status === "Completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : t.status === "In Progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {currentData.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-400 italic"
                  >
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- IMPROVED PAGINATION --- */}
        <div className="shrink-0 px-8 py-4 border-t border-slate-100 bg-white flex items-center justify-between z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, sortedData.length)} of{" "}
            {sortedData.length}
          </span>

          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-100 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:hover:bg-white transition-all shadow-sm"
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

            {/* Page Numbers */}
            <div className="flex items-center gap-1 bg-slate-50/50 p-1 rounded-xl">
              {getPageNumbers().map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                    currentPage === pageNum
                      ? "bg-[#F2C94C] text-slate-900 shadow-sm"
                      : "text-slate-500 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            {/* Next Button */}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-100 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:hover:bg-white transition-all shadow-sm"
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
