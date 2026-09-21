import { Assembly } from "../assembly";
import { Item, lining, bed, cabinet, desk, chair, lights } from "./interior";
export function childOne(a: Assembly): void {
  const r = "child-bedroom-1"; lining(a, r);
  bed(new Item(a, "child-one-bed", r, 2.49, 3.2, -4.07), 1.0, "green");
  desk(new Item(a, "child-one-desk", r, 4.44, 3.2, -5.32), 1.24);
  chair(new Item(a, "child-one-chair", r, 4.44, 3.2, -4.62, Math.PI));
  cabinet(new Item(a, "child-one-wardrobe", r, 4.55, 3.2, -0.66, Math.PI), 1.3, 2.65, 0.6);
  cabinet(new Item(a, "child-one-books", r, 4.98, 3.2, -2.53, -Math.PI / 2), 0.75, 1.2, 0.4, true);
  lights(a, r, [[3.6, -3.3], [1.14, -0.95]]);
}
