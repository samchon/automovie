/**
 * `laundry-mudroom`: the buffer room between the service band and the garage.
 *
 * Design owner: `docs/spaces/rooms/laundry.md#laundry-plan`. Finished inner
 * X = [3.22, 5.50], Z = [-4.55, -2.05] m. 07 assigns this owner its partitions
 * to service-access (X = [3.07, 3.22], carrying `service-laundry-door`
 * Z = [-4.40, -3.35], Y = [0, 2.20] m) and to the pantry (Z = [-4.70, -4.55]).
 * The `laundry-garage-door` void in the shared wall is cut by `garage.ts`; this
 * owner fills its finish zone X = [5.50, 5.75], Y = [-0.025, 0] as
 * `laundry-garage-threshold`, whose garage face with the main ground base end
 * below it is the one riser from the garage floor Y = -0.15 to Y = 0 (10).
 */
import { PALETTE } from "../palette";
import { block, part } from "../solids";
import {
  box,
  door,
  doorFloor,
  partition,
  roomCeiling,
  roomFloor,
  type IRoomBuild,
  type IRoomSpace,
} from "./shared";
import { floorOf, GROUND_LAYERS } from "../storeys";
/** Shared void owned by this room and consumed at its floor and adjacent finish.
 * @evidence spaces/rooms/laundry.md The service-laundry-door void follows the partition assigned to laundry.
 * @evidence principles/core/source-units.md#source-scope-preservation The service-laundry-door interval remains with laundry while its adjacent room receives the span.
 * @evidence principles/core/source-units.md#source-substantive-completion The service-laundry-door span cuts its wall and sets floor finish limits on both sides.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The service-laundry-door width and position are fixed by the laundry design.
 */
export const DOOR_SERVICE_LAUNDRY_DOOR = door(
  "service-laundry-door",
  "ground-storey",
  -4.4,
  -3.35,
);

const FLOOR = floorOf("ground-storey");
/** Laundry owns the passage through the main/garage shared wall. */
/**
 * @evidence spaces/rooms/laundry.md The mudroom owns the only interior passage into the attached garage.
 * @evidence spaces/rooms/laundry.md#laundry-plan The -4.40..-3.35 m Z void spans the shared wall and preserves the garage's lower floor step.
 * @evidence principles/core/source-units.md#source-scope-preservation The garage wall receives this cut from laundry rather than declaring another door.
 * @evidence principles/core/source-units.md#source-substantive-completion The shared wall hole, ground base tongue, and laundry threshold use this interval.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The service-band plan already places the garage access directly in the mudroom.
 */
export const LAUNDRY_GARAGE_DOOR = {
  id: "laundry-garage-door",
  from: -4.4,
  to: -3.35,
  bottom: FLOOR - GROUND_LAYERS.finish - GROUND_LAYERS.base,
  top: FLOOR + 2.2,
} as const;

