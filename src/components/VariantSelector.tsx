"use client";
import type { VariantSelection } from "@/lib/useVariantSelection";

const PRIMARY = "#111111";

export default function VariantSelector({ selection }: { selection: VariantSelection }) {
  const { optionGroups, selected, select, valueState } = selection;
  if (!optionGroups.length) return null;

  return (
    <div className="flex flex-col gap-4">
      {optionGroups.map((group) => (
        <div key={group.name}>
          <p className="mb-2 text-sm font-bold text-black">
            Select {group.name}
            {selected[group.name] && (
              <span className="ml-1 font-medium text-gray-500">: {selected[group.name]}</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.values.map((value) => {
              const active = selected[group.name] === value;
              const state = valueState(group.name, value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => select(group.name, value)}
                  aria-pressed={active}
                  title={state === "soldout" ? "Stock out" : undefined}
                  className="h-[42px] min-w-[55px] border bg-white px-3 text-sm font-bold transition"
                  style={{
                    cursor: "pointer",
                    borderWidth: active ? 2 : 1,
                    borderColor: active ? PRIMARY : "#d1d5db",
                    color: active ? PRIMARY : "#111",
                    opacity: state === "available" ? 1 : 0.45,
                    textDecoration: state === "soldout" ? "line-through" : undefined,
                    borderStyle: state === "unavailable" ? "dashed" : "solid",
                  }}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
