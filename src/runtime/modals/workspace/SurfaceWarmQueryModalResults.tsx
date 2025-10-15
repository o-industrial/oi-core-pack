import type { FunctionalComponent } from 'npm:preact@10.20.1';
import { useEffect, useState } from '../../../.deps.ts';

type Row = Record<string, unknown>;

type FlatPrimitive = string | number | boolean | null;
type FlatRow = Record<string, FlatPrimitive>;

interface SurfaceWarmQueryModalResultsProps {
  isLoading: boolean;
  queryName: string;
  queryResults: Row[]; // ← no `any[]`
}

// Narrower object check (ignore arrays)
const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

// Coerce values into a flat primitive suitable for table/CSV cells
const coerceCell = (v: unknown): FlatPrimitive => {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v;
  // Dates, arrays, objects, etc → JSON
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

// One-level flatten: parent.child for nested objects
const flattenObject = (obj: Row): FlatRow => {
  const out: FlatRow = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isPlainObject(value)) {
      for (const [k, v] of Object.entries(value)) {
        out[`${key}.${k}`] = coerceCell(v);
      }
    } else {
      out[key] = coerceCell(value);
    }
  }
  return out;
};

export const SurfaceWarmQueryModalResults: FunctionalComponent<
  SurfaceWarmQueryModalResultsProps
> = ({ isLoading, queryName, queryResults }) => {
  const rowsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when new results come in
  useEffect(() => {
    setCurrentPage(1);
  }, [queryResults]);

  const totalPages = Math.ceil(queryResults.length / rowsPerPage);

  // Paginate then flatten (so headers match visible rows)
  const paginatedResults: FlatRow[] = queryResults
    .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    .map(flattenObject);

  const columnHeaders: string[] = paginatedResults.length > 0
    ? Object.keys(paginatedResults[0])
    : [];

  const handleExportToCSV = (): void => {
    if (!queryResults.length) return;

    // Flatten all results for the export
    const flattened: FlatRow[] = queryResults.map(flattenObject);

    // Collect all unique headers across all rows
    const allKeys = new Set<string>();
    for (const row of flattened) {
      for (const k of Object.keys(row)) allKeys.add(k);
    }
    const headers = Array.from(allKeys);

    // CSV rows (escape quotes, stringify primitives)
    const csvRows: string[] = [
      headers.join(','), // header
      ...flattened.map((row) =>
        headers
          .map((field) => {
            const value = row[field];
            const str = value === null ? '' : String(value);
            // escape double quotes per RFC 4180
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${queryName || 'query'}-results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id='results1' class='pl-6 pr-6 pt-6 pb-0 rounded-sm flex-1 min-h-0 flex flex-col'>
      {/* Header */}
      <div id='results2' class='flex items-center justify-between mb-2'>
        <label class='flex items-center gap-2 text-neutral-900 dark:text-white font-semibold'>
          Results
        </label>

        {queryResults.length > 0 && (
          <a
            title='Download CSV'
            href='#'
            onClick={(e) => {
              e.preventDefault();
              handleExportToCSV();
            }}
            class='inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 focus:outline-none'
          >
            {/* ...icon... */}
            <span class='text-sm'>CSV</span>
          </a>
        )}
      </div>

      {isLoading
        ? (
          <div class='flex items-center justify-center h-40'>
            <div class='animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-solid' />
          </div>
        )
        : queryResults.length > 0
        ? (
          <>
            {/* SCROLL AREA */}
            <div class='flex-1 min-h-0 overflow-y-auto overflow-x-auto rounded border border-gray-300 dark:border-gray-600 mb-2'>
              <table class='w-full table-auto border-collapse border-spacing-0'>
                <thead>
                  <tr class='bg-gray-100 dark:bg-slate-700'>
                    {columnHeaders.map((h) => (
                      <th
                        key={h}
                        class='border px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap'
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedResults.map((row, i) => (
                    <tr key={i} class='border-t'>
                      {columnHeaders.map((h) => (
                        <td class='border px-3 py-2 text-xs whitespace-nowrap'>
                          {row[h] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* NON-SCROLLING PAGER */}
            <div class='flex justify-center items-center mt-2 px-1 gap-3'>
              <button
                type='button'
                class='px-3 py-1 bg-gray-300 dark:bg-slate-700 text-sm rounded disabled:opacity-50'
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>

              <span class='text-sm whitespace-nowrap'>
                Page {currentPage} of {Math.max(totalPages, 1)}
              </span>

              <button
                type='button'
                class='px-3 py-1 bg-gray-300 dark:bg-slate-700 text-sm rounded disabled:opacity-50'
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </button>
            </div>
          </>
        )
        : <p class='text-gray-600 dark:text-gray-300 mb-6'>No results to display.</p>}
    </div>
  );
};
