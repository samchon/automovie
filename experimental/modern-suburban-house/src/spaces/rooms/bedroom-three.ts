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
/** Shared void owned by this room and consumed at its floor and adjacent finish.
 * @evidence spaces/rooms/bedroom-three.md The hall-bedroom-three-door void follows the partition assigned to bedroom-three.
 * @evidence principles/core/source-units.md#source-scope-preservation The hall-bedroom-three-door interval remains with bedroom-three while its adjacent room receives the span.
 * @evidence principles/core/source-units.md#source-substantive-completion The hall-bedroom-three-door span cuts its wall and sets floor finish limits on both sides.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The hall-bedroom-three-door width and position are fixed by the bedroom-three design.
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
    { x: 5.5, z: -4.56 },
    { x: 3.22, z: -4.56 },
    { x: 3.22, z: -2.51 },
    { x: 1.72, z: -2.51 },
    { x: 1.72, z: -3.26 },
    { x: -0.5, z: -3.26 },
  ],
  floor: PALETTE.carpet,
  // bedroom-three.md#bedroom-three-furniture-use; heights above the upper floor (+3.06).
  reservations: [
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
 * @evidence spaces/rooms/bedroom-three.md#bedroom-three-plan Eight corners preserve the arrival notch and its hall door in one partition run.
 * @evidence spaces/rooms/bedroom-three.md#bedroom-three-furniture-use Bed, desk, closet, chair use, and two passage bands stay within the irregular room record.
 * @evidence principles/core/source-units.md#source-scope-preservation Its hall wall ends at the assigned T corner; it does not fill the notch or author furniture meshes.
 * @evidence principles/core/source-units.md#source-substantive-completion The room, carpet/ceiling, under-door floor share, and door-cut partition return as concrete parts.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The parent fixes all notch corners and the hall door, so source needed no rectangular hull shortcut.
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
      along: [-4.71, -3.41],
      holes: [DOOR_HALL_BEDROOM_THREE_DOOR],
    }),
  ],
});
