/** Upper storey retains the one stair hole through its structural slab. */
import type { Assembly } from "../assembly";
import { bearing, ceiling, floorFinish, horizontal, slabTop } from "./floors";
import { partitions } from "./partitions";
export function upper(a: Assembly): void {
  horizontal(a, "upper-slab", "upper-storey", 2.908, slabTop(1), "stone", true, bearing);
  floorFinish(a, 1);
  ceiling(a, 1);
  partitions(a, 1);
}
