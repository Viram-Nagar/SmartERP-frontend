"use client";

import { useState, useEffect, useRef } from "react";

export default function Calculator({ open, onClose }) {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState(null);
  const [op, setOp] = useState(null);
  const [reset, setReset] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      e.stopPropagation();
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key >= "0" && e.key <= "9") handleDigit(e.key);
      if (e.key === ".") handleDot();
      if (e.key === "+") handleOp("+");
      if (e.key === "-") handleOp("-");
      if (e.key === "*") handleOp("×");
      if (e.key === "/") {
        e.preventDefault();
        handleOp("÷");
      }
      if (e.key === "Enter" || e.key === "=") handleEquals();
      if (e.key === "Backspace") handleBack();
      if (e.key === "Delete") handleClear();
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [open, display, prev, op, reset]);

  const handleDigit = (d) => {
    setDisplay((prev) => (prev === "0" || reset ? d : prev + d));
    setReset(false);
  };
  const handleDot = () => {
    if (reset) {
      setDisplay("0.");
      setReset(false);
      return;
    }
    if (!display.includes(".")) setDisplay((d) => d + ".");
  };
  const handleOp = (o) => {
    setPrev(parseFloat(display));
    setOp(o);
    setReset(true);
  };
  const handleEquals = () => {
    if (prev === null || !op) return;
    const cur = parseFloat(display);
    const ops = {
      "+": prev + cur,
      "-": prev - cur,
      "×": prev * cur,
      "÷": cur !== 0 ? prev / cur : "Err",
    };
    const result = ops[op];
    setDisplay(
      typeof result === "number"
        ? String(parseFloat(result.toFixed(10)))
        : "Error",
    );
    setPrev(null);
    setOp(null);
    setReset(true);
  };
  const handleBack = () =>
    setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0"));
  const handleClear = () => {
    setDisplay("0");
    setPrev(null);
    setOp(null);
    setReset(false);
  };

  if (!open) return null;

  const btn = (label, action, cls = "") => (
    <button
      key={label}
      onClick={action}
      className={`rounded-lg py-3 text-sm font-medium transition-colors active:scale-95 ${cls}`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-end p-6 pointer-events-none">
      <div
        ref={ref}
        tabIndex={-1}
        className="pointer-events-auto w-64 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden outline-none"
      >
        {/* Display */}
        <div className="px-4 py-4 text-right bg-zinc-950 border-b border-zinc-800">
          <div className="text-zinc-500 text-xs h-4">
            {prev !== null ? `${prev} ${op}` : ""}
          </div>
          <div className="text-white text-3xl font-light truncate mt-1">
            {display}
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-4 gap-1 p-3">
          {btn(
            "C",
            handleClear,
            "col-span-2 bg-red-950/50 text-red-400 hover:bg-red-900/50",
          )}
          {btn("⌫", handleBack, "bg-zinc-800 text-zinc-300 hover:bg-zinc-700")}
          {btn(
            "÷",
            () => handleOp("÷"),
            "bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800/50",
          )}
          {btn(
            "7",
            () => handleDigit("7"),
            "bg-zinc-800 text-white hover:bg-zinc-700",
          )}
          {btn(
            "8",
            () => handleDigit("8"),
            "bg-zinc-800 text-white hover:bg-zinc-700",
          )}
          {btn(
            "9",
            () => handleDigit("9"),
            "bg-zinc-800 text-white hover:bg-zinc-700",
          )}
          {btn(
            "×",
            () => handleOp("×"),
            "bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800/50",
          )}
          {btn(
            "4",
            () => handleDigit("4"),
            "bg-zinc-800 text-white hover:bg-zinc-700",
          )}
          {btn(
            "5",
            () => handleDigit("5"),
            "bg-zinc-800 text-white hover:bg-zinc-700",
          )}
          {btn(
            "6",
            () => handleDigit("6"),
            "bg-zinc-800 text-white hover:bg-zinc-700",
          )}
          {btn(
            "-",
            () => handleOp("-"),
            "bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800/50",
          )}
          {btn(
            "1",
            () => handleDigit("1"),
            "bg-zinc-800 text-white hover:bg-zinc-700",
          )}
          {btn(
            "2",
            () => handleDigit("2"),
            "bg-zinc-800 text-white hover:bg-zinc-700",
          )}
          {btn(
            "3",
            () => handleDigit("3"),
            "bg-zinc-800 text-white hover:bg-zinc-700",
          )}
          {btn(
            "+",
            () => handleOp("+"),
            "bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800/50",
          )}
          {btn(
            "0",
            () => handleDigit("0"),
            "col-span-2 bg-zinc-800 text-white hover:bg-zinc-700",
          )}
          {btn(".", handleDot, "bg-zinc-800 text-white hover:bg-zinc-700")}
          {btn(
            "=",
            handleEquals,
            "bg-indigo-600 text-white hover:bg-indigo-500",
          )}
        </div>

        <div className="px-3 pb-2 text-center text-zinc-600 text-xs">
          F4 or Esc to close
        </div>
      </div>
    </div>
  );
}
