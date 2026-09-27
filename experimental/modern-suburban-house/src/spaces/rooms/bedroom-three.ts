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
 * @evidenceReview spaces/rooms/bedroom-three.md `DOOR_HALL_BEDROOM_THREE_DOOR` fixes the plan's Z = [-4.46, -3.51] opening for the bedroom-owned arrival partition at X = [3.07, 3.22].
 * @evidence principles/core/source-units.md#source-scope-preservation The hall-bedroom-three-door interval remains with bedroom-three while its adjacent room receives the span.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation This room exports the hall-door interval once; `buildUpperHall` imports its `from` and `to` for the adjacent finish strip rather than defining a second span.
 * @evidence principles/core/source-units.md#source-substantive-completion The hall-bedroom-three-door span cuts its wall and sets floor finish limits on both sides.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion `buildBedroomThree` passes this door into `bedroom-three-arrival-partition` and its X = [3.145, 3.22] floor strip; `buildUpperHall` uses the same Z span in the X = [3.07, 3.145] strip.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Bedroom-three-plan places hall-bedroom-three-door on the arrival/bedroom wall at Z=[-4.46, -3.51], Y=[3.06, 5.26]; this export passes that Z span to the cut.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work `bedroom-three-plan` locates one arrival-wall rough opening at Z = [-4.46, -3.51] and Y = [3.06, 5.26]; `door` uses that Z interval and the upper-storey floor with its 2.20 m default head.
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
 * @evidenceReview spaces/rooms/bedroom-three.md `BEDROOM_THREE` uses the plan's eight ordered front-right upper-floor corners, including the inset linen boundary, and `buildBedroomThree` returns its room and finish parts.
 * @evidence spaces/rooms/bedroom-three.md#bedroom-three-plan Eight corners preserve the linen inset and right-rear arrival floor, with its hall door in one assigned partition run.
 * @evidenceReview spaces/rooms/bedroom-three.md#bedroom-three-plan `BEDROOM_THREE.outline` retains all eight plan corners around the linen inset and right-rear entrance; the arrival partition holds the sole `DOOR_HALL_BEDROOM_THREE_DOOR` cut.
 * @evidence spaces/rooms/bedroom-three.md#bedroom-three-furniture-use Bed, desk, closet, chair use, and two passage bands stay within the irregular room record.
 * @evidenceReview spaces/rooms/bedroom-three.md#bedroom-three-furniture-use `BEDROOM_THREE.reservations` records the four furniture boxes, desk-chair and closet use, and the X = [3.30, 4.20] entry and Z = [-2.50, -1.60] cross-route bands inside the stepped room.
 * @evidence principles/core/source-units.md#source-scope-preservation Its hall wall ends at the assigned T corner; it does not fill the notch or author furniture meshes.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation `bedroom-three-arrival-partition` extends through the assigned T junction from `STAIR_OPENING.guardBack` to `turnZ`; the parts contain no linen-inset fill or furniture meshes.
 * @evidence principles/core/source-units.md#source-substantive-completion The room, carpet/ceiling, under-door floor share, and door-cut partition return as concrete parts.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion `buildBedroomThree` returns the carpeted `BEDROOM_THREE` record, floor and ceiling parts, its room-side door strip and the arrival partition with the named door hole.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Bedroom-three-plan gives the inward linen inset and one hall-bedroom-three-door; this builder keeps its eight-corner stepped outline instead of filling its rectangular hull.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work The eight `BEDROOM_THREE.outline` points retain the linen inset and entrance leg from `bedroom-three-plan`, while `bedroom-three-arrival-partition` contains only the specified hall-door hole; no rectangular hull or extra passage is added.
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
