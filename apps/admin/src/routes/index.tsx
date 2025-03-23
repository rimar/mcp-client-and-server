import { createFileRoute } from "@tanstack/react-router";
import { fetchGuitars, fetchInventory } from "../utils/apis";

export const Route = createFileRoute("/")({
  component: RouteComponent,
  loader: async () => {
    const guitars = await fetchGuitars();
    const inventory = await fetchInventory();
    return { guitars, inventory };
  },
});

function RouteComponent() {
  const { guitars, inventory } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-8 text-blue-300">
        Guitar Inventory
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guitars.map((guitar) => {
          const stock =
            inventory.find((item) => item.guitarId === guitar.id)?.quantity ??
            0;
          return (
            <div
              key={guitar.id}
              className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105"
            >
              <img
                src={guitar.image}
                alt={guitar.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-bold text-blue-400">
                    {guitar.name}
                  </h2>
                  <span className="text-green-400 font-bold">
                    ${guitar.price}
                  </span>
                </div>
                <p className="text-gray-300 mb-3">{guitar.shortDescription}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">In Stock:</span>
                  <span
                    className={`font-bold ${
                      stock > 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {stock} units
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
