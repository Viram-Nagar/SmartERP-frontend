"use client";

import { useEffect, useRef } from "react";

export default function MasterDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = "max-w-lg",
}) {
  const drawerRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(
        () =>
          drawerRef.current?.querySelector("input,select,textarea")?.focus(),
        100,
      );
    }
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 z-40 bg-black/50 backdrop-blur-sm
          transition-opacity duration-200
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`
          fixed right-0 top-0 bottom-0 z-50
          ${width} w-full
          bg-zinc-900 border-l border-zinc-800
          shadow-2xl flex flex-col
          transform transition-transform duration-200 ease-out
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div>
            <h2 className="text-white font-semibold">{title}</h2>
            {subtitle && (
              <p className="text-zinc-500 text-xs mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </>
  );
}
