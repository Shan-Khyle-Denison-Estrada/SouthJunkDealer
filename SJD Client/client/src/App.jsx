import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Loading...");

  // Fetch data from the Express backend
  useEffect(() => {
    fetch("http://localhost:5000/")
      .then((res) => res.json())
      .then((data) => setMessage(`${data.message} DB Time: ${data.db_time}`))
      .catch((err) => {
        console.error(err);
        setMessage("Error connecting to server");
      });
  }, []);

  return (
    // Tailwind classes used below: h-screen, flex, justify-center, items-center, bg-slate-900, etc.
    <div className="h-screen flex flex-col justify-center items-center bg-slate-900 text-white">
      <h1 className="text-5xl font-bold mb-4 text-blue-500">
        PERN Stack Setup
      </h1>
      <div className="p-6 bg-slate-800 rounded-xl shadow-lg border border-slate-700">
        <h2 className="text-2xl font-semibold mb-2">Backend Status:</h2>
        <p className="text-lg text-emerald-400 font-mono">{message}</p>
      </div>
    </div>
  );
}

export default App;
