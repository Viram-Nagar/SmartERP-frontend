"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-red-950/50 border border-red-900/50 flex items-center justify-center text-3xl mx-auto">
          ⚠
        </div>
        <h2 className="text-white text-xl font-semibold">
          Something went wrong
        </h2>
        <p className="text-zinc-500 text-sm">
          {error.message || "An unexpected error occurred."}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
          >
            ← Dashboard
          </button>
          <button
            onClick={reset}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
