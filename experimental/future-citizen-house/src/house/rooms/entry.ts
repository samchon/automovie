import { Assembly } from "../assembly";
import { Item, lining, cabinet, plant, lights } from "./interior";
export function entry(a: Assembly): void {
  const r = "entry"; lining(a, r);
  cabinet(new Item(a, "entry-shoe-bench", r, -2.46, 0, -1.10, Math.PI / 2), 1.15, 0.44, 0.48);
  a.box("entry-bench-cushion", r, "green", -2.46, 0.48, -1.1, 0.48, 0.08, 1.15);
  a.box("entry-charging-shelf", r, "oak", -2.76, 1.05, -0.65, 0.15, 0.045, 0.32);
  a.box("entry-charger", r, "metal", -2.7, 1.08, -0.65, 0.07, 0.015, 0.12);
  plant(new Item(a, "entry-plant", r, 2.53, 0, -2.70), 0.8);
  lights(a, r, [[2.1, -4.6], [2.05, -1.5], [-2.1, -2.1]]);
}
