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
import { partitionPlaneFace } from "../face-partition";
import { PALETTE } from "../palette";
import { part, type IHousePart } from "../solid-records";
import { rect, slab } from "../solids";
import { GROUND_LAYERS, STOREYS } from "../storeys";
import { FRONT_DOOR } from "../rooms/entry";
import { GARDEN_DOOR } from "../envelope/rear";
import { laundryGarageDoorBaseMesh } from "../rooms/laundry";

/** Emit the main ground support base. */
/**
 * @evidence spaces/10-ground-floor.md This builder emits the main-building ground support as one continuous slab plus door-base extensions.
 * @evidenceReview spaces/10-ground-floor.md #9f27f8e `buildGroundFloor` emits the uncut `MAIN.inner` base and support under three door crossings; the laundry strip lacks only its garage-facing triangles, which `buildLaundry` authors as the exposed riser.
 * @evidence spaces/10-ground-floor.md#main-ground-floor-base MAIN.inner bounds hold the base under all ground rooms and the stair without a stair hole.
 * @evidenceReview spaces/10-ground-floor.md#main-ground-floor-base #e683d18 The `main-ground-floor-base` call uses `rect(MAIN.inner.x, MAIN.inner.z)` from the shared base helper; no stair or partition opening is removed from the 0.15 m support.
 * @evidence spaces/10-ground-floor.md#ground-threshold-junctions Separate base strips pass beneath front, garden, and laundry-garage wall voids.
 * @evidenceReview spaces/10-ground-floor.md#ground-threshold-junctions #4150be7 Front and garden support strips take their openings' spans directly; the laundry strip uses `laundryGarageDoorBaseMesh` through the shared wall and retains its body after the room takes the exposed garage face.
 * @evidence principles/core/source-units.md#source-scope-preservation Room owners retain visible finishes; this builder emits only support and does not claim actual maps-ground contact.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The three `base` calls end below `groundFloor` by `GROUND_LAYERS.finish`; the fourth takes only the body of the laundry slab, leaving the riser face and other visible finish to the room without claiming map contact.
 * @evidence principles/core/source-units.md#source-substantive-completion Four supports share the same calculated bottom/top and stable ids; the laundry base leaves its garage-facing triangles to the room owner.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The local `base` helper supplies one top and bottom to the main, front and garden slabs; `laundryGarageDoorBaseMesh` uses the same ground layers and this builder returns its non-riser body as the fourth support.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Main-ground-floor-base keeps one 0.15 m support beneath MAIN.inner without a stair hole, and ground-threshold-junctions extends it under front, garden, and laundry-garage doors.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The main-floor parent fixes the uncut inner support and the threshold parent fixes three wall-crossing strips; their existing datums suffice when the laundry strip's end face is handed to the room owner.
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
    part(
      "laundry-garage-door-base",
      "floors/ground.ts",
      "floor",
      PALETTE.structure,
      partitionPlaneFace(laundryGarageDoorBaseMesh(), "x", MAIN.outer.x[1]).body,
    ),
  ];
};
