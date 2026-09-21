import { Assembly } from "../assembly";
import { Item, lining, cabinet, lights } from "./interior";
export function storageUpper(a: Assembly): void {
  const r = "upper-storage"; lining(a, r);
  cabinet(new Item(a, "upper-linen-cabinet", r, -4.9, 3.2, 0.48, Math.PI / 2), 1.1, 2.6, 0.5, true);
  for (let i = 0; i < 5; i++) a.box("upper-linen-stack-" + i, r, "linen", -4.88, 3.55 + i * 0.44, 0.48, 0.38, 0.16, 0.6);
  lights(a, r, [[-4.1, 0.48]]);
}
