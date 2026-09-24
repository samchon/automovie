/**
 * `kitchen-dining-family`: the one continuous rear common room.
 *
 * Design owner: `docs/spaces/rooms/common.md#common-room-plan`. Finished inner
 * X = [-5.50, 5.50], Z = [-10.45, -6.20] m. 07 assigns this owner the front
 * partition Z = [-6.20, -6.05] facing living-room, service-access and pantry,
 * with two doorless openings of head 2.40 m: `living-common-opening`
 * X = [-5.00, -2.15] and `service-common-opening` X = [-1.35, 3.07]; the part
 * behind the pantry, X = [3.22, 5.50], stays closed.
 *
 * Output: the room record, its wood floor finish and the front partition.
 */
import { PALETTE } from "../palette";
import { type IRoomBuild, type IRoomSpace, box, door, partition, doorFloor, roomCeiling, roomFloor } from "./shared";

const COMMON: IRoomSpace = {
  id: "kitchen-dining-family",
  owner: "rooms/common.ts",
  storey: "ground-storey",
  outline: box([-5.5, 5.5], [-10.45, -6.2]),
  floor: PALETTE.woodFloor,
  reservations: [
    // common-kitchen-wall-reservation. The L corner X = [-5.50, -4.85],
    // Z = [-10.45, -9.80] is counted once, in the back band; the left band
    // excludes the range plan Z = [-9.50, -8.70].
    { id: "common-kitchen-back-base", kind: "storage", x: [-5.5, -2.15], z: [-10.45, -9.8], y: [0, 0.91] },
    { id: "common-kitchen-left-base-rear", kind: "storage", x: [-5.5, -4.85], z: [-9.8, -9.5], y: [0, 0.91] },
    { id: "common-kitchen-left-base-front", kind: "storage", x: [-5.5, -4.85], z: [-8.7, -7.4], y: [0, 0.91] },
    { id: "common-fridge", kind: "fixture", x: [-5.5, -4.7], z: [-7.4, -6.45], y: [0, 1.85] },
    { id: "common-fridge-swing", kind: "swing", x: [-4.7, -4.15], z: [-7.4, -6.45] },
    { id: "common-fridge-use", kind: "use", x: [-4.15, -3.7], z: [-7.4, -6.45] },
    { id: "common-range", kind: "fixture", x: [-5.5, -4.85], z: [-9.5, -8.7], y: [0, 0.91] },
    { id: "common-oven-swing", kind: "swing", x: [-4.85, -4.3], z: [-9.5, -8.7] },
    { id: "common-oven-use", kind: "use", x: [-4.3, -3.7], z: [-9.5, -8.7] },
    { id: "common-microwave", kind: "fixture", x: [-5.5, -5.1], z: [-9.5, -8.7], y: [1.45, 1.85] },
    { id: "common-kitchen-left-wall-cabinet", kind: "storage", x: [-5.5, -5.15], z: [-8.7, -7.4], y: [1.45, 2.35] },
    { id: "common-kitchen-back-wall-cabinet", kind: "storage", x: [-3.0, -2.15], z: [-10.45, -10.1], y: [1.45, 2.35] },
    // common-island-reservation.
    { id: "common-island", kind: "fixture", x: [-3.65, -2.6], z: [-8.7, -6.45], y: [0, 0.91] },
    { id: "common-island-sink", kind: "fixture", x: [-3.55, -3.05], z: [-8.6, -8.1], y: [0.91, 1.31] },
    { id: "common-dishwasher", kind: "fixture", x: [-3.65, -3.05], z: [-8.05, -7.45], y: [0, 0.91] },
    { id: "common-dishwasher-swing", kind: "swing", x: [-4.25, -3.65], z: [-8.05, -7.45] },
    { id: "common-dishwasher-use", kind: "use", x: [-4.85, -4.25], z: [-8.1, -7.4] },
    { id: "common-island-stool-1-use", kind: "use", x: [-2.6, -1.65], z: [-8.625, -7.975] },
    { id: "common-island-stool-2-use", kind: "use", x: [-2.6, -1.65], z: [-7.925, -7.275] },
    { id: "common-island-stool-3-use", kind: "use", x: [-2.6, -1.65], z: [-7.225, -6.575] },
    // common-dining-reservation.
    { id: "common-dining-table", kind: "furniture", x: [-0.35, 1.35], z: [-8.4, -7.5], y: [0, 0.75] },
    { id: "common-dining-seat-back-1-use", kind: "use", x: [-0.325, 0.325], z: [-9.15, -8.4] },
    { id: "common-dining-seat-back-2-use", kind: "use", x: [0.675, 1.325], z: [-9.15, -8.4] },
    { id: "common-dining-seat-front-1-use", kind: "use", x: [-0.325, 0.325], z: [-7.5, -6.75] },
    { id: "common-dining-seat-front-2-use", kind: "use", x: [0.675, 1.325], z: [-7.5, -6.75] },
    { id: "common-dining-seat-left-use", kind: "use", x: [-1.1, -0.35], z: [-8.275, -7.625] },
    { id: "common-dining-seat-right-use", kind: "use", x: [1.35, 2.1], z: [-8.275, -7.625] },
    // common-family-reservation.
    { id: "common-family-sofa", kind: "furniture", x: [3.25, 5.35], z: [-7.15, -6.2], y: [0, 0.9] },
    { id: "common-family-table", kind: "furniture", x: [3.4, 4.5], z: [-8.35, -7.8], y: [0, 0.42] },
    // common-clear-routes.
    { id: "common-main-route-right", kind: "route", x: [2.1, 3.07], z: [-9.25, -6.2] },
    { id: "common-main-route-back", kind: "route", x: [-1.5, 3.07], z: [-10.45, -9.25] },
    { id: "common-kitchen-route", kind: "route", x: [-4.85, -0.35], z: [-9.8, -8.7] },
  ],
};

/** Emit the common room floor and its front partition with two open voids. */
export const buildCommon = (): IRoomBuild => ({
  space: COMMON,
  parts: [
    roomFloor(COMMON),
    roomCeiling(COMMON),
    doorFloor(COMMON, "living-common-opening", [-5.0, -2.15], [-6.2, -6.125]),
    doorFloor(COMMON, "service-common-opening", [-1.35, 3.07], [-6.2, -6.125]),
    partition({
      id: "common-front-partition",
      owner: COMMON.owner,
      storey: "ground-storey",
      axis: "x",
      across: [-6.2, -6.05],
      along: [-5.5, 5.5],
      holes: [
        door("living-common-opening", "ground-storey", -5.0, -2.15, 2.4),
        door("service-common-opening", "ground-storey", -1.35, 3.07, 2.4),
      ],
    }),
  ],
});