const LAUNDRY: IRoomSpace = {
  id: "laundry-mudroom",
  owner: "rooms/laundry.ts",
  storey: "ground-storey",
  outline: box([3.22, 5.5], [-4.55, -2.05]),
  floor: PALETTE.utility,
  reservations: [
    // laundry-equipment-use: machine band X = [4.75, 5.50], Z = [-3.35, -2.05]; two 0.65 x 0.75 x 0.88
    // machines centred at Z = -3.025 (washer, rear) and -2.375 (dryer, front), fronts facing -X.
    { id: "laundry-washer", kind: "fixture", x: [4.75, 5.5], z: [-3.35, -2.7], y: [FLOOR, FLOOR + 0.88] },
    { id: "laundry-dryer", kind: "fixture", x: [4.75, 5.5], z: [-2.7, -2.05], y: [FLOOR, FLOOR + 0.88] },
    // Folding top at 0.94 over the same band; its underside cannot go below the 0.88 machine limit.
    { id: "laundry-folding-top", kind: "fixture", x: [4.75, 5.5], z: [-3.35, -2.05], y: [FLOOR + 0.88, FLOOR + 0.94] },
    { id: "laundry-upper-storage", kind: "storage", x: [5.2, 5.5], z: [-3.35, -2.05], y: [FLOOR + 1.5, FLOOR + 2.3] },
    // Round doors open at most 0.50 m -X from the front X = 4.75, within each machine's width.
    { id: "laundry-washer-door", kind: "swing", x: [4.25, 4.75], z: [-3.35, -2.7] },
    { id: "laundry-dryer-door", kind: "swing", x: [4.25, 4.75], z: [-2.7, -2.05] },
    { id: "laundry-washer-work", kind: "use", x: [3.8, 4.25], z: [-3.35, -2.6] },
    { id: "laundry-dryer-work", kind: "use", x: [3.8, 4.25], z: [-2.8, -2.05] },
    // Shoe bench from the left inner face to X = 3.62, Z = -2.85 to the front inner face; hooks over it.
    { id: "laundry-shoe-bench", kind: "furniture", x: [3.22, 3.62], z: [-2.85, -2.05], y: [FLOOR, FLOOR + 0.45] },
    { id: "laundry-coat-hooks", kind: "storage", x: [3.22, 3.62], z: [-2.85, -2.05], y: [FLOOR + 1.1, FLOOR + 1.85] },
    { id: "laundry-shoe-use", kind: "use", x: [3.62, 4.25], z: [-2.85, -2.05] },
    // laundry-plan upper (mudroom) waiting zone and laundry-through-route.
    { id: "laundry-upper-waiting", kind: "use", x: [4.45, 5.5], z: [-4.43, -3.38] },
    // laundry-plan decides the garage-side lower waiting too; it lies on the garage floor.
    { id: "laundry-garage-lower-waiting", kind: "use", space: "garage", x: [5.75, 6.8], z: [-4.43, -3.38] },
    { id: "laundry-through-route", kind: "route", x: [3.22, 5.5], z: [-4.32, -3.42] },
  ],
};

/** Emit the laundry finishes, its share under service-laundry-door, the garage threshold and its two partitions. */
/**
 * @evidence spaces/rooms/laundry.md This export builds the laundry-mudroom between service access and the lower garage.
 * @evidence spaces/rooms/laundry.md#laundry-plan It emits service/pantry partitions and a finish threshold across the garage shared-wall void.
 * @evidence spaces/rooms/laundry.md#laundry-equipment-use Two machine boxes, folding top, upper storage, shoe bench, hooks, and their work areas remain separately reserved.
 * @evidence spaces/rooms/laundry.md#laundry-through-route The upper waiting, lower garage-side waiting, and through-route retain the 0.15 m level change.
 * @evidence principles/core/source-units.md#source-scope-preservation The shared-wall void stays with garage.ts; this builder owns its room finish and higher threshold only.
 * @evidence principles/core/source-units.md#source-substantive-completion The room, floor, ceiling, door strip, two walls, and solid garage threshold are returned with stable ids.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The laundry parent supplies both doors, machine use, and the garage step; source required no invented third route.
 */
export const buildLaundry = (): IRoomBuild => ({
  space: LAUNDRY,
  parts: [
    roomFloor(LAUNDRY),
    roomCeiling(LAUNDRY),
    doorFloor(
      LAUNDRY,
      "service-laundry-door",
      [3.145, 3.22],
      [DOOR_SERVICE_LAUNDRY_DOOR.from, DOOR_SERVICE_LAUNDRY_DOOR.to],
    ),
    partition({
      id: "laundry-service-partition",
      owner: LAUNDRY.owner,
      storey: "ground-storey",
      axis: "z",
      across: [3.07, 3.22],
      along: [-4.7, -1.9],
      holes: [DOOR_SERVICE_LAUNDRY_DOOR],
    }),
    part(
      "laundry-garage-threshold",
      LAUNDRY.owner,
      "floor",
      PALETTE.utility,
      block(
        [5.5, FLOOR - 0.025, LAUNDRY_GARAGE_DOOR.from],
        [5.75, FLOOR, LAUNDRY_GARAGE_DOOR.to],
      ),
    ),
    partition({
      id: "laundry-pantry-partition",
      owner: LAUNDRY.owner,
      storey: "ground-storey",
      axis: "x",
      across: [-4.7, -4.55],
      along: [3.22, 5.5],
    }),
  ],
});
