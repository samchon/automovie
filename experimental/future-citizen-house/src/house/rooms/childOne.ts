import { Assembly } from "../Assembly";
import { datum } from "../datum";
import { desk } from "./desk";
import { lights } from "./lights";
import { bed } from "./bed";
import { cabinet } from "./cabinet";
import { chair } from "./chair";
import { Item } from "./Item";
import { lining } from "./lining";
/** Line and furnish the first child bedroom: bed, desk, chair, wardrobe, bookshelf and lights. */
export function childOne(a: Assembly): void {
  const r = "child-bedroom-1"; lining(a, r);
  bed(new Item(a, "child-one-bed", r, 2.49, datum.floors[1], -4.07), 1.0, "green");
  desk(new Item(a, "child-one-desk", r, 4.44, datum.floors[1], -5.32), 1.24);
  chair(new Item(a, "child-one-chair", r, 4.44, datum.floors[1], -4.62, Math.PI));
  cabinet(new Item(a, "child-one-wardrobe", r, 4.55, datum.floors[1], -0.66, Math.PI), 1.3, 2.65, 0.6);
  cabinet(new Item(a, "child-one-books", r, 4.98, datum.floors[1], -2.53, -Math.PI / 2), 0.75, 1.2, 0.4, true);
  lights(a, r, [[3.6, -3.3], [1.14, -0.95]]);
}
