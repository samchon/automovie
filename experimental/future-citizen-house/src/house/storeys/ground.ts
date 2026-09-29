/** Ground storey owns its structure, finished floor and first-storey ceiling. */
import type { Assembly } from "../assembly";
import { exteriorWallZone, portals, type Rect } from "../plan";
/** Grade is y=-0.45 (spaces/001#site-access); the foundation is buried 0.15m
 * below it so the plinth face -0.45..0 meets the ground on the outline. */
export const foundationBottom = -0.60;
import { ceiling, finishDepth, floorFinish, horizontal, slabTop, subtract } from "./floors";
import { partitions } from "./partitions";
export function ground(a: Assembly): void {
  horizontal(a, "ground-foundation", "ground-storey", foundationBottom, slabTop(0), "stone", false);
  // The floor finish exists only in room cells. Under the exterior walls the
  // foundation is built up to the ground floor, except where a door threshold
  // already fills the wall depth.
  for (const [id, zone] of exteriorWallZone()) {
    let pieces: Rect[] = [zone];
    for (const p of portals.filter((p) => p.wall === id + "-face")) {
      const cut: Rect = id === "front" || id === "rear" ? [p.center - p.width / 2, p.center + p.width / 2, zone[2], zone[3]] : [zone[0], zone[1], p.center - p.width / 2, p.center + p.width / 2];
      pieces = pieces.flatMap((r) => subtract(r, cut));
    }
    pieces.forEach((r, i) => a.box("ground-foundation-bearing-" + id + "-" + i, "ground-storey", "stone", (r[0] + r[1]) / 2, -finishDepth / 2, (r[2] + r[3]) / 2, r[1] - r[0], finishDepth, r[3] - r[2]));
  }
  floorFinish(a, 0);
  ceiling(a, 0);
  partitions(a, 0);
}
