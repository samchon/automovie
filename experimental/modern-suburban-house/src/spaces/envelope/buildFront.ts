/**
 * Front elevation: the main front wall with the gable triangle, and the garage
 * front wall, each with its real voids.
 *
 * The main front wall is
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
 * Brick and siding divide the same exposed wall at world Y = 0.60 m. Their
 * meshes do not overlap, while the original whole-height logical face stays
 * on the siding part for the single opening and boundary inventory.
 * The garage front wall is Z = [-0.55, -0.30] over X = [5.75, 11.70] with the
 * `garage-front-door` void X = [6.10, 11.10], Y = [-0.30, 2.15] (the garage
 * base runs through the thickness below -0.15, 10); the closed
 * panel leaf and rails are later models, so the void is open here.
 */
import { GARAGE_OUTLINE } from "../GARAGE_OUTLINE";
import { EXTERIOR_WALL_BOTTOM } from "../EXTERIOR_WALL_BOTTOM";
import { MAIN_OUTLINE } from "../MAIN_OUTLINE";
import { PALETTE } from "../PALETTE";
import { gFront } from "../roof/gFront";
import { gableHeight } from "../roof/gableHeight";
import { rFront } from "../roof/rFront";
import { mFront } from "../roof/mFront";
import { GABLE_ENDS } from "../roof/GABLE_ENDS";
import { SPLIT_X } from "../roof/SPLIT_X";
import { ROOF_THICKNESS } from "../roof/ROOF_THICKNESS";
import { FRONT_DOOR } from "../rooms/FRONT_DOOR";
import type { IHousePart } from "../../types/IHousePart";
import { part } from "../part";
import { slopedSlab } from "../slopedSlab";
import { wallPanel } from "../wallPanel";
import { block } from "../block";
import { STOREYS } from "../STOREYS";
import { GROUND_LAYERS } from "../GROUND_LAYERS";
import { EXTERIOR_PLINTH_TOP } from "./EXTERIOR_PLINTH_TOP";
import { FRONT_WINDOWS } from "./FRONT_WINDOWS";
import { wallHead } from "./wallHead";
import { GARAGE_FRONT_DOOR } from "./GARAGE_FRONT_DOOR";

const OWNER = "envelope/front.ts";
const B = EXTERIOR_WALL_BOTTOM;
const FRONT = MAIN_OUTLINE.outer.z[1];
const INNER = FRONT - MAIN_OUTLINE.wall;
/** Bottom of the ground base reservation the wall leaves under the front door (10). */

