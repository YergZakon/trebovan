import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import OkedSearch from "@/components/ui/OkedSearch";
import okedSummary from "../../../data/generated/oked_summary.json";

const navLinks = [
  { href: "/", label: "Обзор" },
  { href: "/vision", label: "О проекте" },
  { href: "/sections", label: "Секции" },
  { href: "/spheres", label: "Реестр" },
  { href: "/scenarios", label: "Сценарии" },
  { href: "/profile-builder", label: "Подбор по профилю" },
  { href: "/duplicates", label: "Дубликаты" },
  { href: "/methodology", label: "Методология" },
];

const searchItems = okedSummary.map((o: { id: string; name: string; reqs: number }) => ({
  id: o.id,
  name: o.name,
  reqs: o.reqs,
}));

export default function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-base font-bold tracking-tight text-gray-900 dark:text-white"
          >
            RegDashboard
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <OkedSearch items={searchItems} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
