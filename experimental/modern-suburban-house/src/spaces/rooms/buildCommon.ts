/**
 * `kitchen-dining-family`: the one continuous rear common room.
 *
 * Finished inner
 * X = [-5.50, 5.50], Z = [-10.45, -6.20] m. 07 assigns this owner the front
 * partition Z = [-6.20, -6.05] facing living-room, service-access and pantry,
 * with two doorless openings of head 2.40 m: `living-common-opening`
 * X = [-5.00, -2.15] and `service-common-opening` X = [-1.35, 3.07]; the part
 * behind the pantry, X = [3.22, 5.50], stays closed.
 *
 * Output: the room record, its wood floor finish and the front partition.
 */
import { PALETTE } from "../PALETTE";
import { FAMILY_REAR_WINDOW } from "../envelope/FAMILY_REAR_WINDOW";
import { FAMILY_RIGHT_WINDOW } from "../envelope/FAMILY_RIGHT_WINDOW";
import { MAIN_OUTLINE } from "../MAIN_OUTLINE";
import {
  type IRoomBuild,
} from "./IRoomBuild";
import { box } from "./box";
import { partition } from "./partition";
import { roomCeiling } from "./roomCeiling";
import { doorFloor } from "./doorFloor";
import { roomFloor } from "./roomFloor";
import { type IRoomSpace } from "./IRoomSpace";
import { floorOf } from "../floorOf";
import { DOOR_SERVICE_COMMON_OPENING } from "./DOOR_SERVICE_COMMON_OPENING";
import { DOOR_LIVING_COMMON_OPENING } from "./DOOR_LIVING_COMMON_OPENING";
const FLOOR = floorOf("ground-storey");
const DINING_TABLE_X = [-0.35, 1.35] as const;
const DINING_TABLE_Z = [-8.4, -7.5] as const;
const DINING_SEAT_HALF_WIDTH = 0.325;
const DINING_SEAT_DEPTH = 0.75;

