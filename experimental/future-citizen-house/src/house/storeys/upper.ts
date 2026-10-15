/** Upper storey retains the one stair hole through its structural slab. */
import type { Assembly } from "../Assembly";
import { datum } from "../datum";
import { slabTop } from "./slabTop";
import { ceiling } from "./ceiling";
import { floorFinish } from "./floorFinish";
import { horizontal } from "./horizontal";
import { bearing } from "./bearing";
import { partitions } from "./partitions";

export function upper(a: Assembly): void {
  horizontal(
    a,
    "upper-slab",
    "upper-storey",
    datum.ceilings[0] + 0.008,
    slabTop(1),
    "stone",
    true,
    bearing,
  );
  floorFinish(a, 1);
  ceiling(a, 1);
  partitions(a, 1);
}
