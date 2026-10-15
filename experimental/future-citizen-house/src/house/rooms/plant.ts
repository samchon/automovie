import { Item } from "./Item";

export function plant(t: Item, size = 0.5): void {
  t.round("pot", "metal", 0, size * 0.22, 0, size * 0.45, size * 0.44, size * 0.45);
  t.box("stem", "oak", 0, size * 0.65, 0, 0.022, size, 0.022);
  for (let i = 0; i < 9; i++) { const angle = i * 2.4; t.round("leaf-" + i, "leaf", Math.cos(angle) * size * 0.2, size * (0.5 + i * 0.07), Math.sin(angle) * size * 0.2, size * 0.32, size * 0.14, size * 0.28); }
}
