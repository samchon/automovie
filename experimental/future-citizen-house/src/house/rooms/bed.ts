import { Item } from "./Item";

export function bed(t: Item, width: number, blanket: string): void {
  t.box("base", "oak", 0, 0.18, 0, width + 0.08, 0.20, 2.12);
  // The 0.08m clearance under the base stands on four legs at its corners.
  for (const x of [-1, 1]) for (const z of [-1, 1]) t.box("leg-" + x + "-" + z, "oak", x * (width / 2 - 0.01), 0.04, z * 1.01, 0.045, 0.08, 0.045);
  t.box("mattress", "linen", 0, 0.37, 0, width, 0.22, 2.02);
  t.box("duvet", blanket, 0, 0.50, 0.28, width + 0.02, 0.08, 1.45);
  t.box("head", "oak", 0, 0.56, -1.08, width + 0.08, 0.90, 0.06);
  const count = width > 1.3 ? 2 : 1;
  for (let i = 0; i < count; i++) t.round("pillow-" + i, "white", count === 1 ? 0 : (i - 0.5) * width / 2, 0.54, -0.7, width / count - 0.15, 0.14, 0.4);
}
