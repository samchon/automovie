/**
 * Front elevation: the main front wall with the gable triangle, and the garage
 * front wall, each with its real voids.
 *
 * Design owner: `docs/spaces/envelope/front.md`. The main front wall is
 * Z = [-0.25, 0] m over X = [-5.75, 5.75] m and owns both front corners (07
 * exterior-boundary-junctions). Its top follows the roof undersides at the
 * outer line: the gable triangle F − 0.24 over X = [-5.75, -1.80], the main roof
 * to the split X = 1.60, the right low roof beyond it; wall-head wedges carry
 * the slope across the thickness. Voids (X, Y m):
 * - `living-front-window` [-5.10, -2.30] × [0.70, 2.30];
 * - `bedroom-two-front-window` [-4.80, -2.70] × [3.91, 5.31];
 * - `stair-front-window` [-1.62, -0.84] × [4.11, 5.21];
 * - `bedroom-three-front-window` [2.65, 4.75] × [3.91, 5.31];
 * - `front-door` [0.40, 1.40] × [-0.175, 2.20] (void owned by entry-plan); the
 *   wall leaves the ground base reservation under it (10
 *   ground-threshold-junctions) and `front-door-threshold` fills the finish
 *   zone through the thickness, top 0.02 m above the finished floor.
 * The garage front wall is Z = [-0.55, -0.30] over X = [5.75, 11.70] with the
 * `garage-front-door` void X = [6.10, 11.10], Y = [-0.30, 2.15] (the garage
 * base runs through the thickness below -0.15, 10); the closed
 * panel leaf and rails are later models, so the void is open here.
 */
import { EXTERIOR_WALL_BOTTOM, GARAGE, MAIN } from "../building";
import { PALETTE } from "../palette";
import { GABLE, ROOF_THICKNESS, SPLIT_X, gFront, gable, mFront, rFront } from "../roof/junctions";
import { type IHousePart, block, part, wallPanel } from "../solids";
import { GROUND_LAYERS, STOREYS } from "../storeys";
import { wallHead } from "./wall-head";

const OWNER = "envelope/front.ts";
const B = EXTERIOR_WALL_BOTTOM;
const FRONT = MAIN.outer.z[1];
const INNER = FRONT - MAIN.wall;
/** Bottom of the ground base reservation the wall leaves under the front door (10). */
const SILL = STOREYS.groundFloor - GROUND_LAYERS.finish - GROUND_LAYERS.base;

/** Emit the front elevation walls. */
export const buildFront = (): IHousePart[] => {
  const mainTop = mFront(FRONT) - ROOF_THICKNESS;
  const rightTop = rFront(FRONT) - ROOF_THICKNESS;
  const peak = gable(GABLE.center) - ROOF_THICKNESS;
  const main = wallPanel({
    axis: "x",
    across: [INNER, FRONT],
    outline: [
      { u: MAIN.outer.x[0], y: B },
      { u: MAIN.outer.x[1], y: B },
      { u: MAIN.outer.x[1], y: rightTop },
      { u: SPLIT_X, y: rightTop },
      { u: SPLIT_X, y: mainTop },
      { u: GABLE.b, y: mainTop },
      { u: GABLE.center, y: peak },
      { u: GABLE.a, y: mainTop },
    ],
    holes: [
      { id: "living-front-window", from: -5.1, to: -2.3, bottom: 0.7, top: 2.3 },
      { id: "bedroom-two-front-window", from: -4.8, to: -2.7, bottom: 3.91, top: 5.31 },
      { id: "stair-front-window", from: -1.62, to: -0.84, bottom: 4.11, top: 5.21 },
      { id: "bedroom-three-front-window", from: 2.65, to: 4.75, bottom: 3.91, top: 5.31 },
      { id: "front-door", from: 0.4, to: 1.4, bottom: SILL, top: 2.2 },
    ],
  });
  const garageTop = gFront(GARAGE.outer.z[1]) - ROOF_THICKNESS;
  const garage = wallPanel({
    axis: "x",
    across: [-0.55, GARAGE.outer.z[1]],
    outline: [
      { u: GARAGE.inner.x[0], y: B },
      { u: GARAGE.outer.x[1], y: B },
      { u: GARAGE.outer.x[1], y: garageTop },
      { u: GARAGE.inner.x[0], y: garageTop },
    ],
    holes: [{ id: "garage-front-door", from: 6.1, to: 11.1, bottom: STOREYS.garageFloor - GROUND_LAYERS.garageBase, top: 2.15 }],
  });
  return [
    part("front-main-wall", OWNER, "wall", PALETTE.siding, main),
    wallHead({ id: "front-main-wall-head", owner: OWNER, x: [GABLE.b, SPLIT_X], z: [INNER, FRONT], roof: mFront, outerZ: FRONT }),
    wallHead({ id: "front-right-wall-head", owner: OWNER, x: [SPLIT_X, MAIN.outer.x[1]], z: [INNER, FRONT], roof: rFront, outerZ: FRONT }),
    part(
      "front-door-threshold",
      OWNER,
      "floor",
      PALETTE.structure,
      block([0.4, STOREYS.groundFloor - GROUND_LAYERS.finish, INNER], [1.4, STOREYS.groundFloor + 0.02, FRONT]),
    ),
    part("front-garage-wall", OWNER, "wall", PALETTE.siding, garage),
    wallHead({ id: "front-garage-wall-head", owner: OWNER, x: [GARAGE.inner.x[0], GARAGE.outer.x[1]], z: [-0.55, GARAGE.outer.z[1]], roof: gFront, outerZ: GARAGE.outer.z[1] }),
  ];
};
