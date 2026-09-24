/**
 * Main ground-floor support base.
 *
 * Design owner: `docs/spaces/10-ground-floor.md#main-ground-floor-base`. Under
 * the main building's finished inner limit X = [-5.50, 5.50],
 * Z = [-10.45, -0.25] m the base reserves 0.025 m of finish bundle below the
 * finished floor Y = 0 and a 0.15 m support base below that. The finish layer
 * belongs to each room (`rooms/shared.ts`); this owner emits the continuous
 * support base, which also runs under the stair (no floor hole on the ground).
 * Its real bottom contact waits for the maps ground input.
 */
import { MAIN } from "../building";
import { PALETTE } from "../palette";
import { type IHousePart, part, rect, slab } from "../solids";
import { GROUND_LAYERS, STOREYS } from "../storeys";

/** Emit the main ground support base. */
export const buildGroundFloor = (): IHousePart[] => {
  const top = STOREYS.groundFloor - GROUND_LAYERS.finish;
  return [
    part("main-ground-floor-base", "floors/ground.ts", "floor", PALETTE.structure, slab({ outline: rect(MAIN.inner.x, MAIN.inner.z), bottom: top - GROUND_LAYERS.base, top })),
  ];
};
