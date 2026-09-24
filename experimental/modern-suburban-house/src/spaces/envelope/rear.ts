/**
 * Rear elevation: the main rear wall and the garage rear wall with their voids.
 *
 * Design owner: `docs/spaces/envelope/rear.md`. The main rear wall is
 * Z = [-10.70, -10.45] m over X = [-5.75, 5.75] m and owns both rear corners
 * (07). Its top follows the main back roof to X = 1.60 and the right low roof
 * beyond, with wall-head wedges across the thickness. Voids (X, Y m):
 * - `kitchen-rear-window` [-4.50, -3.30] × [1.15, 2.30];
 * - `family-rear-window` [2.75, 4.75] × [0.75, 2.30];
 * - `primary-rear-window` [-3.85, -1.45] × [3.91, 5.31];
 * - `garden-door` [-1.20, 1.20] × [-0.175, 2.25]; the wall leaves the ground
 *   base reservation under it (10 ground-threshold-junctions) and
 *   `garden-door-threshold` fills the finish zone through the thickness, top
 *   0.02 m above the finished floor.
 * The garage rear wall is Z = [-6.70, -6.45] over X = [5.75, 11.70] with no
 * opening. Door leaves and window frames are later models.
 */
import { EXTERIOR_WALL_BOTTOM, GARAGE, MAIN } from "../building";
import { PALETTE } from "../palette";
import { ROOF_THICKNESS, SPLIT_X, gBack, mBack, rBack } from "../roof/junctions";
import { type IHousePart, block, part, wallPanel } from "../solids";
import { GROUND_LAYERS, STOREYS } from "../storeys";
import { wallHead } from "./wall-head";

const OWNER = "envelope/rear.ts";
const B = EXTERIOR_WALL_BOTTOM;
const BACK = MAIN.outer.z[0];
const INNER = BACK + MAIN.wall;
/** Bottom of the ground base reservation the wall leaves under the garden door (10). */
const SILL = STOREYS.groundFloor - GROUND_LAYERS.finish - GROUND_LAYERS.base;

/** Emit the rear elevation walls. */
export const buildRear = (): IHousePart[] => {
  const mainTop = mBack(BACK) - ROOF_THICKNESS;
  const rightTop = rBack(BACK) - ROOF_THICKNESS;
  const main = wallPanel({
    axis: "x",
    across: [BACK, INNER],
    outline: [
      { u: MAIN.outer.x[0], y: B },
      { u: MAIN.outer.x[1], y: B },
      { u: MAIN.outer.x[1], y: rightTop },
      { u: SPLIT_X, y: rightTop },
      { u: SPLIT_X, y: mainTop },
      { u: MAIN.outer.x[0], y: mainTop },
    ],
    holes: [
      { id: "kitchen-rear-window", from: -4.5, to: -3.3, bottom: 1.15, top: 2.3 },
      { id: "family-rear-window", from: 2.75, to: 4.75, bottom: 0.75, top: 2.3 },
      { id: "primary-rear-window", from: -3.85, to: -1.45, bottom: 3.91, top: 5.31 },
      { id: "garden-door", from: -1.2, to: 1.2, bottom: SILL, top: 2.25 },
    ],
  });
  const garageTop = gBack(GARAGE.outer.z[0]) - ROOF_THICKNESS;
  const garage = wallPanel({
    axis: "x",
    across: [GARAGE.outer.z[0], -6.45],
    outline: [
      { u: GARAGE.inner.x[0], y: B },
      { u: GARAGE.outer.x[1], y: B },
      { u: GARAGE.outer.x[1], y: garageTop },
      { u: GARAGE.inner.x[0], y: garageTop },
    ],
  });
  return [
    part("rear-main-wall", OWNER, "wall", PALETTE.siding, main),
    wallHead({ id: "rear-main-wall-head", owner: OWNER, x: [MAIN.outer.x[0], SPLIT_X], z: [BACK, INNER], roof: mBack, outerZ: BACK }),
    wallHead({ id: "rear-right-wall-head", owner: OWNER, x: [SPLIT_X, MAIN.outer.x[1]], z: [BACK, INNER], roof: rBack, outerZ: BACK }),
    part(
      "garden-door-threshold",
      OWNER,
      "floor",
      PALETTE.structure,
      block([-1.2, STOREYS.groundFloor - GROUND_LAYERS.finish, BACK], [1.2, STOREYS.groundFloor + 0.02, INNER]),
    ),
    part("rear-garage-wall", OWNER, "wall", PALETTE.siding, garage),
    wallHead({ id: "rear-garage-wall-head", owner: OWNER, x: [GARAGE.inner.x[0], GARAGE.outer.x[1]], z: [GARAGE.outer.z[0], -6.45], roof: gBack, outerZ: GARAGE.outer.z[0] }),
  ];
};
