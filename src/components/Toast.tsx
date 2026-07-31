import { Check } from "lucide-react";

interface Props {
  message: string;
}

export default function Toast({ message }: Props) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
      <Check size={15} className="text-green-400" /> {message}
    </div>
  );
}
