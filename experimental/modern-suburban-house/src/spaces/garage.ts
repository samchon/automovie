
import { EXTERIOR_WALL_BOTTOM, GARAGE, MAIN } from "./building";
import type { IAutoMovieMesh } from "@automovie/interface";
import { partitionPlaneFace } from "./face-partition";
import { PALETTE } from "./palette";
import { GARAGE_RIDGE_Z, garageRoof } from "./roof/junctions";
import { part } from "./part";
import type { IHousePart } from "../types/IHousePart";
import { rect, slab, wallPanel } from "./solids";
import { LAUNDRY_GARAGE_DOOR } from "./rooms/laundry";
import { GARAGE_FRONT_DOOR } from "./envelope/front";
import {
  CEILING_FINISH,
  CEILING_RESERVATION,
  GROUND_LAYERS,
  STOREYS,
} from "./storeys";

const OWNER = "garage.ts";
/** Ceiling finish zone inside the 0.18 m reservation, owned by the garage interior (09). */

/** Emit the main/garage shared wall with the laundry-garage door void. */
export const buildGarageSharedWall = (): IHousePart[] => {
  const weatherLine = (z: number): number => garageRoof(z);
  const back = GARAGE.outer.z[0];
  const front = GARAGE.outer.z[1];
  const shared = wallPanel({
    axis: "z",
    across: [MAIN.inner.x[1], MAIN.outer.x[1]],
    outline: [
      { u: back, y: EXTERIOR_WALL_BOTTOM },
      { u: front, y: EXTERIOR_WALL_BOTTOM },
      { u: front, y: weatherLine(front) },
      { u: GARAGE_RIDGE_Z, y: weatherLine(GARAGE_RIDGE_Z) },
      { u: back, y: weatherLine(back) },
    ],
    holes: [LAUNDRY_GARAGE_DOOR],
  });
  return [
    part("garage-shared-wall", OWNER, "wall", PALETTE.interiorWall, shared),
  ];
};

/** One garage floor solid supplies disjoint structural and visible faces. */
export const garageFloorMesh = (): IAutoMovieMesh => slab({
  outline: [
    { x: GARAGE.inner.x[0], z: GARAGE.inner.z[0] },
    { x: GARAGE.inner.x[1], z: GARAGE.inner.z[0] },
    { x: GARAGE.inner.x[1], z: GARAGE.inner.z[1] },
    { x: GARAGE_FRONT_DOOR.to, z: GARAGE.inner.z[1] },
    { x: GARAGE_FRONT_DOOR.to, z: GARAGE.outer.z[1] },
    { x: GARAGE_FRONT_DOOR.from, z: GARAGE.outer.z[1] },
    { x: GARAGE_FRONT_DOOR.from, z: GARAGE.inner.z[1] },
    { x: GARAGE.inner.x[0], z: GARAGE.inner.z[1] },
  ],
  bottom: STOREYS.garageFloor - GROUND_LAYERS.garageBase,
  top: STOREYS.garageFloor,
});

/** Emit the garage floor support beneath its room-owned top face. */
export const buildGarageFloorBase = (): IHousePart[] => [
  part(
    "garage-floor-base",
    OWNER,
    "floor",
    PALETTE.concrete,
    partitionPlaneFace(garageFloorMesh(), "y", STOREYS.garageFloor).body,
  ),
];

/** Emit the garage ceiling base above the garage finished ceiling. */
export const buildGarageCeiling = (): IHousePart[] => [
  part(
    "garage-ceiling-base",
    OWNER,
    "ceiling",
    PALETTE.ceiling,
    slab({
      outline: rect(GARAGE.inner.x, GARAGE.inner.z),
      bottom: STOREYS.garageCeiling + CEILING_FINISH,
      top: STOREYS.garageCeiling + CEILING_RESERVATION,
    }),
  ),
];
