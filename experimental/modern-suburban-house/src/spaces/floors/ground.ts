/**
 * Main ground-floor support base.
 *
 * Under
 * the main building's finished inner limit X = [-5.50, 5.50],
 * Z = [-10.45, -0.25] m the base reserves 0.025 m of finish bundle below the
 * finished floor Y = 0 and a 0.15 m support base below that. The finish layer
 * belongs to each room (`rooms/shared.ts`); this owner emits the continuous
 * support base, which also runs under the stair (no floor hole on the ground).
 * Under the `front-door`, `garden-door` and `laundry-garage-door` voids the base
 * continues through the wall thickness to the front/rear outer face and the
 * shared wall's garage face (10 ground-threshold-junctions).
 * Its real bottom contact waits for the maps ground input.
 */
import { MAIN } from "../building";
import { partitionPlaneFace } from "../face-partition";
import { PALETTE } from "../palette";
import { part } from "../part";
import type { IHousePart } from "../../types/IHousePart";
import { rect, slab } from "../solids";
import { GROUND_LAYERS, STOREYS } from "../storeys";
import { FRONT_DOOR } from "../rooms/entry";
import { GARDEN_DOOR } from "../envelope/rear";
import { laundryGarageDoorBaseMesh } from "../rooms/laundry";

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
    base("main-ground-floor-base", MAIN.inner.x, MAIN.inner.z),
    base(
      "front-door-base",
      [FRONT_DOOR.from, FRONT_DOOR.to],
      [MAIN.inner.z[1], MAIN.outer.z[1]],
    ),
    base(
      "garden-door-base",
      [GARDEN_DOOR.from, GARDEN_DOOR.to],
      [MAIN.outer.z[0], MAIN.inner.z[0]],
    ),
    part(
      "laundry-garage-door-base",
      "floors/ground.ts",
      "floor",
      PALETTE.structure,
      partitionPlaneFace(laundryGarageDoorBaseMesh(), "x", MAIN.outer.x[1]).body,
    ),
  ];
};
