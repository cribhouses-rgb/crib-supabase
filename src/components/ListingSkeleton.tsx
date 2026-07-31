export default function ListingSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-pulse">
      <div className="h-36 bg-gray-200 dark:bg-gray-600" />
      <div className="p-3 space-y-2">
        <div className="flex justify-between">
          <div className="h-5 w-20 bg-gray-200 dark:bg-gray-600 rounded" />
          <div className="h-4 w-14 bg-gray-200 dark:bg-gray-600 rounded" />
        </div>
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-600 rounded" />
        <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}
