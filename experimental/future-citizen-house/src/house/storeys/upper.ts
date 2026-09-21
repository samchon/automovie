/** Upper storey retains the one stair hole through its structural slab. */
import type { Assembly } from "../assembly";
import { ceiling, floorFinish, horizontal } from "./floors";
import { partitions } from "./partitions";
export function upper(a: Assembly): void {
  horizontal(a, "upper-slab", "upper-storey", 2.908, 3.184, "stone", true);
  floorFinish(a, 1);
  ceiling(a, 1);
  partitions(a, 1);
}
