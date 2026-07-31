import { useState } from "react";
import { Flag, X } from "lucide-react";
import type { ReportReason } from "../types";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "fake_or_scam", label: "Fake listing or scam" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "harassment", label: "Harassment or abuse" },
  { value: "misleading_info", label: "Misleading information" },
  { value: "other", label: "Other" },
];

interface Props {
  targetLabel: string;
  onClose: () => void;
  onSubmit: (reason: ReportReason, details: string) => Promise<void>;
}

export default function ReportModal({ targetLabel, onClose, onSubmit }: Props) {
  const [reason, setReason] = useState<ReportReason>("fake_or_scam");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setBusy(true);
    await onSubmit(reason, details.trim());
    setBusy(false);
    setDone(true);
    setTimeout(onClose, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-xs">
        {done ? (
          <p className="text-center text-sm text-gray-700 dark:text-gray-300 py-4">
            Thanks — we've received your report.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Flag size={16} className="text-red-500 dark:text-red-400" />
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Report</p>
              </div>
              <button onClick={onClose}><X size={18} className="text-gray-400 dark:text-gray-500" /></button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 truncate">{targetLabel}</p>

            <div className="space-y-1.5">
              {REASONS.map((r) => (
                <label key={r.value} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="report-reason"
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-red-900"
                  />
                  {r.label}
                </label>
              ))}
            </div>

            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Add any details that could help us look into this (optional)"
              className="w-full h-20 p-3 mt-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm resize-none"
            />

            <button
              onClick={handleSubmit}
              disabled={busy}
              className="w-full h-11 mt-3 rounded-xl bg-red-600 text-white text-sm font-medium disabled:opacity-50"
            >
              {busy ? "Submitting…" : "Submit report"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
