import type { ActiveTab } from "./types";

type ProjectTabsProps = {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
};

const TAB_ITEMS: Array<{ key: ActiveTab; label: string }> = [
  { key: "task", label: "Task" },
  { key: "updates", label: "Updates" },
  { key: "documents", label: "Documents" },
];

export function ProjectTabs({ activeTab, onTabChange }: ProjectTabsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {TAB_ITEMS.map((item) => (
        <button
          key={item.key}
          className={`text-title-24 rounded-md border px-4 py-2 ${
            activeTab === item.key ? "bg-[#8a732e]" : "bg-black"
          }`}
          onClick={() => onTabChange(item.key)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
