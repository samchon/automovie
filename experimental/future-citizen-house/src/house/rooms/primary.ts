import { Assembly } from "../assembly";
import { datum } from "../plan";
import { Item, lining, bed, cabinet, desk, chair, plant, lights } from "./interior";
export function primary(a: Assembly): void {
  const r = "primary-bedroom"; lining(a, r);
  bed(new Item(a, "primary-bed", r, 2.88, datum.floors[1], 4.32), 1.8, "linen");
  const nightstandHeight = 0.46;
  for (const x of [1.60, 4.16]) { cabinet(new Item(a, "primary-nightstand-" + x, r, x, datum.floors[1], 3.47), 0.5, nightstandHeight, nightstandHeight); a.ellipsoid("primary-lamp-" + x, r, "glow", x, datum.floors[1] + nightstandHeight + 0.135, 3.47, 0.22, 0.27, 0.22); }
  cabinet(new Item(a, "primary-wardrobe", r, -2.49, datum.floors[1], 4.26, Math.PI / 2), 2.72, 2.65, 0.60);
  desk(new Item(a, "primary-desk", r, 0.30, datum.floors[1], 5.35, Math.PI), 1.2);
  chair(new Item(a, "primary-chair", r, 0.30, datum.floors[1], 4.63));
  plant(new Item(a, "primary-plant", r, 4.88, datum.floors[1], 5.35), 0.6);
  lights(a, r, [[-0.5, 3.6], [2.8, 4.3]]);
}
