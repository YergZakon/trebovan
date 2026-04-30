export default function StatCard({
  label,
  value,
  subtitle,
  icon,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        {icon && <span className="text-lg">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </div>
      {subtitle && (
        <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          {subtitle}
        </div>
      )}
    </div>
  );
}
