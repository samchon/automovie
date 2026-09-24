/**
 * `side-walk`: the service path from the driveway past the garage to the
 * garden lower landing.
 *
 * Design owner: `docs/spaces/site/side-walk.md#side-walk-plan`. The long path
 * starts 0.60 m right of the garage outer right face 11.70 and is 1.20 m wide:
 * X = [12.30, 13.50]. The front connector is the 1.20 m band 1.40 m to 0.20 m
 * short of the paving end, Z = [5.10, 6.30], from the driveway's right edge
 * 11.30 to the path; between the driveway and the path's left edge its top
 * blends D(Z) to S linearly in X, and on the path it stays at S. The back
 * cross path runs −Z from the lower landing's outer end, 1.20 m wide, from the
 * landing's left edge to the path. S is the lower landing height, −0.45 m. The
 * three bands form one surface; each area is emitted once. Base 0.12 m.
 */
import { PALETTE } from "../palette";
import { type IHousePart, part, rect, slab } from "../solids";
import { DRIVEWAY, driveTop } from "./driveway";
import { WALK_DEPTH, blendedRun } from "./paving";
import { LOWER_LANDING } from "./terrace";

const OWNER = "site/side-walk.ts";

/** Side path geometry, metres. */
export const SIDE_WALK = {
  x: [12.3, 13.5] as const,
  frontBand: [5.1, 6.3] as const,
  backBand: [LOWER_LANDING.z[0] - 1.2, LOWER_LANDING.z[0]] as const,
  top: LOWER_LANDING.top,
};

/** Emit the three bands of the side path. */
export const buildSideWalk = (): IHousePart[] => {
  const s = SIDE_WALK.top;
  const [left, right] = [DRIVEWAY.x[1], SIDE_WALK.x[0]];
  const flat = (id: string, x: readonly [number, number], z: readonly [number, number]): IHousePart =>
    part(id, OWNER, "paving", PALETTE.paving, slab({ outline: rect(x, z), bottom: s - WALK_DEPTH, top: s }));
  return [
    flat("side-walk-long", SIDE_WALK.x, [SIDE_WALK.backBand[0], SIDE_WALK.frontBand[1]]),
    flat("side-walk-back", [LOWER_LANDING.x[0], SIDE_WALK.x[0]], SIDE_WALK.backBand),
    ...blendedRun({
      id: "side-walk-front-connector",
      owner: OWNER,
      color: PALETTE.paving,
      x: [left, right],
      z: SIDE_WALK.frontBand,
      height: (x, z) => {
        const t = (x - left) / (right - left);
        return (1 - t) * driveTop(z) + t * s;
      },
      depth: WALK_DEPTH,
    }),
  ];
};
