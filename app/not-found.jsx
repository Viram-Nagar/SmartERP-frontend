import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-3xl mx-auto">
          🔍
        </div>
        <h2 className="text-white text-xl font-semibold">Page not found</h2>
        <p className="text-zinc-500 text-sm">
          This page doesn't exist or you don't have access to it.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
