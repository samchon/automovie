/**
 * `living-room`: the ground-storey front-left room.
 *
 * Design owner: `docs/spaces/rooms/living.md#living-plan`. Finished inner
 * X = [-5.50, -1.95], Z = [-6.05, -0.25] m. 07 assigns this owner the partition
 * body X = [-1.95, -1.80] on the entry side and on the service side outside
 * the stair (the stair's own wall between them belongs to `stair.ts`). The
 * `entry-living-door` void is Z = [-1.35, -0.35], Y = [0, 2.20] m in that wall.
 *
 * Output: the room record, its wood floor finish and its two partition runs.
 */
import { DOOR_LIVING_COMMON_OPENING } from "./common";
import { PALETTE } from "../palette";
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
import { floorOf } from "../storeys";
/** Shared void owned by this room and consumed at its floor and adjacent finish.
 * @evidence spaces/rooms/living.md The entry-living-door void follows the partition assigned to living.
 * @evidence principles/core/source-units.md#source-scope-preservation The entry-living-door interval remains with living while its adjacent room receives the span.
 * @evidence principles/core/source-units.md#source-substantive-completion The entry-living-door span cuts its wall and sets floor finish limits on both sides.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The entry-living-door width and position are fixed by the living design.
 */
export const DOOR_ENTRY_LIVING_DOOR = door(
  "entry-living-door",
  "ground-storey",
  -1.35,
  -0.35,
);

const FLOOR = floorOf("ground-storey");

const LIVING: IRoomSpace = {
  id: "living-room",
  owner: "rooms/living.ts",
  storey: "ground-storey",
  outline: box([-5.5, -1.95], [-6.05, -0.25]),
  floor: PALETTE.woodFloor,
  reservations: [
    // living-plan: no furniture on the floor in front of entry-living-door.
    { id: "living-door-swing", kind: "swing", x: [-2.89, -1.95], z: [-1.4, -0.35] },
    // living-furniture-use.
    { id: "living-sofa", kind: "furniture", x: [-2.9, -1.95], z: [-3.75, -1.65], y: [FLOOR, FLOOR + 0.9] },
    { id: "living-table", kind: "furniture", x: [-3.95, -3.45], z: [-3.3, -2.0], y: [FLOOR, FLOOR + 0.42] },
    { id: "living-reading-chair", kind: "furniture", x: [-3.9, -3.05], z: [-5.65, -4.8], y: [FLOOR, FLOOR + 0.9] },
    { id: "living-bookcase", kind: "storage", x: [-2.3, -1.95], z: [-5.9, -4.9], y: [FLOOR, FLOOR + 1.9] },
    { id: "living-rug", kind: "covering", x: [-4.0, -2.0], z: [-3.9, -1.55], y: [FLOOR, FLOOR + 0.008] },
    { id: "living-sofa-use", kind: "use", x: [-3.45, -2.9], z: [-3.6, -1.8] },
    { id: "living-chair-use", kind: "use", x: [-3.9, -3.05], z: [-4.8, -4.2] },
    { id: "living-bookcase-use", kind: "use", x: [-2.9, -2.3], z: [-5.8, -5.0] },
    // living-through-route. The front floor's X runs from the main band's
    // left edge to the door-front zone, the two plans the text joins.
    { id: "living-main-route", kind: "route", x: [-4.9, -4.0], z: [-6.05, -1.45] },
    // living-through-route: the bookcase is reached across the floor behind the sofa,
    // Z = [-4.65, -3.75], from the main band (X = -4.00) to the bookcase use zone (X = -2.30).
    { id: "living-bookcase-cross-route", kind: "route", x: [-4.0, -2.3], z: [-4.65, -3.75] },
    { id: "living-front-route", kind: "route", x: [-4.9, -2.89], z: [-1.45, -0.45] },
  ],
};

/** Emit the living floor and the partitions 07 gives this owner. */
/**
 * @evidence spaces/rooms/living.md This export builds the front-left living room and its two assigned partition runs.
 * @evidence spaces/rooms/living.md#living-plan The room box and entry-door void align with the partition on X=[-1.95,-1.80].
 * @evidence spaces/rooms/living.md#living-furniture-use Sofa, table, reading chair, bookcase, rug, and their use rectangles are reserved in LIVING.
 * @evidence spaces/rooms/living.md#living-through-route Front, main, and bookcase-cross route bands occupy the authored floor around the furniture boxes.
 * @evidence principles/core/source-units.md#source-scope-preservation It leaves furniture meshes to models and the stair's intervening wall to the stair owner.
 * @evidence principles/core/source-units.md#source-substantive-completion Floor, ceiling, both threshold halves, and the door-cut entry partition are returned with the room record.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The living parent fixes room limits, two exits, furniture reservations, and passage bands; implementation added no hidden shortcut.
 */
export const buildLiving = (): IRoomBuild => ({
  space: LIVING,
  parts: [
    roomFloor(LIVING),
    roomCeiling(LIVING),
    doorFloor(
      LIVING,
      "entry-living-door",
      [-1.95, -1.875],
      [DOOR_ENTRY_LIVING_DOOR.from, DOOR_ENTRY_LIVING_DOOR.to],
    ),
    doorFloor(
      LIVING,
      "living-common-opening",
      [DOOR_LIVING_COMMON_OPENING.from, DOOR_LIVING_COMMON_OPENING.to],
      [-6.125, -6.05],
    ),
    partition({
      id: "living-entry-partition",
      owner: LIVING.owner,
      storey: "ground-storey",
      axis: "z",
      across: [-1.95, -1.8],
      along: [-1.45, -0.25],
      holes: [DOOR_ENTRY_LIVING_DOOR],
    }),
    partition({
      id: "living-service-partition",
      owner: LIVING.owner,
      storey: "ground-storey",
      axis: "z",
      across: [-1.95, -1.8],
      along: [-6.05, -4.71],
    }),
  ],
});
