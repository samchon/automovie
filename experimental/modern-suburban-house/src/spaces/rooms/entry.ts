/**
 * `front-entry`: the ground-storey L-shaped distribution space and its coat closet.
 *
 * Design owner: `docs/spaces/rooms/entry.md` (`entry-plan`,
 * `entry-coat-storage`). Finished inner outline (X, Z): (-1.80, -0.25),
 * (2.02, -0.25), (2.02, -3.41), (-0.50, -3.41), (-0.50, -1.45), (-1.80, -1.45);
 * it includes the stair's lower waiting area X = [-1.80, -0.65],
 * Z = [-1.45, -0.25]. The front door void belongs to the front wall and is cut
 * by `envelope/front.ts`; no partition is assigned to this owner by 07.
 *
 * The coat closet body X = [1.10, 1.75], Z = [-4.56, -3.51], Y = [0, 2.15]
 * stays hollow under the upper flight, whose underside above it and whose
 * X = [1.87, 2.02] closure geometry belongs to `stair.ts`; this room exports
 * the closet body, top, and opening span that the closure consumes. This
 * owner emits the closet's own walls inside the stair plan: the back end
 * X = [1.03, 1.10] closing it against the solid under-stair at the upper
 * flight's seventh tread, and the side Z = [-3.51, -3.41] at the flight's front
 * line, both up to the closet top. X = [1.75, 2.02] stays an open reveal. The
 * rod, shelves and sliding leaves are later models.
 *
 * Output: the room record, its wood floor finish and the closet walls.
 */
import { DOOR_ENTRY_LIVING_DOOR } from "./living";
import { PALETTE } from "../palette";
import { block, part } from "../solids";
import { floorOf, GROUND_LAYERS, STOREYS } from "../storeys";
import { STAIR_OPENING, STAIR_STEPS } from "../stair";
import {
  doorFloor,
  roomCeiling,
  roomFloor,
  type IRoomBuild,
  type IRoomSpace,
} from "./shared";

const FLOOR = floorOf("ground-storey");
/** The entry plan owns the front threshold span consumed by wall, base and porch. */
/**
 * @evidence spaces/rooms/entry.md The front entrance has one room-owned rough door span.
 * @evidence spaces/rooms/entry.md#entry-plan The same span and floor-derived sill feed its wall, base, and porch.
 * @evidence principles/core/source-units.md#source-scope-preservation This value declares no second doorway or door leaf.
 * @evidence principles/core/source-units.md#source-substantive-completion Consumers use one export for rough opening and threshold alignment.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The entry parent already specifies the doorway span and sill.
 */
export const FRONT_DOOR = {
  id: "front-door",
  from: 0.4,
  to: 1.4,
  bottom: STOREYS.groundFloor - GROUND_LAYERS.finish - GROUND_LAYERS.base,
  top: 2.2,
} as const;

const entrySpace = (): IRoomSpace => ({
  id: "front-entry",
  owner: "rooms/entry.ts",
  storey: "ground-storey",
  outline: [
    { x: STAIR_OPENING.west, z: STAIR_OPENING.front },
    { x: 2.02, z: STAIR_OPENING.front },
    { x: 2.02, z: STAIR_OPENING.turnZ },
    { x: -0.5, z: STAIR_OPENING.turnZ },
    { x: -0.5, z: STAIR_STEPS.lowerStartZ },
    { x: STAIR_OPENING.west, z: STAIR_STEPS.lowerStartZ },
  ],
  floor: PALETTE.woodFloor,
  reservations: [
    // entry-plan: the stair's lower waiting area kept on this room's floor.
    { id: "entry-stair-waiting", kind: "use", x: [STAIR_OPENING.west, STAIR_OPENING.turnX], z: [STAIR_STEPS.lowerStartZ, STAIR_OPENING.front] },
    // entry-use-routes: the shallow mat behind the opened front door.
    // entry-coat-storage decides the closet's front use, facing -X on the service band floor.
    { id: "entry-coat-front-use", kind: "use", space: "service-access", x: [2.1, 2.7], z: [-4.4, -3.65] },
    { id: "entry-mat", kind: "covering", x: [0.45, 1.35], z: [-1.95, -1.3], y: [FLOOR, FLOOR + 0.006] },
    // entry-coat-storage's body Z = [-4.56, -3.51] and its front use
    // X = [2.10, 2.70] lie outside this outline (the body is `storages`).
  ],
});

