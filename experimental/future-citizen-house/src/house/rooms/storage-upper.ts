import { Assembly } from "../assembly";
import { datum } from "../plan";
import { Item, lining, cabinet, lights } from "./interior";
export function storageUpper(a: Assembly): void {
  const r = "upper-storage"; lining(a, r);
  cabinet(new Item(a, "upper-linen-cabinet", r, -4.9, datum.floors[1], 0.48, Math.PI / 2), 1.1, 2.6, 0.5, true);
  // Each stack rests on shelf i+1 of the 2.6m cabinet: seven 0.02m shelves
  // divide its inner height, as in cabinet().
  const shelves = Math.ceil(2.6 / 0.38);
  for (let i = 0; i < 5; i++) a.box("upper-linen-stack-" + i, r, "linen", -4.88, datum.floors[1] + 0.02 + 2.58 * (i + 1) / shelves + 0.08, 0.48, 0.38, 0.16, 0.6);
  lights(a, r, [[-4.1, 0.48]]);
}
