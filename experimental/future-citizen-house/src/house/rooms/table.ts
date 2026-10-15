import { Item } from "./Item";

/** Furnish a table with a 0.044 m top at `height` on four legs. */
export function table(t: Item, width: number, depth: number, height = 0.74): void {
  t.box("top", "oak", 0, height - 0.022, 0, width, 0.044, depth);
  // Legs run from the floor to the underside of the 0.044m top they carry.
  for (const x of [-1, 1]) for (const z of [-1, 1]) t.box("leg-" + x + "-" + z, "oak", x * (width / 2 - 0.09), (height - 0.044) / 2, z * (depth / 2 - 0.09), 0.045, height - 0.044, 0.045);
}