const COMMON: IRoomSpace = {
  id: "kitchen-dining-family",
  owner: "rooms/common.ts",
  storey: "ground-storey",
  outline: box([-5.5, 5.5], [-10.45, -6.2]),
  floor: PALETTE.woodFloor,
  reservations: [
    { id: "family-rear-curtain", kind: "fixture", x: [FAMILY_REAR_WINDOW.from - 0.1, FAMILY_REAR_WINDOW.to + 0.1], z: [MAIN_OUTLINE.inner.z[0], MAIN_OUTLINE.inner.z[0] + 0.12], y: [FLOOR + 0.1, FAMILY_REAR_WINDOW.top + 0.12] },
    { id: "family-right-curtain", kind: "fixture", x: [MAIN_OUTLINE.inner.x[1] - 0.12, MAIN_OUTLINE.inner.x[1]], z: [FAMILY_RIGHT_WINDOW.from - 0.1, FAMILY_RIGHT_WINDOW.to + 0.1], y: [FLOOR + 0.1, FAMILY_RIGHT_WINDOW.top + 0.12] },
    // common-kitchen-wall-reservation. The L corner X = [-5.50, -4.85],
    // Z = [-10.45, -9.80] is counted once, in the back band; the left band
    // excludes the range plan Z = [-9.50, -8.70].
    { id: "common-kitchen-back-base", kind: "storage", x: [-5.5, -2.15], z: [-10.45, -9.8], y: [FLOOR, FLOOR + 0.91] },
    { id: "common-kitchen-left-base-rear", kind: "storage", x: [-5.5, -4.85], z: [-9.8, -9.5], y: [FLOOR, FLOOR + 0.91] },
    { id: "common-kitchen-left-base-front", kind: "storage", x: [-5.5, -4.85], z: [-8.7, -7.4], y: [FLOOR, FLOOR + 0.91] },
    { id: "common-fridge", kind: "fixture", x: [-5.5, -4.7], z: [-7.4, -6.45], y: [FLOOR, FLOOR + 1.85] },
    { id: "common-fridge-swing", kind: "swing", x: [-4.7, -4.15], z: [-7.4, -6.45] },
    { id: "common-fridge-use", kind: "use", x: [-4.15, -3.7], z: [-7.4, -6.45] },
    { id: "common-range", kind: "fixture", x: [-5.5, -4.85], z: [-9.5, -8.7], y: [FLOOR, FLOOR + 0.91] },
    { id: "common-oven-swing", kind: "swing", x: [-4.85, -4.3], z: [-9.5, -8.7] },
    { id: "common-oven-use", kind: "use", x: [-4.3, -3.7], z: [-9.5, -8.7] },
    { id: "common-microwave", kind: "fixture", x: [-5.5, -5.1], z: [-9.5, -8.7], y: [FLOOR + 1.45, FLOOR + 1.85] },
    { id: "common-kitchen-left-wall-cabinet", kind: "storage", x: [-5.5, -5.15], z: [-8.7, -7.4], y: [FLOOR + 1.45, FLOOR + 2.35] },
    { id: "common-kitchen-back-wall-cabinet", kind: "storage", x: [-3.0, -2.15], z: [-10.45, -10.1], y: [FLOOR + 1.45, FLOOR + 2.35] },
    // common-island-reservation.
    { id: "common-island", kind: "fixture", x: [-3.65, -2.6], z: [-8.7, -6.45], y: [FLOOR, FLOOR + 0.91] },
    { id: "common-island-sink", kind: "fixture", x: [-3.55, -3.05], z: [-8.6, -8.1], y: [FLOOR + 0.91, FLOOR + 1.31] },
    { id: "common-dishwasher", kind: "fixture", x: [-3.65, -3.05], z: [-8.05, -7.45], y: [FLOOR, FLOOR + 0.91] },
    { id: "common-dishwasher-swing", kind: "swing", x: [-4.25, -3.65], z: [-8.05, -7.45] },
    { id: "common-dishwasher-use", kind: "use", x: [-4.85, -4.25], z: [-8.1, -7.4] },
    ...Array.from({ length: 3 }, (_, i) => {
      const centre = -8.3 + 0.7 * i;
      return {
        id: `common-island-stool-${i + 1}-use`,
        kind: "use" as const,
        x: [-2.6, -1.65] as const,
        z: [Number((centre - 0.325).toFixed(3)), Number((centre + 0.325).toFixed(3))] as const,
      };
    }),
    // common-dining-reservation.
    { id: "common-dining-table", kind: "furniture", x: DINING_TABLE_X, z: DINING_TABLE_Z, y: [FLOOR, FLOOR + 0.75] },
    ...Array.from({ length: 2 }, (_, i) => ({
      id: `common-dining-seat-back-${i + 1}-use`, kind: "use" as const,
      x: [i - DINING_SEAT_HALF_WIDTH, i + DINING_SEAT_HALF_WIDTH] as const,
      z: [DINING_TABLE_Z[0] - DINING_SEAT_DEPTH, DINING_TABLE_Z[0]] as const,
    })),
    ...Array.from({ length: 2 }, (_, i) => ({
      id: `common-dining-seat-front-${i + 1}-use`, kind: "use" as const,
      x: [i - DINING_SEAT_HALF_WIDTH, i + DINING_SEAT_HALF_WIDTH] as const,
      z: [DINING_TABLE_Z[1], DINING_TABLE_Z[1] + DINING_SEAT_DEPTH] as const,
    })),
    ...(["left", "right"] as const).map((side) => ({
      id: `common-dining-seat-${side}-use`, kind: "use" as const,
      x: side === "left"
        ? [DINING_TABLE_X[0] - DINING_SEAT_DEPTH, DINING_TABLE_X[0]] as const
        : [DINING_TABLE_X[1], DINING_TABLE_X[1] + DINING_SEAT_DEPTH] as const,
      z: [(DINING_TABLE_Z[0] + DINING_TABLE_Z[1]) / 2 - DINING_SEAT_HALF_WIDTH,
        (DINING_TABLE_Z[0] + DINING_TABLE_Z[1]) / 2 + DINING_SEAT_HALF_WIDTH] as const,
    })),
    // common-family-reservation.
    { id: "common-family-sofa", kind: "furniture", x: [3.25, 5.35], z: [-7.15, -6.2], y: [FLOOR, FLOOR + 0.9] },
    { id: "common-family-table", kind: "furniture", x: [3.4, 4.45], z: [-8.35, -7.8], y: [FLOOR, FLOOR + 0.42] },
    { id: "common-family-rug", kind: "covering", x: [3, 4.55], z: [-8.55, -6.85], y: [FLOOR, FLOOR + 0.008] },
    // common-clear-routes.
    { id: "common-main-route-right", kind: "route", x: [2.1, 3.07], z: [-9.25, -6.2] },
    { id: "common-main-route-back", kind: "route", x: [-1.5, 3.07], z: [MAIN_OUTLINE.inner.z[0] + 0.12, -9.25] },
    { id: "common-garden-door-approach", kind: "route", x: [-1.5, FAMILY_REAR_WINDOW.from - 0.1], z: [MAIN_OUTLINE.inner.z[0], MAIN_OUTLINE.inner.z[0] + 0.12] },
    { id: "common-kitchen-route", kind: "route", x: [-4.85, -0.35], z: [-9.8, -8.7] },
  ],
};

/** Emit the common room floor and its front partition with two open voids. */
export const buildCommon = (): IRoomBuild => ({
  space: COMMON,
  parts: [
    roomFloor(COMMON),
    roomCeiling(COMMON),
    doorFloor(
      COMMON,
      "living-common-opening",
      [DOOR_LIVING_COMMON_OPENING.from, DOOR_LIVING_COMMON_OPENING.to],
      [-6.2, -6.125],
    ),
    doorFloor(
      COMMON,
      "service-common-opening",
      [DOOR_SERVICE_COMMON_OPENING.from, DOOR_SERVICE_COMMON_OPENING.to],
      [-6.2, -6.125],
    ),
    partition({
      id: "common-front-partition",
      owner: COMMON.owner,
      storey: "ground-storey",
      axis: "x",
      across: [-6.2, -6.05],
      along: [-5.5, 5.5],
      holes: [DOOR_LIVING_COMMON_OPENING, DOOR_SERVICE_COMMON_OPENING],
    }),
  ],
});
