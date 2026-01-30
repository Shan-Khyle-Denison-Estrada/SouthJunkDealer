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

  // --- MOCK DATA ---
  const allTransactions = [
    {
      id: "BK-2026-020",
      date: "Feb 28, 2026",
      type: "Sell",
      item: "Industrial Generators",
      status: "Pending Approval",
      amount: "---",
    },
    {
      id: "TRX-1045",
      date: "Jan 30, 2026",
      type: "Sell",
      item: "Mixed Copper Wire",
      status: "Completed",
      amount: "₱12,500.00",
    },
    {
      id: "BK-2026-019",
      date: "Feb 25, 2026",
      type: "Buy",
      item: "Aluminum Scraps",
      status: "Scheduled",
      amount: "---",
    },
    {
      id: "TRX-1044",
      date: "Jan 28, 2026",
      type: "Sell",
      item: "Steel Rebar Bundle",
      status: "Completed",
      amount: "₱4,200.00",
    },
    {
      id: "TRX-1043",
      date: "Jan 25, 2026",
      type: "Buy",
      item: "Lead Batteries",
      status: "Rejected",
      amount: "---",
    },
    {
      id: "BK-2026-015",
      date: "Jan 20, 2026",
      type: "Sell",
      item: "Brass Fittings",
      status: "In Progress",
      amount: "---",
    },
    {
      id: "TRX-1041",
      date: "Jan 15, 2026",
      type: "Sell",
      item: "Titanium Scrap",
      status: "Completed",
      amount: "₱45,000.00",
    },
    {
      id: "TRX-1040",
      date: "Jan 10, 2026",
      type: "Buy",
      item: "E-Waste Components",
      status: "Completed",
      amount: "₱8,150.00",
    },
    {
      id: "BK-2026-008",
      date: "Jan 05, 2026",
      type: "Sell",
      item: "Mixed Metal",
      status: "Pending Approval",
      amount: "---",
    },
    {
      id: "TRX-1035",
      date: "Jan 01, 2026",
      type: "Sell",
      item: "Copper Pipes",
      status: "Completed",
      amount: "₱15,000.00",
    },
    {
      id: "BK-2025-112",
      date: "Dec 28, 2025",
      type: "Buy",
      item: "Old Electronics",
      status: "Scheduled",
      amount: "---",
    },
    {
      id: "TRX-1030",
      date: "Dec 20, 2025",
      type: "Sell",
      item: "Iron Sheets",
      status: "Completed",
      amount: "₱2,400.00",
    },
  ];

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
  }, [allTransactions]);

  // --- FILTER & PAGINATION ---
  const filteredData = allTransactions.filter((item) => {
    const matchesSearch =
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filters.type === "All" || item.type === filters.type;
    const matchesStatus =
      filters.status === "All" || item.status === filters.status;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const displayedItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

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

  const getPageNumbers = () => {
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, "...", totalPages];
    if (currentPage >= totalPages - 2)
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", currentPage, "...", totalPages];
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* --- HEADER --- */}
      <div className="shrink-0 px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white z-20">
        {/* Left Side: Back Button & Title */}
        <div className="flex items-center gap-4">
          <Link
            to="/auth/home"
            className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-[#F2C94C] hover:text-slate-900 transition-all border border-slate-100 hover:border-[#F2C94C]"
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
              Transactions
            </h1>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mt-1">
              History & Status
            </p>
          </div>
        </div>

        {/* Right Side: Controls (ROW LAYOUT) */}
        {/* Using flex-row + w-full. The input uses flex-1 to fill available width. */}
        <div className="flex flex-row w-full md:w-auto gap-3">
          <input
            type="text"
            placeholder="Search ID or Item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold focus:bg-white focus:border-[#F2C94C] focus:ring-4 focus:ring-[#F2C94C]/10 outline-none flex-1 md:w-64 min-w-0 transition-all placeholder:font-medium placeholder:text-slate-400"
          />
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`h-10 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                isFilterOpen
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                  clipRule="evenodd"
                />
              </svg>
              {/* Text hidden on mobile to save space, visible on tablet/desktop */}
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
          <button className="h-10 px-4 rounded-xl bg-[#F2C94C] hover:bg-[#eebc2d] text-slate-900 text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* --- TABLE CONTAINER --- */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
          {/* SCROLLABLE TABLE AREA */}
          <div
            className="flex-1 overflow-auto custom-scrollbar"
            ref={tableContainerRef}
          >
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-md border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                    Total Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayedItems.length > 0 ? (
                  displayedItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() =>
                        navigate(`/auth/transaction-details/${item.id}`)
                      }
                      className="group hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <span className="font-black text-sm text-slate-900 group-hover:text-[#F2C94C] transition-colors">
                          {item.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-xs text-slate-500">
                          {item.date}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${item.type === "Sell" ? "bg-green-50 text-green-700 border-green-100" : "bg-blue-50 text-blue-700 border-blue-100"}`}
                        >
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-sm text-slate-700">
                          {item.item}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide border ${getStatusColor(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-black text-sm text-slate-900">
                          {item.amount}
                        </p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <p className="text-slate-400 font-bold text-sm">
                        No transactions found.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          <div className="shrink-0 p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">
              Showing {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filteredData.length)} of{" "}
              {filteredData.length}
            </span>
            <div className="flex items-center gap-2">
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
                {getPageNumbers().map((pageNum, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      typeof pageNum === "number" && setCurrentPage(pageNum)
                    }
                    disabled={typeof pageNum !== "number"}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                      currentPage === pageNum
                        ? "bg-[#F2C94C] text-slate-900 shadow-sm"
                        : "text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              <button
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
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
    </div>
  );
};

export default Transactions;
