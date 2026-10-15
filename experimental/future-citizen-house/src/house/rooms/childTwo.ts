import { Assembly } from "../Assembly";
import { datum } from "../datum";
import { desk } from "./desk";
import { lights } from "./lights";
import { bed } from "./bed";
import { cabinet } from "./cabinet";
import { chair } from "./chair";
import { Item } from "./Item";
import { lining } from "./lining";
/** Line and furnish the second child bedroom: bed, desk, chair, wardrobe and light. */
export function childTwo(a: Assembly): void {
  const r = "child-bedroom-2"; lining(a, r);
  bed(new Item(a, "child-two-bed", r, 2.73, datum.floors[1], 1.12, Math.PI / 2), 1.0, "blue");
  desk(new Item(a, "child-two-desk", r, 4.88, datum.floors[1], 1.25, -Math.PI / 2), 1.25);
  chair(new Item(a, "child-two-chair", r, 4.14, datum.floors[1], 1.25, Math.PI / 2));
  cabinet(new Item(a, "child-two-wardrobe", r, 1.31, datum.floors[1], 0.17), 1.4, 2.6, 0.54);
  lights(a, r, [[2.6, 1.1]]);
}
