/** Ground storey owns its structure, finished floor and first-storey ceiling. */
import type { Assembly } from "../assembly";
import { ceiling, floorFinish, horizontal } from "./floors";
import { partitions } from "./partitions";
export function ground(a: Assembly): void {
  horizontal(a, "ground-foundation", "ground-storey", -0.3, -0.016, "stone", false);
  floorFinish(a, 0);
  ceiling(a, 0);
  partitions(a, 0);
}
