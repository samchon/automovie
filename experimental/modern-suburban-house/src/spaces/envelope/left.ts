/**
 * Left elevation: the main left gable wall, its two windows, and the chimney.
 *
 * Design owner: `docs/spaces/envelope/left.md` (`left-roof-closure`,
 * `left-openings`, `living-left-window`, `primary-left-window`,
 * `chimney-roof-interface`). The wall is X = [-5.75, -5.50] m and ends at the
 * front and rear walls' inner faces (07). Its top is the main roof underside,
 * a triangle whose peak is the ridge at Z = -5.35. The chimney body
 * X = [-6.30, -5.50], Z = [-2.75, -1.65] m takes the wall's place over its Z
 * range, so the wall is two panels on either side of it. Voids (Z, Y m):
 * `living-left-window` [-5.50, -4.30] × [0.75, 2.30] and
 * `primary-left-window` [-8.90, -7.30] × [3.91, 5.31].
 *
 * Chimney: body Y = [-0.45, 8.90] m, cap Y = [8.90, 9.10] m projecting 0.10 m
 * on every side, and the living-room fireplace front X = [-5.50, -4.95],
 * Z = [-3.00, -1.40], Y = [0, 1.40] m. The fire is out; flue and combustion are
 * not modelled.
 */
import { EXTERIOR_WALL_BOTTOM, MAIN } from "../building";
import { PALETTE } from "../palette";
import { CHIMNEY_PLAN, MAIN_RIDGE_Z, ROOF_THICKNESS, mainRoof } from "../roof/junctions";
import { type IHousePart, block, part, wallPanel } from "../solids";

const OWNER = "envelope/left.ts";
const B = EXTERIOR_WALL_BOTTOM;
const ACROSS = [MAIN.outer.x[0], MAIN.inner.x[0]] as const;
const under = (z: number): number => mainRoof(z) - ROOF_THICKNESS;

/** Emit the left gable wall panels and the chimney. */
export const buildLeft = (): IHousePart[] => {
  const front = MAIN.inner.z[1];
  const back = MAIN.inner.z[0];
  const [chimneyBack, chimneyFront] = CHIMNEY_PLAN.z;
  const frontPanel = wallPanel({
    axis: "z",
    across: ACROSS,
    outline: [
      { u: chimneyFront, y: B },
      { u: front, y: B },
      { u: front, y: under(front) },
      { u: chimneyFront, y: under(chimneyFront) },
    ],
  });
  const backPanel = wallPanel({
    axis: "z",
    across: ACROSS,
    outline: [
      { u: back, y: B },
      { u: chimneyBack, y: B },
      { u: chimneyBack, y: under(chimneyBack) },
      { u: MAIN_RIDGE_Z, y: under(MAIN_RIDGE_Z) },
      { u: back, y: under(back) },
    ],
    holes: [
      { id: "living-left-window", from: -5.5, to: -4.3, bottom: 0.75, top: 2.3 },
      { id: "primary-left-window", from: -8.9, to: -7.3, bottom: 3.91, top: 5.31 },
    ],
  });
  return [
    part("left-wall-front", OWNER, "wall", PALETTE.siding, frontPanel),
    part("left-wall-back", OWNER, "wall", PALETTE.siding, backPanel),
    part("chimney-body", OWNER, "chimney", PALETTE.brick, block([CHIMNEY_PLAN.x[0], -0.45, chimneyBack], [CHIMNEY_PLAN.x[1], 8.9, chimneyFront])),
    part("chimney-cap", OWNER, "chimney", PALETTE.railing, block([CHIMNEY_PLAN.x[0] - 0.1, 8.9, chimneyBack - 0.1], [CHIMNEY_PLAN.x[1] + 0.1, 9.1, chimneyFront + 0.1])),
    part("fireplace-front", OWNER, "chimney", PALETTE.brick, block([-5.5, 0, -3.0], [-4.95, 1.4, -1.4])),
  ];
};
