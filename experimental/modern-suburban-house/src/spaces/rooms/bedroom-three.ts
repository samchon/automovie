/**
 * `bedroom-three`: the upper-storey front-right child bedroom (blue-grey bedding).
 *
 * Design owner: `docs/spaces/rooms/bedroom-three.md#bedroom-three-plan`.
 * Finished inner outline (X, Z): (-0.50, -0.25), (5.50, -0.25), (5.50, -4.56),
 * (3.22, -4.56), (3.22, -2.51), (1.72, -2.51), (1.72, -3.26), (-0.50, -3.26).
 * 07 assigns this owner the door run of its partition to the arrival,
 * X = [3.07, 3.22], Z = [-4.71, -3.41] (the T corner Z = [-4.71, -4.56] with
 * the tub-bath run is this owner's junction), carrying `hall-bedroom-three-door`
 * Z = [-4.46, -3.51], Y = [3.06, 5.26] m.
 */
import { PALETTE } from "../palette";
import { FRONT_WINDOWS } from "../envelope/front-windows";
import { MAIN } from "../building";
import {
  door,
  doorFloor,
  partition,
  roomCeiling,
  roomFloor,
  type IRoomBuild,
  type IRoomSpace,
} from "./shared";
import { floorOf } from "../storeys";
import { STAIR_OPENING } from "../stair";
/** Shared void owned by this room and consumed at its floor and adjacent finish.
 * @evidence spaces/rooms/bedroom-three.md The hall-bedroom-three-door void follows the partition assigned to bedroom-three.
 * @evidenceReview spaces/rooms/bedroom-three.md #e409a4e v-141 Door declared in the 07-assigned partition owner's file: bedroom-three.ts:32-37 door(-4.46,-3.51) is the only hole of bedroom-three-arrival-partition (L92-100, across [3.07,3.22]); 07-boundary-assembly.md:36 gives bedroom-three<->upper-hall door run to bedroom-three.ts; bedroom-three.md:27 door on X=[3.07,3.22]. 'follows' = ownership, not value derivation (literal span).
 * @evidence principles/core/source-units.md#source-scope-preservation The hall-bedroom-three-door interval remains with bedroom-three while its adjacent room receives the span.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Declared once at bedroom-three.ts:32; upper-hall.ts:15 imports it and reads .from/.to for its doorFloor (upper-hall.ts:86-90); no re-typed span.
 * @evidence principles/core/source-units.md#source-substantive-completion The hall-bedroom-three-door span cuts its wall and sets floor finish limits on both sides.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Cut: holes:[DOOR_HALL_BEDROOM_THREE_DOOR] bedroom-three.ts:99. Floor limits: bedroom-three doorFloor Z from .from/.to L86-91 (X [3.145,3.22]) and upper-hall.ts:86-90 (X [3.07,3.145]); both halves reach the partition mid-plane.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Bedroom-three-plan places hall-bedroom-three-door on the arrival/bedroom wall at Z=[-4.46, -3.51], Y=[3.06, 5.26]; this export passes that Z span to the cut.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 bedroom-three.md:27 (#bedroom-three-plan) X=[3.07,3.22] arrival/bedroom wall, Z=[-4.46,-3.51], Y=[3.06,5.26]; door(...,-4.46,-3.51) head 2.2 on upper storey 3.06. v-143 B2 closed.
 */
export const DOOR_HALL_BEDROOM_THREE_DOOR = door(
  "hall-bedroom-three-door",
  "upper-storey",
  -4.46,
  -3.51,
);

const FLOOR = floorOf("upper-storey");

const BEDROOM_THREE: IRoomSpace = {
  id: "bedroom-three",
  owner: "rooms/bedroom-three.ts",
  storey: "upper-storey",
  outline: [
    { x: -0.5, z: -0.25 },
    { x: 5.5, z: -0.25 },
    { x: 5.5, z: STAIR_OPENING.back },
    { x: 3.22, z: STAIR_OPENING.back },
    { x: 3.22, z: -2.51 },
    { x: 1.72, z: -2.51 },
    { x: 1.72, z: -3.26 },
    { x: -0.5, z: -3.26 },
  ],
  floor: PALETTE.carpet,
  // bedroom-three.md#bedroom-three-furniture-use; heights above the upper floor (+3.06).
  reservations: [
    { id: "bedroom-three-front-curtain", kind: "fixture", x: [FRONT_WINDOWS.bedroomThree.from - 0.1, FRONT_WINDOWS.bedroomThree.to + 0.1], z: [MAIN.inner.z[1] - 0.12, MAIN.inner.z[1]], y: [FLOOR + 0.1, FRONT_WINDOWS.bedroomThree.top + 0.12] },
    { id: "bedroom-three-bed", kind: "furniture", x: [-0.25, 0.9], z: [-3.1, -0.95], y: [FLOOR, FLOOR + 0.95] },
    { id: "bedroom-three-nightstand", kind: "furniture", x: [1.05, 1.5], z: [-3.1, -2.65], y: [FLOOR, FLOOR + 1.05] },
    // Z from -0.85 to the front inner face (-0.25).
    { id: "bedroom-three-desk", kind: "furniture", x: [1.4, 2.55], z: [-0.85, -0.25], y: [FLOOR, FLOOR + 0.75] },
    // X from 4.90 to the right inner face (5.50).
    { id: "bedroom-three-closet", kind: "storage", x: [4.9, 5.5], z: [-2.8, -1.3], y: [FLOOR, FLOOR + 2.2] },
    { id: "bedroom-three-desk-chair-use", kind: "use", x: [1.5, 2.25], z: [-1.6, -0.85] },
    { id: "bedroom-three-closet-use", kind: "use", x: [4.3, 4.9], z: [-2.8, -1.3] },
    { id: "bedroom-three-entry-band", kind: "route", x: [3.3, 4.2], z: [-4.3, -1.6] },
    { id: "bedroom-three-cross-band", kind: "route", x: [0.9, 4.2], z: [-2.5, -1.6] },
  ],
};

