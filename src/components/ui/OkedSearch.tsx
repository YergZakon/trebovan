"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type OkedItem = { id: string; name: string; reqs: number };

export default function OkedSearch({ items }: { items: OkedItem[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const filtered = query.length >= 2
    ? items
        .filter(
          (o) =>
            o.id.includes(query) ||
            o.name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 12)
    : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        placeholder="Поиск ОКЭД..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="w-48 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 lg:w-64"
      />
      {open && filtered.length > 0 && (
        <div className="absolute right-0 z-50 mt-1 max-h-96 w-[32rem] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={() => {
                router.push(`/oked/${o.id}`);
                setQuery("");
                setOpen(false);
              }}
              className="flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="mt-0.5 shrink-0 rounded bg-blue-100 px-2 py-0.5 font-mono text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                {o.id}
              </span>
              <span className="text-gray-700 dark:text-gray-300">
                {o.name}
              </span>
              <span className="ml-auto shrink-0 text-xs text-gray-400">
                {o.reqs.toLocaleString("ru-RU")}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
