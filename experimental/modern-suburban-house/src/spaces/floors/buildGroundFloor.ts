/**
 * Main ground-floor support base.
 *
 * Under
 * the main building's finished inner limit X = [-5.50, 5.50],
 * Z = [-10.45, -0.25] m the base reserves 0.025 m of finish bundle below the
 * finished floor Y = 0 and a 0.15 m support base below that. The finish layer
 * belongs to each room (`roomFloor`); this owner emits the continuous
 * support base, which also runs under the stair (no floor hole on the ground).
 * Under the `front-door`, `garden-door` and `laundry-garage-door` voids the base
 * continues through the wall thickness to the front/rear outer face and the
 * shared wall's garage face (10 ground-threshold-junctions).
 * Its real bottom contact waits for the maps ground input.
 */
import { MAIN_OUTLINE } from "../MAIN_OUTLINE";
import { partitionPlaneFace } from "../partitionPlaneFace";
import { PALETTE } from "../PALETTE";
import { part } from "../part";
import type { IHousePart } from "../../types/IHousePart";
import { rect } from "../rect";
import { slab } from "../slab";
import { STOREYS } from "../STOREYS";
import { GROUND_LAYERS } from "../GROUND_LAYERS";
import { FRONT_DOOR } from "../rooms/FRONT_DOOR";
import { GARDEN_DOOR } from "../envelope/GARDEN_DOOR";
import { laundryGarageDoorBaseMesh } from "../rooms/laundryGarageDoorBaseMesh";

/** Emit the main ground support base. */
export const buildGroundFloor = (): IHousePart[] => {
  const top = STOREYS.groundFloor - GROUND_LAYERS.finish;
  const bottom = top - GROUND_LAYERS.base;
  const base = (id: string, x: readonly [number, number], z: readonly [number, number]): IHousePart =>
    part(
      id,
      "floors/ground.ts",
      "floor",
      PALETTE.structure,
      slab({ outline: rect(x, z), bottom, top }),
    );
  return [
    base("main-ground-floor-base", MAIN_OUTLINE.inner.x, MAIN_OUTLINE.inner.z),
    base(
      "front-door-base",
      [FRONT_DOOR.from, FRONT_DOOR.to],
      [MAIN_OUTLINE.inner.z[1], MAIN_OUTLINE.outer.z[1]],
    ),
    base(
      "garden-door-base",
      [GARDEN_DOOR.from, GARDEN_DOOR.to],
      [MAIN_OUTLINE.outer.z[0], MAIN_OUTLINE.inner.z[0]],
    ),
    part(
      "laundry-garage-door-base",
      "floors/ground.ts",
      "floor",
      PALETTE.structure,
      partitionPlaneFace(laundryGarageDoorBaseMesh(), "x", MAIN_OUTLINE.outer.x[1]).body,
    ),
  ];
};
