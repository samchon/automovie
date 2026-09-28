import { Assembly } from "../assembly";
import { datum } from "../plan";
import { Item, lining, bed, cabinet, desk, chair, lights } from "./interior";
export function childTwo(a: Assembly): void {
  const r = "child-bedroom-2"; lining(a, r);
  bed(new Item(a, "child-two-bed", r, 2.73, datum.floors[1], 1.12, Math.PI / 2), 1.0, "blue");
  desk(new Item(a, "child-two-desk", r, 4.88, datum.floors[1], 1.25, -Math.PI / 2), 1.25);
  chair(new Item(a, "child-two-chair", r, 4.14, datum.floors[1], 1.25, Math.PI / 2));
  cabinet(new Item(a, "child-two-wardrobe", r, 1.31, datum.floors[1], 0.17), 1.4, 2.6, 0.54);
  lights(a, r, [[2.6, 1.1]]);
}
