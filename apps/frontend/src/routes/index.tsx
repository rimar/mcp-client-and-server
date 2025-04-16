import { Link, createFileRoute } from "@tanstack/react-router";

import { fetchGuitars } from "@/utils/apis";

export const Route = createFileRoute("/")({
  component: App,
  loader: async () => {
    return fetchGuitars();
  },
});

export default function App() {
  return (
      <img src="/pathlock.png" />
  );
}
