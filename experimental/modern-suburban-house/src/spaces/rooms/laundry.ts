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
import { block } from "../solids";
import { part } from "../solid-records";
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
 * @evidenceReview spaces/rooms/laundry.md #6b84229 laundry.ts:113-121 service partition holes DOOR_SERVICE_LAUNDRY_DOOR; laundry.md:29 service-laundry-door rough opening Z=[-4.40,-3.35], Y=[0,2.20] in the west partition.
 * @evidence principles/core/source-units.md#source-scope-preservation The service-laundry-door interval remains with laundry while its adjacent room receives the span.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Defined laundry.ts:32-37; service.ts:13 imports it and service.ts:61-65 reads from/to for the service doorFloor share.
 * @evidence principles/core/source-units.md#source-substantive-completion The service-laundry-door span cuts its wall and sets floor finish limits on both sides.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Hole laundry.ts:120; floor shares laundry X=[3.145,3.22] laundry.ts:107-112 and service X=[3.07,3.145] service.ts:61-65.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Laundry-plan gives service-laundry-door the west partition's Z=[-4.40, -3.35], Y=[0, 2.20] cut, distinct from the east garage door; this export carries the west span.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 laundry.md:29 (#laundry-plan) west partition / east shared wall, Z=[-4.40,-3.35], Y=[0,2.20]; 두 문을 같은 connector로 합치지 않는다.
 */
export const DOOR_SERVICE_LAUNDRY_DOOR = door(
  "service-laundry-door",
  "ground-storey",
  -4.4,
  -3.35,
);

