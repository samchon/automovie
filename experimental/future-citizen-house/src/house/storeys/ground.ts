/** Ground storey owns its structure, finished floor and first-storey ceiling. */
import type { Assembly } from "../assembly";
import { ceiling, floorFinish, horizontal, slabTop } from "./floors";
import { partitions } from "./partitions";
export function ground(a: Assembly): void {
  horizontal(a, "ground-foundation", "ground-storey", -0.3, slabTop(0), "stone", false);
  floorFinish(a, 0);
  ceiling(a, 0);
  partitions(a, 0);
}
