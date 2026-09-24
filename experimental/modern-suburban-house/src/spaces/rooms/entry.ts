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
 * X = [1.87, 2.02] closure with `entry-coat-opening` belong to `stair.ts`. This
 * owner emits the closet's own walls inside the stair plan: the back end
 * X = [1.03, 1.10] closing it against the solid under-stair at the upper
 * flight's seventh tread, and the side Z = [-3.51, -3.41] at the flight's front
 * line, both up to the closet top. X = [1.75, 2.02] stays an open reveal. The
 * rod, shelves and sliding leaves are later models.
 *
 * Output: the room record, its wood floor finish and the closet walls.
 */
import { PALETTE } from "../palette";
import { block, part } from "../solids";
import { GROUND_LAYERS, STOREYS } from "../storeys";
import { type IRoomBuild, type IRoomSpace, doorFloor, roomCeiling, roomFloor } from "./shared";

const ENTRY: IRoomSpace = {
  id: "front-entry",
  owner: "rooms/entry.ts",
  storey: "ground-storey",
  outline: [
    { x: -1.8, z: -0.25 },
    { x: 2.02, z: -0.25 },
    { x: 2.02, z: -3.41 },
    { x: -0.5, z: -3.41 },
    { x: -0.5, z: -1.45 },
    { x: -1.8, z: -1.45 },
  ],
  floor: PALETTE.woodFloor,
  reservations: [
    // entry-plan: the stair's lower waiting area kept on this room's floor.
    { id: "entry-stair-waiting", kind: "use", x: [-1.8, -0.65], z: [-1.45, -0.25] },
    // entry-use-routes: the shallow mat behind the opened front door.
    { id: "entry-mat", kind: "furniture", x: [0.45, 1.35], z: [-1.95, -1.3], y: [0, 0.006] },
    // entry-coat-storage's body Z = [-4.56, -3.51] and its front use
    // X = [2.10, 2.70] lie outside this outline (the body is `storages`).
  ],
};

/** Coat closet top, the stair structure's underside above it (entry-coat-storage). */
const COAT_TOP = 2.15;
const BASE = STOREYS.groundFloor - GROUND_LAYERS.finish;

/** Emit the entry floor and ceiling finishes, its share under entry-living-door and the coat closet walls. */
export const buildEntry = (): IRoomBuild => ({
  space: ENTRY,
  // The coat closet interior: body X = [1.10, 1.75] plus the open reveal to the
  // closure's inner face X = 1.87, under the stair structure at Y = 2.15.
  storages: [{ id: "entry-coat-storage", x: [1.1, 1.87], y: [STOREYS.groundFloor, COAT_TOP], z: [-4.56, -3.51] }],
  parts: [
    roomFloor(ENTRY),
    roomCeiling(ENTRY),
    doorFloor(ENTRY, "entry-living-door", [-1.875, -1.8], [-1.35, -0.35]),
    part("entry-coat-back", ENTRY.owner, "partition", PALETTE.interiorWall, block([1.03, BASE, -4.56], [1.1, COAT_TOP, -3.41])),
    part("entry-coat-side", ENTRY.owner, "partition", PALETTE.interiorWall, block([1.1, BASE, -3.51], [1.87, COAT_TOP, -3.41])),
  ],
});