const FLOOR = floorOf("ground-storey");
const MACHINE_BACK_Z = -3.35;
const MACHINE_WIDTH_Z = 0.65;
const WASHER_Z = [MACHINE_BACK_Z, MACHINE_BACK_Z + MACHINE_WIDTH_Z] as const;
const DRYER_Z = [WASHER_Z[1], WASHER_Z[1] + MACHINE_WIDTH_Z] as const;
const MACHINE_BAND_Z = [WASHER_Z[0], DRYER_Z[1]] as const;
/** Laundry owns the passage through the main/garage shared wall. */
/**
 * @evidence spaces/rooms/laundry.md The mudroom owns the only interior passage into the attached garage.
 * @evidenceReview spaces/rooms/laundry.md #6b84229 LAUNDRY_GARAGE_DOOR is the only hole in garage-shared-wall (garage.ts:50-61); laundry.md:31 '집과 차고 사이의 유일한 내부 경로', service.md:31 '차고에 가는 유일한 내부 경로는 머드룸을 통한다'.
 * @evidence spaces/rooms/laundry.md#laundry-plan The -4.40..-3.35 m Z void spans the shared wall and preserves the garage's lower floor step.
 * @evidenceReview spaces/rooms/laundry.md#laundry-plan #47360be from/to -4.4/-3.35 (laundry.ts:55-56) is the shared-wall hole across X=[5.5,5.75] (garage.ts:50-61); laundry.md:29 Z=[-4.40,-3.35] on the east shared wall and the 0.15 m garage step; threshold top at FLOOR (laundry.ts:128-129) above garage floor -0.15.
 * @evidence principles/core/source-units.md#source-scope-preservation The garage wall receives this cut from laundry rather than declaring another door.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 garage.ts:26 imports LAUNDRY_GARAGE_DOOR and garage.ts:60 holes:[LAUNDRY_GARAGE_DOOR]; the garage declares no door of its own there.
 * @evidence principles/core/source-units.md#source-substantive-completion The shared wall hole, ground base tongue, and laundry threshold use this interval.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f garage.ts:60 shared-wall hole; floors/ground.ts:55-59 laundry-garage-door-base Z from/to; laundry.ts:122-131 laundry-garage-threshold Z from/to.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Laundry-plan places laundry-garage-door through the shared wall at Z=-4.40..-3.35 m and preserves the garage's lower floor step; this export carries that one mudroom passage.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Names laundry-plan: laundry.md:29 laundry-garage-door in the east shared wall Z=[-4.40,-3.35], '차고 쪽 0.15 m 단차는 기존 문턱 datum을 받는다'; export laundry.ts:53-59 is the single passage (garage.ts:60). v141 MINOR authority fixed.
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
    // machine centres derive from the rear edge, half-width, and one-width spacing; fronts face -X.
    { id: "laundry-washer", kind: "fixture", x: [4.75, 5.5], z: WASHER_Z, y: [FLOOR, FLOOR + 0.88] },
    { id: "laundry-dryer", kind: "fixture", x: [4.75, 5.5], z: DRYER_Z, y: [FLOOR, FLOOR + 0.88] },
    // Folding top at 0.94 over the same band; its underside cannot go below the 0.88 machine limit.
    { id: "laundry-folding-top", kind: "fixture", x: [4.75, 5.5], z: MACHINE_BAND_Z, y: [FLOOR + 0.88, FLOOR + 0.94] },
    { id: "laundry-upper-storage", kind: "storage", x: [5.2, 5.5], z: MACHINE_BAND_Z, y: [FLOOR + 1.5, FLOOR + 2.3] },
    // Round doors open at most 0.50 m -X from the front X = 4.75, within each machine's width.
    { id: "laundry-washer-door", kind: "swing", x: [4.25, 4.75], z: WASHER_Z },
    { id: "laundry-dryer-door", kind: "swing", x: [4.25, 4.75], z: DRYER_Z },
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
 * @evidenceReview spaces/rooms/laundry.md #6b84229 v-141 laundry.ts:97-136 room X[3.22,5.5] Z[-4.55,-2.05] between the service partition and the garage shared wall; laundry.md:27.
 * @evidence spaces/rooms/laundry.md#laundry-plan It emits service/pantry partitions and a finish threshold across the garage shared-wall void.
 * @evidenceReview spaces/rooms/laundry.md#laundry-plan #47360be v-141 laundry-service-partition L108-116, laundry-pantry-partition L127-134, laundry-garage-threshold X[5.5,5.75] Y[-0.025,0] over the Z span L117-126; laundry.md:35 gives threshold top/riser to this owner.
 * @evidence spaces/rooms/laundry.md#laundry-equipment-use Two machine boxes, folding top, upper storage, shoe bench, hooks, and their work areas remain separately reserved.
 * @evidenceReview spaces/rooms/laundry.md#laundry-equipment-use #fd0c2d5 v-141 washer, dryer (0.65 each, h0.88), folding top 0.88-0.94, upper storage X[5.2,5.5] 1.5-2.3, door swings 0.50, work zones, shoe bench, hooks 1.10-1.85, shoe use L65-78 = laundry.md:61-67.
 * @evidence spaces/rooms/laundry.md#laundry-through-route The upper waiting, lower garage-side waiting, and through-route retain the 0.15 m level change.
 * @evidenceReview spaces/rooms/laundry.md#laundry-through-route #d457f0c v-141 upper waiting X[4.45,5.5] (laundry floor 0) L80, lower waiting space 'garage' X[5.75,6.8] (garage levels -0.15) L82, through-route Z[-4.32,-3.42] L83 = laundry.md:33,97,99; step kept by garage levels + threshold.
 * @evidence principles/core/source-units.md#source-scope-preservation The shared-wall void stays with garage.ts; this builder owns its room finish and higher threshold only.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 The cut is garage.ts:60, but the void itself is laundry's export (laundry.ts:48; row 516 says garage 'receives this cut from laundry'); and 'owns its room finish and higher threshold only' omits the two partitions buildLaundry emits (L108-116, L127-134). At the passage the mechanism holds.
 * @evidence principles/core/source-units.md#source-substantive-completion The room, floor, ceiling, door strip, two walls, and solid garage threshold are returned with stable ids.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 space + parts L100-134: floor, ceiling, doorFloor, service partition, laundry-garage-threshold block, pantry partition.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Laundry-plan fixes service-laundry-door and laundry-garage-door, laundry-equipment-use assigns two machine bands, and laundry-through-route keeps the 0.15 m step to garage; buildLaundry returns those owners.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 laundry.md:29 fixes both doors. laundry-equipment-use :61 gives one closed machine band (X 4.75 to the right face, Z -3.35 to the front face) holding two machines, not 'two machine bands'. laundry-through-route :99 keeps '기존 한 단의 높이' by link; the 0.15 m value is in sibling laundry-plan :29. Host laundry.ts:70-88,122-131 has these reservations. Loose count plus sibling value.
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
