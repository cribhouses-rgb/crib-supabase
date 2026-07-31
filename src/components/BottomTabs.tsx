import { Home, Search, Store, User, Users } from "lucide-react";

export type TabId = "home" | "search" | "roommates" | "marketplace" | "profile";

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
  /** Roommate finder is only relevant to students, not agents/landlords. */
  showRoommates?: boolean;
}

export default function BottomTabs({ active, onChange, showRoommates = false }: Props) {
  const tabs: { id: TabId; icon: typeof Home; label: string }[] = [
    { id: "home", icon: Home, label: "Home" },
    { id: "search", icon: Search, label: "Search" },
    ...(showRoommates ? [{ id: "roommates" as TabId, icon: Users, label: "Roomies" }] : []),
    { id: "marketplace", icon: Store, label: "Market" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex z-20">
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className="flex-1 py-2.5 flex flex-col items-center gap-0.5 transition-colors"
          style={{ color: active === id ? "#7f1d1d" : "#9ca3af" }}
        >
          <Icon size={20} />
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}
