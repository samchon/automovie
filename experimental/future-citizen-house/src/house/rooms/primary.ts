import { Assembly } from "../assembly";
import { Item, lining, bed, cabinet, desk, chair, plant, lights } from "./interior";
export function primary(a: Assembly): void {
  const r = "primary-bedroom"; lining(a, r);
  bed(new Item(a, "primary-bed", r, 2.88, 3.2, 4.32), 1.8, "linen");
  for (const x of [1.60, 4.16]) { cabinet(new Item(a, "primary-nightstand-" + x, r, x, 3.2, 3.47), 0.5, 0.46, 0.46); a.ellipsoid("primary-lamp-" + x, r, "glow", x, 3.66 + 0.135, 3.47, 0.22, 0.27, 0.22); }
  cabinet(new Item(a, "primary-wardrobe", r, -2.49, 3.2, 4.26, Math.PI / 2), 2.72, 2.65, 0.60);
  desk(new Item(a, "primary-desk", r, 0.30, 3.2, 5.35, Math.PI), 1.2);
  chair(new Item(a, "primary-chair", r, 0.30, 3.2, 4.63));
  plant(new Item(a, "primary-plant", r, 4.88, 3.2, 5.35), 0.6);
  lights(a, r, [[-0.5, 3.6], [2.8, 4.3]]);
}