/**
 * @evidence spaces/rooms/entry.md The entry owns the coat body and opening consumed by the upper flight.
 * @evidence principles/core/source-units.md#source-scope-preservation Entry fixes the closet top and opening but derives its body X from the stair's seventh upper tread station.
 * @evidence principles/core/source-units.md#source-substantive-completion The storage, closet walls, stair underside, and cut opening read one top; the closure reads this export's opening Z span.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The entry storage design already fixes its top and body extents.
 */
export const COAT_STORAGE = {
  get x() { return [STAIR_STEPS.upperClosetStartX + 0.07, STAIR_STEPS.upperClosetStartX + 0.72] as const; },
  frontZ: -3.51,
  top: 2.15,
  opening: { from: -4.51, to: -3.56 },
  get backWallX() { return STAIR_STEPS.upperClosetStartX; },
} as const;
const BASE = STOREYS.groundFloor - GROUND_LAYERS.finish;

/** Emit the entry floor and ceiling finishes, its share under entry-living-door and the coat closet walls. */
/**
 * @evidence spaces/rooms/entry.md This builder owns the L-shaped front-entry floor, its interrupted ceiling, and the under-stair coat closet.
 * @evidence spaces/rooms/entry.md#entry-plan ENTRY retains the six-corner outline and the stair waiting strip without creating a front-wall door body.
 * @evidence spaces/rooms/entry.md#entry-use-routes The entry mat, lower stair waiting, and floor under entry-living-door remain in the entry's own use area.
 * @evidence spaces/rooms/entry.md#entry-coat-storage A hollow storage record and two closet walls end under the upper flight at COAT_STORAGE.top.
 * @evidence principles/core/source-units.md#source-scope-preservation The stair builder retains its flight and closet closure; this room emits only its allocated floor, ceiling, and two closet walls.
 * @evidence principles/core/source-units.md#source-substantive-completion The return includes a logical room, storage volume, and real finish/partition parts with stable identities.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The entry parent fixes its L outline, open stair ceiling, and closet contact; the builder needed no new exit or storage position.
 */
export const buildEntry = (): IRoomBuild => {
  const ENTRY = entrySpace();
  return {
  space: ENTRY,
  // The coat closet interior: body X = [1.10, 1.75] plus the open reveal to the
  // closure's inner face X = 1.87, under the stair structure at Y = 2.15.
  storages: [{ id: "entry-coat-storage", x: [COAT_STORAGE.x[0], STAIR_OPENING.east], y: [STOREYS.groundFloor, COAT_STORAGE.top], z: [STAIR_OPENING.back, COAT_STORAGE.frontZ] }],
  parts: [
    roomFloor(ENTRY),
    // Over X = [-1.80, -0.65], Z = [-1.45, -0.25] the stair opening runs on to the
    // front wall (02 stair-floor-opening): the entry ceiling stops at its edge.
    roomCeiling(ENTRY, [
      { x: STAIR_OPENING.turnX, z: STAIR_OPENING.front },
      { x: 2.02, z: STAIR_OPENING.front },
      { x: 2.02, z: STAIR_OPENING.turnZ },
      { x: -0.5, z: STAIR_OPENING.turnZ },
      { x: -0.5, z: STAIR_STEPS.lowerStartZ },
      { x: STAIR_OPENING.turnX, z: STAIR_STEPS.lowerStartZ },
    ]),
    doorFloor(ENTRY, "entry-living-door", [-1.875, -1.8], [DOOR_ENTRY_LIVING_DOOR.from, DOOR_ENTRY_LIVING_DOOR.to]),
    part("entry-coat-back", ENTRY.owner, "partition", PALETTE.interiorWall, block([COAT_STORAGE.backWallX, BASE, STAIR_OPENING.back], [COAT_STORAGE.x[0], COAT_STORAGE.top, STAIR_OPENING.turnZ])),
    part("entry-coat-side", ENTRY.owner, "partition", PALETTE.interiorWall, block([COAT_STORAGE.x[0], BASE, COAT_STORAGE.frontZ], [STAIR_OPENING.east, COAT_STORAGE.top, STAIR_OPENING.turnZ])),
  ],
  };
};