/** Emit the front elevation walls. */
export const buildFront = (): IHousePart[] => {
  const mainTop = mFront(FRONT) - ROOF_THICKNESS;
  const rightTop = rFront(FRONT) - ROOF_THICKNESS;
  const peak = gableHeight(GABLE_ENDS.center) - ROOF_THICKNESS;
  const mainOutline = [
    { u: MAIN_OUTLINE.outer.x[0], y: EXTERIOR_PLINTH_TOP },
    { u: MAIN_OUTLINE.outer.x[1], y: EXTERIOR_PLINTH_TOP },
    { u: MAIN_OUTLINE.outer.x[1], y: rightTop },
    { u: SPLIT_X, y: rightTop },
    { u: SPLIT_X, y: mainTop },
    { u: GABLE_ENDS.b, y: mainTop },
    { u: GABLE_ENDS.center, y: peak },
    { u: GABLE_ENDS.a, y: mainTop },
  ];
  const mainHoles = [
    FRONT_WINDOWS.living,
    FRONT_WINDOWS.bedroomTwo,
    {
      id: "stair-front-window",
      from: -1.62,
      to: -0.84,
      bottom: 4.11,
      top: 5.21,
    },
    FRONT_WINDOWS.bedroomThree,
    FRONT_DOOR,
  ];
  // The door crosses the finish datum. Its lower and upper pieces are outline
  // notches, while one full opening record stays on the upper boundary host.
  const mainSiding = wallPanel({
    axis: "x",
    across: [INNER, FRONT],
    outline: [
      mainOutline[0]!,
      { u: FRONT_DOOR.from, y: EXTERIOR_PLINTH_TOP },
      { u: FRONT_DOOR.from, y: FRONT_DOOR.top },
      { u: FRONT_DOOR.to, y: FRONT_DOOR.top },
      { u: FRONT_DOOR.to, y: EXTERIOR_PLINTH_TOP },
      ...mainOutline.slice(1),
    ],
    holes: mainHoles.filter((hole) => hole.id !== FRONT_DOOR.id),
  });
  const main = {
    ...mainSiding,
    // One logical boundary keeps the original full opening and wall extent;
    // only its physical siding mesh is restricted to the upper finish band.
    face: {
      ...mainSiding.face,
      outline: mainOutline.map((point, i) =>
        i < 2 ? { ...point, y: B } : point,
      ),
      holes: mainHoles,
    },
  };
  const mainPlinth = wallPanel({
    axis: "x",
    across: [INNER, FRONT],
    outline: [
      { u: MAIN_OUTLINE.outer.x[0], y: B },
      { u: MAIN_OUTLINE.outer.x[1], y: B },
      { u: MAIN_OUTLINE.outer.x[1], y: EXTERIOR_PLINTH_TOP },
      { u: FRONT_DOOR.to, y: EXTERIOR_PLINTH_TOP },
      { u: FRONT_DOOR.to, y: FRONT_DOOR.bottom },
      { u: FRONT_DOOR.from, y: FRONT_DOOR.bottom },
      { u: FRONT_DOOR.from, y: EXTERIOR_PLINTH_TOP },
      { u: MAIN_OUTLINE.outer.x[0], y: EXTERIOR_PLINTH_TOP },
    ],
  });
  const garageTop = gFront(GARAGE_OUTLINE.outer.z[1]) - ROOF_THICKNESS;
  const garageOutline = [
    { u: GARAGE_OUTLINE.inner.x[0], y: EXTERIOR_PLINTH_TOP },
    { u: GARAGE_OUTLINE.outer.x[1], y: EXTERIOR_PLINTH_TOP },
    { u: GARAGE_OUTLINE.outer.x[1], y: garageTop },
    { u: GARAGE_OUTLINE.inner.x[0], y: garageTop },
  ];
  const garageSiding = wallPanel({
    axis: "x",
    across: [GARAGE_OUTLINE.inner.z[1], GARAGE_OUTLINE.outer.z[1]],
    outline: [
      garageOutline[0]!,
      { u: GARAGE_FRONT_DOOR.from, y: EXTERIOR_PLINTH_TOP },
      { u: GARAGE_FRONT_DOOR.from, y: GARAGE_FRONT_DOOR.top },
      { u: GARAGE_FRONT_DOOR.to, y: GARAGE_FRONT_DOOR.top },
      { u: GARAGE_FRONT_DOOR.to, y: EXTERIOR_PLINTH_TOP },
      ...garageOutline.slice(1),
    ],
  });
  const garage = {
    ...garageSiding,
    face: {
      ...garageSiding.face,
      outline: garageOutline.map((point, i) =>
        i < 2 ? { ...point, y: B } : point,
      ),
      holes: [GARAGE_FRONT_DOOR],
    },
  };
  const garagePlinth = wallPanel({
    axis: "x",
    across: [GARAGE_OUTLINE.inner.z[1], GARAGE_OUTLINE.outer.z[1]],
    outline: [
      { u: GARAGE_OUTLINE.inner.x[0], y: B },
      { u: GARAGE_OUTLINE.outer.x[1], y: B },
      { u: GARAGE_OUTLINE.outer.x[1], y: EXTERIOR_PLINTH_TOP },
      { u: GARAGE_FRONT_DOOR.to, y: EXTERIOR_PLINTH_TOP },
      { u: GARAGE_FRONT_DOOR.to, y: GARAGE_FRONT_DOOR.bottom },
      { u: GARAGE_FRONT_DOOR.from, y: GARAGE_FRONT_DOOR.bottom },
      { u: GARAGE_FRONT_DOOR.from, y: EXTERIOR_PLINTH_TOP },
      { u: GARAGE_OUTLINE.inner.x[0], y: EXTERIOR_PLINTH_TOP },
    ],
  });
  // Over the gable ends the valley Z = -(9/8)·min(X - a, b - X) crosses the wall
  // thickness: between it and the inner face the main front roof is the higher
  // surface, so its underside, not the gable's, closes the wall there
  // (roof-wall-head-junctions). Each end gets one wedge from the gable underside
  // up to the main front underside; the wedge vanishes along the valley.
  const slope =
    (gableHeight(GABLE_ENDS.center) - gableHeight(GABLE_ENDS.a)) / (GABLE_ENDS.center - GABLE_ENDS.a);
  const reach = (mFront(INNER) - gableHeight(GABLE_ENDS.a)) / slope;
  const valleyHead = (
    id: string,
    plan: { x: number; z: number }[],
  ): IHousePart =>
    part(
      id,
      OWNER,
      "wall",
      PALETTE.siding,
      slopedSlab({
        plan,
        top: (_x, z) => mFront(z) - ROOF_THICKNESS,
        floor: (x) => gableHeight(x) - ROOF_THICKNESS,
      }),
    );
  return [
    part("front-main-wall", OWNER, "wall", PALETTE.siding, main),
    {
      ...part(
        "front-main-wall-plinth",
        OWNER,
        "wall",
        PALETTE.brick,
        mainPlinth.mesh,
      ),
      pendingMapGround: "map-ground-pending",
    },
    valleyHead("front-gable-left-valley-head", [
      { x: GABLE_ENDS.a, z: FRONT },
      { x: GABLE_ENDS.a, z: INNER },
      { x: GABLE_ENDS.a + reach, z: INNER },
    ]),
    valleyHead("front-gable-right-valley-head", [
      { x: GABLE_ENDS.b, z: FRONT },
      { x: GABLE_ENDS.b - reach, z: INNER },
      { x: GABLE_ENDS.b, z: INNER },
    ]),
    wallHead({
      id: "front-main-wall-head",
      owner: OWNER,
      x: [GABLE_ENDS.b, SPLIT_X],
      z: [INNER, FRONT],
      roof: mFront,
      outerZ: FRONT,
    }),
    wallHead({
      id: "front-right-wall-head",
      owner: OWNER,
      x: [SPLIT_X, MAIN_OUTLINE.outer.x[1]],
      z: [INNER, FRONT],
      roof: rFront,
      outerZ: FRONT,
    }),
    part(
      "front-door-threshold",
      OWNER,
      "floor",
      PALETTE.structure,
      block(
        [FRONT_DOOR.from, STOREYS.groundFloor - GROUND_LAYERS.finish, INNER],
        [FRONT_DOOR.to, STOREYS.groundFloor + 0.02, FRONT],
      ),
    ),
    part("front-garage-wall", OWNER, "wall", PALETTE.siding, garage),
    {
      ...part(
        "front-garage-wall-plinth",
        OWNER,
        "wall",
        PALETTE.brick,
        garagePlinth.mesh,
      ),
      pendingMapGround: "map-ground-pending",
    },
    wallHead({
      id: "front-garage-wall-head",
      owner: OWNER,
      x: [GARAGE_OUTLINE.inner.x[0], GARAGE_OUTLINE.outer.x[1]],
      z: [GARAGE_OUTLINE.inner.z[1], GARAGE_OUTLINE.outer.z[1]],
      roof: gFront,
      outerZ: GARAGE_OUTLINE.outer.z[1],
    }),
  ];
};
