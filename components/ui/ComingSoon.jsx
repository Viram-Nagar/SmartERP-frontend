export default function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-3">
      <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl">
        🚧
      </div>
      <p className="text-white font-medium">{title}</p>
      <p className="text-zinc-500 text-sm">
        Coming in a future day of the build
      </p>
    </div>
  );
}
