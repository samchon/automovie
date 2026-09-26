import { Assembly } from "../assembly";
import { Item, lining, table, chair, cabinet, plant, lights } from "./interior";
export function common(a: Assembly): void {
  const r = "common-room"; lining(a, r);
  const sofa = new Item(a, "common-sofa", r, 2.88, 0, 2.75, Math.PI / 2);
  // The sofa stands on the 0.016m rug: the plinth carries the seat cushions and
  // back, and the arms reach the rug.
  sofa.box("plinth", "oak", 0, 0.168, 0, 2.7, 0.304, 0.91);
  sofa.box("back", "linen", 0, 0.67, -0.39, 2.7, 0.70, 0.19);
  for (let i = 0; i < 3; i++) { sofa.box("cushion-" + i, "linen", (i - 1) * 0.81, 0.43, 0.05, 0.78, 0.22, 0.74); sofa.round("pillow-" + i, i === 1 ? "green" : "linen", (i - 1) * 0.79, 0.68, -0.2, 0.52, 0.38, 0.18); }
  for (const s of [-1, 1]) sofa.box("arm-" + s, "linen", s * 1.28, 0.408, 0, 0.18, 0.784, 0.95);
  a.box("common-rug", r, "linen", 3.61, 0.008, 2.78, 2.8, 0.016, 3.65);
  table(new Item(a, "common-coffee", r, 4.05, 0.016, 2.85), 0.9, 1.25, 0.36);
  cabinet(new Item(a, "common-media", r, 5.02, 0, 2.85, -Math.PI / 2), 2.0, 0.44, 0.35);
  a.box("common-display", r, "metal", 5.20, 1.3, 2.85, 0.045, 0.8, 1.43);
  table(new Item(a, "common-dining", r, 0.55, 0, 3.85), 1.8, 0.92);
  for (const z of [-1, 1]) for (let i = 0; i < 3; i++) chair(new Item(a, "dining-chair-" + z + "-" + i, r, -0.08 + i * 0.63, 0, 3.85 + z * 0.78, z === -1 ? 0 : Math.PI), "oak");
  const island = new Item(a, "kitchen-island", r, -2.6, 0, 2.9);
  cabinet(island, 0.88, 0.87, 2.65, false, "green"); island.box("counter", "white", 0, 0.90, 0, 1.02, 0.06, 2.82);
  island.box("sink", "steel", 0, 0.934, 0.65, 0.58, 0.008, 0.46); island.box("sink-basin", "metal", 0, 0.943, 0.65, 0.48, 0.01, 0.36);
  island.box("tap-upright", "steel", -0.27, 1.1, 0.92, 0.025, 0.35, 0.025); island.box("tap-spout", "steel", -0.16, 1.265, 0.92, 0.24, 0.025, 0.025);
  for (let i = 0; i < 3; i++) { const t = new Item(a, "island-stool-" + i, r, -1.64, 0, 2.0 + i * 0.78); t.round("seat", "metal", 0, 0.63, 0, 0.35, 0.055, 0.35); for (const x of [-1, 1]) for (const z of [-1, 1]) t.box("leg-" + x + "-" + z, "metal", x * 0.11, 0.31, z * 0.11, 0.025, 0.62, 0.025); }
  const bank = new Item(a, "kitchen-wall-bank", r, -4.91, 0, 2.1, Math.PI / 2);
  cabinet(bank, 2.9, 0.87, 0.62, false, "green"); bank.box("worktop", "white", 0, 0.8975, 0, 3, 0.055, 0.67); bank.box("hob", "metal", 0, 0.931, 0, 0.65, 0.012, 0.50);
  for (const x of [-0.17, 0.17]) for (const z of [-0.12, 0.12]) bank.round("hob-ring-" + x + "-" + z, "steel", x, 0.94, z, 0.13, 0.006, 0.13);
  bank.box("oven", "metal", 0, 0.5, 0.324, 0.60, 0.49, 0.012); bank.box("oven-handle", "steel", 0, 0.68, 0.35, 0.4, 0.025, 0.028);
  cabinet(new Item(a, "kitchen-overhead", r, -5.04, 1.54, 2.1, Math.PI / 2), 2.9, 0.98, 0.36, false, "plaster");
  cabinet(new Item(a, "kitchen-fridge-pantry", r, -4.83, 0, 0.37, Math.PI / 2), 0.9, 2.65, 0.76);
  cabinet(new Item(a, "kitchen-sorting", r, -4.9, 0, 4.14, Math.PI / 2), 0.64, 0.84, 0.6);
  plant(new Item(a, "common-plant", r, 4.8, 0, 5.3), 1.1);
  lights(a, r, [[3.5, 1.4], [3.5, 4.5], [0.5, 2.4], [-3.6, 1.4], [-3.6, 4.5]]);
  a.box("dining-pendant-cord", r, "metal", 0.55, 2.4, 3.85, 0.012, 1, 0.012); a.ellipsoid("dining-pendant", r, "glow", 0.55, 1.92, 3.85, 0.38, 0.12, 0.38);
}
