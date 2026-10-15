/**
 * Rear elevation: the main rear wall and the garage rear wall with their voids.
 *
 * The main rear wall is
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
 * Brick and siding meet at world Y = 0.60 m without duplicate wall volume;
 * the original full-height face retains the one opening inventory.
 */
import { GARAGE_OUTLINE } from "../GARAGE_OUTLINE";
import { EXTERIOR_WALL_BOTTOM } from "../EXTERIOR_WALL_BOTTOM";
import { MAIN_OUTLINE } from "../MAIN_OUTLINE";
import { PALETTE } from "../PALETTE";
import { gBack } from "../roof/gBack";
import { rBack } from "../roof/rBack";
import { mBack } from "../roof/mBack";
import { SPLIT_X } from "../roof/SPLIT_X";
import { ROOF_THICKNESS } from "../roof/ROOF_THICKNESS";
import type { IHousePart } from "../../types/IHousePart";
import { part } from "../part";
import { wallPanel } from "../wallPanel";
import { block } from "../block";
import { STOREYS } from "../STOREYS";
import { GROUND_LAYERS } from "../GROUND_LAYERS";
import { EXTERIOR_PLINTH_TOP } from "./EXTERIOR_PLINTH_TOP";
import { wallHead } from "./wallHead";
import { GARDEN_DOOR } from "./GARDEN_DOOR";
import { PRIMARY_REAR_WINDOW } from "./PRIMARY_REAR_WINDOW";
import { FAMILY_REAR_WINDOW } from "./FAMILY_REAR_WINDOW";

