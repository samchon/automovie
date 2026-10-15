import { Item } from "./Item";

export function cabinet(t: Item, width: number, height: number, depth: number, open = false, material = "oak"): void {
  t.box("back", material, 0, height / 2, -depth / 2 + 0.012, width, height, 0.024);
  for (const x of [-1, 1]) t.box("side-" + x, material, x * (width / 2 - 0.01), height / 2, 0, 0.02, height, depth);
  const shelves = Math.ceil(height / 0.38);
  for (let i = 0; i <= shelves; i++) t.box("shelf-" + i, material, 0, 0.01 + (height - 0.02) * i / shelves, 0, width, 0.02, depth);
  if (!open) for (const side of [-1, 1]) {
    t.box("door-" + side, material, side * width / 4, height / 2, depth / 2, width / 2 - 0.004, height - 0.004, 0.02);
    t.box("handle-" + side, "metal", side * 0.05, height * 0.55, depth / 2 + 0.024, 0.012, 0.16, 0.02);
  }
}
