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
import { PALETTE } from "../palette";
import { type IRoomBuild, type IRoomSpace, box, door, partition, doorFloor, roomCeiling, roomFloor } from "./shared";

const LIVING: IRoomSpace = {
  id: "living-room",
  owner: "rooms/living.ts",
  storey: "ground-storey",
  outline: box([-5.5, -1.95], [-6.05, -0.25]),
  floor: PALETTE.woodFloor,
  reservations: [
    // living-plan: no furniture on the floor in front of entry-living-door.
    { id: "living-door-swing", kind: "swing", x: [-2.85, -1.95], z: [-1.4, -0.35] },
    // living-furniture-use.
    { id: "living-sofa", kind: "furniture", x: [-2.9, -1.95], z: [-3.75, -1.65], y: [0, 0.9] },
    { id: "living-table", kind: "furniture", x: [-3.95, -3.45], z: [-3.3, -2.0], y: [0, 0.42] },
    { id: "living-reading-chair", kind: "furniture", x: [-3.9, -3.05], z: [-5.65, -4.8], y: [0, 0.9] },
    { id: "living-bookcase", kind: "storage", x: [-2.3, -1.95], z: [-5.9, -4.9], y: [0, 1.9] },
    { id: "living-rug", kind: "furniture", x: [-4.0, -2.0], z: [-3.9, -1.55], y: [0, 0.008] },
    { id: "living-sofa-use", kind: "use", x: [-3.45, -2.9], z: [-3.6, -1.8] },
    { id: "living-chair-use", kind: "use", x: [-3.9, -3.05], z: [-4.8, -4.2] },
    { id: "living-bookcase-use", kind: "use", x: [-2.9, -2.3], z: [-5.8, -5.0] },
    // living-through-route. The front floor's X runs from the main band's
    // left edge to the door-front zone, the two plans the text joins.
    { id: "living-main-route", kind: "route", x: [-4.9, -4.0], z: [-6.05, -1.45] },
    { id: "living-front-route", kind: "route", x: [-4.9, -2.85], z: [-1.45, -0.45] },
  ],
};

/** Emit the living floor and the partitions 07 gives this owner. */
export const buildLiving = (): IRoomBuild => ({
  space: LIVING,
  parts: [
    roomFloor(LIVING),
    roomCeiling(LIVING),
    doorFloor(LIVING, "entry-living-door", [-1.95, -1.875], [-1.35, -0.35]),
    doorFloor(LIVING, "living-common-opening", [-5.0, -2.15], [-6.125, -6.05]),
    partition({
      id: "living-entry-partition",
      owner: LIVING.owner,
      storey: "ground-storey",
      axis: "z",
      across: [-1.95, -1.8],
      along: [-1.45, -0.25],
      holes: [door("entry-living-door", "ground-storey", -1.35, -0.35)],
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