const OWNER = "envelope/rear.ts";
const B = EXTERIOR_WALL_BOTTOM;
const BACK = MAIN_OUTLINE.outer.z[0];
const INNER = BACK + MAIN_OUTLINE.wall;
/** Emit the rear elevation walls. */
export const buildRear = (): IHousePart[] => {
  const mainTop = mBack(BACK) - ROOF_THICKNESS;
  const rightTop = rBack(BACK) - ROOF_THICKNESS;
  const mainOutline = [
    { u: MAIN_OUTLINE.outer.x[0], y: EXTERIOR_PLINTH_TOP },
    { u: MAIN_OUTLINE.outer.x[1], y: EXTERIOR_PLINTH_TOP },
    { u: MAIN_OUTLINE.outer.x[1], y: rightTop },
    { u: SPLIT_X, y: rightTop },
    { u: SPLIT_X, y: mainTop },
    { u: MAIN_OUTLINE.outer.x[0], y: mainTop },
  ];
  const mainHoles = [
    { id: "kitchen-rear-window", from: -4.5, to: -3.3, bottom: 1.15, top: 2.3 },
    FAMILY_REAR_WINDOW,
    PRIMARY_REAR_WINDOW,
    GARDEN_DOOR,
  ];
  const mainSiding = wallPanel({
    axis: "x",
    across: [BACK, INNER],
    outline: [
      mainOutline[0]!,
      { u: GARDEN_DOOR.from, y: EXTERIOR_PLINTH_TOP },
      { u: GARDEN_DOOR.from, y: GARDEN_DOOR.top },
      { u: GARDEN_DOOR.to, y: GARDEN_DOOR.top },
      { u: GARDEN_DOOR.to, y: EXTERIOR_PLINTH_TOP },
      ...mainOutline.slice(1),
    ],
    holes: mainHoles.filter((hole) => hole.id !== GARDEN_DOOR.id),
  });
  // Keep the complete garden-door record on one logical wall host, while the
  // physical siding and brick bodies each carry their own part of its notch.
  const main = {
    ...mainSiding,
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
    across: [BACK, INNER],
    outline: [
      { u: MAIN_OUTLINE.outer.x[0], y: B },
      { u: MAIN_OUTLINE.outer.x[1], y: B },
      { u: MAIN_OUTLINE.outer.x[1], y: EXTERIOR_PLINTH_TOP },
      { u: GARDEN_DOOR.to, y: EXTERIOR_PLINTH_TOP },
      { u: GARDEN_DOOR.to, y: GARDEN_DOOR.bottom },
      { u: GARDEN_DOOR.from, y: GARDEN_DOOR.bottom },
      { u: GARDEN_DOOR.from, y: EXTERIOR_PLINTH_TOP },
      { u: MAIN_OUTLINE.outer.x[0], y: EXTERIOR_PLINTH_TOP },
    ],
  });
  const garageTop = gBack(GARAGE_OUTLINE.outer.z[0]) - ROOF_THICKNESS;
  const garage = wallPanel({
    axis: "x",
    across: [GARAGE_OUTLINE.outer.z[0], GARAGE_OUTLINE.inner.z[0]],
    outline: [
      { u: GARAGE_OUTLINE.inner.x[0], y: EXTERIOR_PLINTH_TOP },
      { u: GARAGE_OUTLINE.outer.x[1], y: EXTERIOR_PLINTH_TOP },
      { u: GARAGE_OUTLINE.outer.x[1], y: garageTop },
      { u: GARAGE_OUTLINE.inner.x[0], y: garageTop },
    ],
  });
  const garagePlinth = wallPanel({
    axis: "x",
    across: [GARAGE_OUTLINE.outer.z[0], GARAGE_OUTLINE.inner.z[0]],
    outline: [
      { u: GARAGE_OUTLINE.inner.x[0], y: B },
      { u: GARAGE_OUTLINE.outer.x[1], y: B },
      { u: GARAGE_OUTLINE.outer.x[1], y: EXTERIOR_PLINTH_TOP },
      { u: GARAGE_OUTLINE.inner.x[0], y: EXTERIOR_PLINTH_TOP },
    ],
  });
  const garageBoundary = {
    ...garage,
    face: {
      ...garage.face,
      outline: garage.face.outline.map((point, i) =>
        i < 2 ? { ...point, y: B } : point,
      ),
    },
  };
  return [
    part("rear-main-wall", OWNER, "wall", PALETTE.siding, main),
    {
      ...part(
        "rear-main-wall-plinth",
        OWNER,
        "wall",
        PALETTE.brick,
        mainPlinth.mesh,
      ),
      pendingMapGround: "map-ground-pending",
    },
    wallHead({
      id: "rear-main-wall-head",
      owner: OWNER,
      x: [MAIN_OUTLINE.outer.x[0], SPLIT_X],
      z: [BACK, INNER],
      roof: mBack,
      outerZ: BACK,
    }),
    wallHead({
      id: "rear-right-wall-head",
      owner: OWNER,
      x: [SPLIT_X, MAIN_OUTLINE.outer.x[1]],
      z: [BACK, INNER],
      roof: rBack,
      outerZ: BACK,
    }),
    part(
      "garden-door-threshold",
      OWNER,
      "floor",
      PALETTE.structure,
      block(
        [GARDEN_DOOR.from, STOREYS.groundFloor - GROUND_LAYERS.finish, BACK],
        [GARDEN_DOOR.to, STOREYS.groundFloor + 0.02, INNER],
      ),
    ),
    part("rear-garage-wall", OWNER, "wall", PALETTE.siding, garageBoundary),
    {
      ...part(
        "rear-garage-wall-plinth",
        OWNER,
        "wall",
        PALETTE.brick,
        garagePlinth.mesh,
      ),
      pendingMapGround: "map-ground-pending",
    },
    wallHead({
      id: "rear-garage-wall-head",
      owner: OWNER,
      x: [GARAGE_OUTLINE.inner.x[0], GARAGE_OUTLINE.outer.x[1]],
      z: [GARAGE_OUTLINE.outer.z[0], GARAGE_OUTLINE.inner.z[0]],
      roof: gBack,
      outerZ: GARAGE_OUTLINE.outer.z[0],
    }),
  ];
};