/** Emit the bedroom floor and its door partition to the arrival. */
/**
 * @evidence spaces/rooms/bedroom-three.md This builder forms the blue-grey bedroom's notched upper-front outline.
 * @evidenceReview spaces/rooms/bedroom-three.md #e409a4e v-141 bedroom-three.ts:41-54 eight-point notched outline on upper-storey, front face Z=-0.25; bedroom-three.md:25 front-right upper room, blue-grey bedding L29.
 * @evidence spaces/rooms/bedroom-three.md#bedroom-three-plan Eight corners preserve the arrival notch and its hall door in one partition run.
 * @evidenceReview spaces/rooms/bedroom-three.md#bedroom-three-plan #fa9d881 v-141 8 outline points bedroom-three.ts:46-53 equal bedroom-three.md:25 corners; the door is a hole in the single partition bedroom-three-arrival-partition L92-100. 'arrival notch' is loose (body L25 calls the notch the linen reservation) but asserts no mechanism.
 * @evidence spaces/rooms/bedroom-three.md#bedroom-three-furniture-use Bed, desk, closet, chair use, and two passage bands stay within the irregular room record.
 * @evidenceReview spaces/rooms/bedroom-three.md#bedroom-three-furniture-use #8a4f34a Bedroom-three reserves the designed bed, nightstand, desk and closet with chair use X=[1.50,2.25], closet use X=[4.30,4.90], entry band X=[3.30,4.20] Z=[-4.30,-1.60] and cross band X=[0.90,4.20] Z=[-2.50,-1.60]; house.ts calls reservations.ts checkReservations for containment.
 * @evidence principles/core/source-units.md#source-scope-preservation Its hall wall ends at the assigned T corner; it does not fill the notch or author furniture meshes.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Partition along [STAIR_OPENING.guardBack=-4.71, turnZ=-3.41] L98 includes the T corner Z[-4.71,-4.56] (tub-bath's tub-bedroom-three-partition runs X[3.22,5.5] only, tub-bath.ts:106-107); parts L84-100 have no notch fill and no furniture solid.
 * @evidence principles/core/source-units.md#source-substantive-completion The room, carpet/ceiling, under-door floor share, and door-cut partition return as concrete parts.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 space BEDROOM_THREE, roomFloor (PALETTE.carpet L55), roomCeiling, doorFloor hall-bedroom-three-door, partition with hole: bedroom-three.ts:81-102.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Bedroom-three-plan gives the inward notch and one hall-bedroom-three-door; this builder keeps the L outline instead of filling its rectangular hull.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Names bedroom-three-plan with real facts: linen notch (bedroom-three.md:25 '뒤쪽 파인 부분') and one hall-bedroom-three-door (:27); host keeps the non-rectangular ring (bedroom-three.ts:45-54) rather than a hull. But the plan is an 8-corner stepped outline (Z to -3.26, notch to -2.51, right leg to -4.56), not an 'L'; the doc never calls it L and the host's own row :75 says 'Eight corners'. Loose shape word, no false mechanism.
 */
export const buildBedroomThree = (): IRoomBuild => ({
  space: BEDROOM_THREE,
  parts: [
    roomFloor(BEDROOM_THREE),
    roomCeiling(BEDROOM_THREE),
    doorFloor(
      BEDROOM_THREE,
      "hall-bedroom-three-door",
      [3.145, 3.22],
      [DOOR_HALL_BEDROOM_THREE_DOOR.from, DOOR_HALL_BEDROOM_THREE_DOOR.to],
    ),
    partition({
      id: "bedroom-three-arrival-partition",
      owner: BEDROOM_THREE.owner,
      storey: "upper-storey",
      axis: "z",
      across: [3.07, 3.22],
      along: [STAIR_OPENING.guardBack, STAIR_OPENING.turnZ],
      holes: [DOOR_HALL_BEDROOM_THREE_DOOR],
    }),
  ],
});
