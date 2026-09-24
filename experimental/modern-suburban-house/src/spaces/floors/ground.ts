/**
 * Main ground-floor support base.
 *
 * Design owner: `docs/spaces/10-ground-floor.md#main-ground-floor-base`. Under
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
import { PALETTE } from "../palette";
import { type IHousePart, part, rect, slab } from "../solids";
import { GROUND_LAYERS, STOREYS } from "../storeys";

/** Emit the main ground support base. */
export const buildGroundFloor = (): IHousePart[] => {
  const top = STOREYS.groundFloor - GROUND_LAYERS.finish;
  const bottom = top - GROUND_LAYERS.base;
  const base = (id: string, x: readonly [number, number], z: readonly [number, number]): IHousePart =>
    part(id, "floors/ground.ts", "floor", PALETTE.structure, slab({ outline: rect(x, z), bottom, top }));
  return [
    base("main-ground-floor-base", MAIN.inner.x, MAIN.inner.z),
    base("front-door-base", [0.4, 1.4], [MAIN.inner.z[1], MAIN.outer.z[1]]),
    base("garden-door-base", [-1.2, 1.2], [MAIN.outer.z[0], MAIN.inner.z[0]]),
    base("laundry-garage-door-base", [MAIN.inner.x[1], MAIN.outer.x[1]], [-4.4, -3.35]),
  ];
};
