import { createFileRoute } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  createColumnHelper,
  useReactTable,
} from "@tanstack/react-table";
import { fetchOrders, fetchGuitars } from "../utils/apis";
import type { Guitar, Order } from "../utils/apis";
const columnHelper = createColumnHelper<Order>();

const columns = [
  columnHelper.accessor("customerName", {
    header: "Customer Name",
    cell: (info) => info.getValue(),
    filterFn: "includesString",
  }),
  columnHelper.accessor("items", {
    header: "Items",
    cell: (info) => {
      const items = info.getValue();
      const guitars =
        (info.table.options.meta as { guitars: Guitar[] } | undefined)
          ?.guitars || [];
      return (
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const guitar = guitars.find((g) => g.id === item.guitarId);
            if (!guitar) return null;
            return (
              <div key={guitar.id} className="flex items-center gap-2">
                <img
                  src={guitar.image}
                  alt={guitar.name}
                  className="h-12 w-12 object-cover rounded"
                />
                <div>
                  <div className="font-medium">{guitar.name}</div>
                  <div className="text-sm text-gray-400">
                    Qty: {item.quantity}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    },
  }),
  columnHelper.accessor("totalAmount", {
    header: "Total Amount",
    cell: (info) =>
      info.getValue().toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      }),
  }),
  columnHelper.accessor("orderDate", {
    header: "Order Date",
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
];

export const Route = createFileRoute("/orders")({
  component: TableDemo,
  loader: async () => {
    const orders = await fetchOrders();
    const guitars = await fetchGuitars();
    return { orders, guitars };
  },
});

function TableDemo() {
  const { orders, guitars } = Route.useLoaderData();

  const table = useReactTable<Order>({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      guitars,
      orders,
    },
  });

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="h-4" />
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full text-sm text-gray-200">
          <thead className="bg-gray-800 text-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className="px-4 py-3 text-left"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-700">
            {table.getRowModel().rows.map((row) => {
              return (
                <tr
                  key={row.id}
                  className="hover:bg-gray-800 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="h-4" />
      <div className="flex flex-wrap items-center gap-2 text-gray-200">
        <button
          className="px-3 py-1 bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {"<<"}
        </button>
        <button
          className="px-3 py-1 bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {"<"}
        </button>
        <button
          className="px-3 py-1 bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {">"}
        </button>
        <button
          className="px-3 py-1 bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {">>"}
        </button>
        <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          | Go to page:
          <input
            type="number"
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              table.setPageIndex(page);
            }}
            className="w-16 px-2 py-1 bg-gray-800 rounded-md border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
          className="px-2 py-1 bg-gray-800 rounded-md border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
