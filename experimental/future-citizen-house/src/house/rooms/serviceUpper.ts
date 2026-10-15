import { Assembly } from "../Assembly";
import { datum } from "../datum";
import { lights } from "./lights";
import { cabinet } from "./cabinet";
import { Item } from "./Item";
import { lining } from "./lining";
/**
 * Line and furnish the upper service room: stacked laundry machines, mechanical cabinet, utility
 * shelf and lights.
 */
export function serviceUpper(a: Assembly): void {
  const r = "upper-service"; lining(a, r);
  const laundry = new Item(a, "upper-laundry", r, -4.78, datum.floors[1], -4.54, Math.PI / 2);
  for (let i = 0; i < 2; i++) { laundry.box("machine-" + i, "white", 0, 0.42 + i * 0.84, 0, 0.66, 0.84, 0.66); laundry.round("drum-" + i, "metal", 0, 0.42 + i * 0.84, 0.34, 0.46, 0.46, 0.03); laundry.round("window-" + i, "glass", 0, 0.42 + i * 0.84, 0.36, 0.35, 0.35, 0.022); laundry.box("controls-" + i, "metal", 0.1, 0.74 + i * 0.84, 0.342, 0.25, 0.055, 0.014); }
  cabinet(new Item(a, "upper-mechanical", r, -2.10, datum.floors[1], -5.42), 1.1, 2.4, 0.56, false, "steel");
  cabinet(new Item(a, "upper-utility-shelf", r, -4.91, datum.floors[1], -2.71, Math.PI / 2), 0.85, 2.4, 0.45, true);
  lights(a, r, [[-3.25, -4.15], [-4.14, -1.1]]);
}
