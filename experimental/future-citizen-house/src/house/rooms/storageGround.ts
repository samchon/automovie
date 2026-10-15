import { Assembly } from "../Assembly";
import { lights } from "./lights";
import { cabinet } from "./cabinet";
import { Item } from "./Item";
import { lining } from "./lining";
/** Line and furnish the ground storage room: open shelves with baskets and a light. */
export function storageGround(a: Assembly): void {
  const r = "storage-1f"; lining(a, r);
  cabinet(new Item(a, "ground-store-shelves", r, -4.9, 0, -1.22, Math.PI / 2), 1.55, 2.5, 0.5, true);
  for (let i = 0; i < 4; i++) a.box("ground-store-basket-" + i, r, "felt", -4.89, 0.34 + i * 0.55, -1.2, 0.40, 0.28, 0.65);
  lights(a, r, [[-4.14, -1.22]]);
}
