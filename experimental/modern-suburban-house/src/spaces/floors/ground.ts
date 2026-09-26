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
import { part, rect, slab, type IHousePart } from "../solids";
import { GROUND_LAYERS, STOREYS } from "../storeys";
import { FRONT_DOOR } from "../rooms/entry";
import { GARDEN_DOOR } from "../envelope/rear";
import { LAUNDRY_GARAGE_DOOR } from "../rooms/laundry";

/** Emit the main ground support base. */
/**
 * @evidence spaces/10-ground-floor.md This builder emits the main-building ground support as one continuous slab plus door-base extensions.
 * @evidence spaces/10-ground-floor.md#main-ground-floor-base MAIN.inner bounds hold the base under all ground rooms and the stair without a stair hole.
 * @evidence spaces/10-ground-floor.md#ground-threshold-junctions Separate base strips pass beneath front, garden, and laundry-garage wall voids.
 * @evidence principles/core/source-units.md#source-scope-preservation Room owners retain visible finishes; this builder emits only support and does not claim actual maps-ground contact.
 * @evidence principles/core/source-units.md#source-substantive-completion Four slabs share the same calculated bottom/top and stable ids, so no threshold floats over an empty base.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The ground-floor parent fixes base depth and three door crossings; implementation needed no second ground slab.
 */
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
    base(
      "laundry-garage-door-base",
      [MAIN.inner.x[1], MAIN.outer.x[1]],
      [LAUNDRY_GARAGE_DOOR.from, LAUNDRY_GARAGE_DOOR.to],
    ),
  ];
};
