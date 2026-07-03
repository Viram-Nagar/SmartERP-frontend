"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VoucherHeader({
  date,
  setDate,
  reference,
  setReference,
  voucherNumber,
}) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
      <div className="space-y-1.5">
        <Label className="text-zinc-400 text-xs uppercase tracking-wider">
          Voucher No.
        </Label>
        <div className="flex items-center h-9 px-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
          <span className="text-indigo-400 font-mono text-sm">
            {voucherNumber || "..."}
          </span>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-zinc-400 text-xs uppercase tracking-wider">
          Date
        </Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="bg-zinc-800 border-zinc-700 text-white focus:border-indigo-500 h-9"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-zinc-400 text-xs uppercase tracking-wider">
          Reference / Cheque No.
        </Label>
        <Input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Optional"
          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-indigo-500 h-9"
        />
      </div>
    </div>
  );
}
