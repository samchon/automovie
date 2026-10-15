import { Item } from "./Item";

/** Furnish a chair with a seat and back in `material` on four metal legs. */
export function chair(t: Item, material = "green"): void {
  t.box("seat", material, 0, 0.45, 0, 0.46, 0.09, 0.46);
  t.box("back", material, 0, 0.7, -0.20, 0.46, 0.43, 0.07);
  for (const x of [-1, 1]) for (const z of [-1, 1]) t.box("leg-" + x + "-" + z, "metal", x * 0.18, 0.22, z * 0.18, 0.025, 0.44, 0.025);
}
