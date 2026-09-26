/**
 * `primary-bedroom`: the upper-storey rear-left bedroom.
 *
 * Design owner: `docs/spaces/rooms/primary.md#primary-plan`. Finished inner
 * area is the back body X = [-5.50, 0.75], Z = [-10.45, -6.06] m joined with the
 * left part X = [-5.50, -3.35], Z = [-6.06, -4.71] m. 07 assigns this owner its
 * partitions to bedroom-two (Z = [-4.71, -4.56]) and to the upper hall
 * (X = [-3.35, -3.20] and Z = [-6.06, -5.91], the latter carrying
 * `hall-primary-door` X = [-2.70, -1.70], Y = [3.06, 5.26] m).
 */
import { DOOR_PRIMARY_WARDROBE_DOOR } from "./wardrobe";
import { PALETTE } from "../palette";
import { PRIMARY_REAR_WINDOW } from "../envelope/rear";
import { PRIMARY_LEFT_WINDOW } from "../envelope/left";
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
 * @evidence spaces/rooms/primary.md The hall-primary-door void follows the partition assigned to primary.
 * @evidence principles/core/source-units.md#source-scope-preservation The hall-primary-door interval remains with primary while its adjacent room receives the span.
 * @evidence principles/core/source-units.md#source-substantive-completion The hall-primary-door span cuts its wall and sets floor finish limits on both sides.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The hall-primary-door width and position are fixed by the primary design.
 */
export const DOOR_HALL_PRIMARY_DOOR = door(
  "hall-primary-door",
  "upper-storey",
  -2.7,
  -1.7,
);

const FLOOR = floorOf("upper-storey");

const PRIMARY: IRoomSpace = {
  id: "primary-bedroom",
  owner: "rooms/primary.ts",
  storey: "upper-storey",
  outline: [
    { x: -5.5, z: STAIR_OPENING.guardBack },
    { x: -3.35, z: STAIR_OPENING.guardBack },
    { x: -3.35, z: -6.06 },
    { x: 0.75, z: -6.06 },
    { x: 0.75, z: -10.45 },
    { x: -5.5, z: -10.45 },
  ],
  floor: PALETTE.carpet,
  // primary.md#primary-furniture-use; heights are above the upper floor (+3.06).
  reservations: [
    { id: "primary-bedroom-bed", kind: "furniture", x: [-1.5, 0.65], z: [-8.65, -7.05], y: [FLOOR, FLOOR + 1] },
    { id: "primary-bedroom-rear-nightstand", kind: "furniture", x: [0.15, 0.65], z: [-9.15, -8.65], y: [FLOOR, FLOOR + 1.1] },
    { id: "primary-bedroom-front-nightstand", kind: "furniture", x: [0.15, 0.65], z: [-7.05, -6.55], y: [FLOOR, FLOOR + 1.1] },
    // X from the left inner face (-5.50) to -5.00.
    { id: "primary-bedroom-dresser", kind: "furniture", x: [-5.5, -5.0], z: [-6.5, -5.1], y: [FLOOR, FLOOR + 0.8] },
    { id: "primary-rear-curtain", kind: "fixture", x: [PRIMARY_REAR_WINDOW.from - 0.1, PRIMARY_REAR_WINDOW.to + 0.1], z: [MAIN.inner.z[0], MAIN.inner.z[0] + 0.12], y: [PRIMARY_REAR_WINDOW.bottom - 0.75, PRIMARY_REAR_WINDOW.top + 0.12] },
    { id: "primary-left-curtain", kind: "fixture", x: [MAIN.inner.x[0], MAIN.inner.x[0] + 0.12], z: [PRIMARY_LEFT_WINDOW.from - 0.1, PRIMARY_LEFT_WINDOW.to + 0.1], y: [PRIMARY_LEFT_WINDOW.bottom - 0.75, PRIMARY_LEFT_WINDOW.top + 0.12] },
    // Drawers pull +X at most 0.40 from the dresser front -5.00.
    { id: "primary-bedroom-dresser-drawers", kind: "swing", x: [-5.0, -4.6], z: [-6.5, -5.1] },
    { id: "primary-bedroom-dresser-use", kind: "use", x: [-4.6, -4.0], z: [-6.5, -5.1] },
    { id: "primary-bedroom-wardrobe-door-swing", kind: "swing", x: [-0.25, 0.75], z: [-10.2, -9.2] },
    { id: "primary-bedroom-wardrobe-door-wait", kind: "use", x: [-0.55, 0.75], z: [-10.2, -9.2] },
  ],
};

/** Emit the primary bedroom floor and its three partition runs. */
/**
 * @evidence spaces/rooms/primary.md This builder owns the L-shaped upper rear-left primary bedroom.
 * @evidence spaces/rooms/primary.md#primary-plan The hall door, bedroom-two boundary, and wardrobe threshold stay on the room's allocated partition edges.
 * @evidence spaces/rooms/primary.md#primary-furniture-use Bed, two nightstands, dresser/drawer use, and wardrobe-door waiting occupy separate reservations.
 * @evidence principles/core/source-units.md#source-scope-preservation The function emits its carpet finishes and three walls, not the bed or wardrobe storage meshes.
 * @evidence principles/core/source-units.md#source-substantive-completion It returns the room record, two finish planes, two door-floor shares, and the three partition runs.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The primary parent fixes its L outline and both door contacts, so source added no bedroom shortcut or furniture location.
 */
export const buildPrimary = (): IRoomBuild => ({
  space: PRIMARY,
  parts: [
    roomFloor(PRIMARY),
    roomCeiling(PRIMARY),
    doorFloor(
      PRIMARY,
      "hall-primary-door",
      [DOOR_HALL_PRIMARY_DOOR.from, DOOR_HALL_PRIMARY_DOOR.to],
      [-6.06, -5.985],
    ),
    doorFloor(
      PRIMARY,
      "primary-wardrobe-door",
      [0.75, 0.825],
      [DOOR_PRIMARY_WARDROBE_DOOR.from, DOOR_PRIMARY_WARDROBE_DOOR.to],
    ),
    partition({
      id: "primary-bedroom-two-partition",
      owner: PRIMARY.owner,
      storey: "upper-storey",
      axis: "x",
      across: [STAIR_OPENING.guardBack, STAIR_OPENING.back],
      along: [-5.5, -3.35],
    }),
    partition({
      id: "primary-hall-side-partition",
      owner: PRIMARY.owner,
      storey: "upper-storey",
      axis: "z",
      across: [-3.35, -3.2],
      along: [-5.91, STAIR_OPENING.guardBack],
    }),
    partition({
      id: "primary-hall-partition",
      owner: PRIMARY.owner,
      storey: "upper-storey",
      axis: "x",
      across: [-6.06, -5.91],
      along: [-3.35, 0.9],
      holes: [DOOR_HALL_PRIMARY_DOOR],
    }),
  ],
});
