
import { DOOR_ENTRY_LIVING_DOOR } from "./living";
import { PALETTE } from "../palette";
import { MAIN } from "../building";
import { block } from "../solids";
import { part } from "../part";
import { floorOf, GROUND_LAYERS, STOREYS } from "../storeys";
import { STAIR_OPENING, STAIR_STEPS } from "../stair";
import {
  box,
  doorFloor,
  roomCeiling,
  roomFloor,
  type IRoomBuild,
  type IRoomSpace,
} from "./shared";

const FLOOR = floorOf("ground-storey");
/** The entry plan owns the front threshold span consumed by wall, base and porch. */
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
    { x: STAIR_OPENING.turnX, z: STAIR_OPENING.turnZ },
    { x: STAIR_OPENING.turnX, z: STAIR_STEPS.lowerStartZ },
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
export const COAT_STORAGE = {
  x: [STAIR_STEPS.upperClosetStartX + 0.07, STAIR_STEPS.upperClosetStartX + 0.72] as const,
  frontZ: -3.51,
  top: 2.15,
  opening: { from: -4.51, to: -3.56 },
  backWallX: STAIR_STEPS.upperClosetStartX,
} as const;
const BASE = STOREYS.groundFloor - GROUND_LAYERS.finish;

/** Emit the entry floor and ceiling finishes, its share under entry-living-door and the coat closet walls. */
export const buildEntry = (): IRoomBuild => {
  const ENTRY = entrySpace();
  const coatStorage = {
    id: "entry-coat-storage",
    x: [COAT_STORAGE.x[0], STAIR_OPENING.east] as const,
    y: [STOREYS.groundFloor, COAT_STORAGE.top] as const,
    z: [STAIR_OPENING.back, COAT_STORAGE.frontZ] as const,
  };
  return {
  space: ENTRY,
  // The coat closet interior: body X = [1.10, 1.75] plus the open reveal to the
  // closure's inner face X = 1.87, under the stair structure at Y = 2.15.
  storages: [coatStorage],
  parts: [
    roomFloor(ENTRY),
    roomFloor(ENTRY, { id: coatStorage.id, outline: box(coatStorage.x, coatStorage.z) }),
    doorFloor(ENTRY, "entry-coat-opening", [STAIR_OPENING.east, STAIR_OPENING.east + MAIN.partition / 2], [COAT_STORAGE.opening.from, COAT_STORAGE.opening.to]),
    // Over X = [-1.80, -0.65], Z = [-1.45, -0.25] the stair opening runs on to the
    // front wall (02 stair-floor-opening): the entry ceiling stops at its edge.
    roomCeiling(ENTRY, [
      { x: STAIR_OPENING.turnX, z: STAIR_OPENING.front },
      { x: 2.02, z: STAIR_OPENING.front },
      { x: 2.02, z: STAIR_OPENING.turnZ },
      { x: STAIR_OPENING.turnX, z: STAIR_OPENING.turnZ },
    ]),
    doorFloor(ENTRY, "entry-living-door", [-1.875, -1.8], [DOOR_ENTRY_LIVING_DOOR.from, DOOR_ENTRY_LIVING_DOOR.to]),
    part("entry-coat-back", ENTRY.owner, "partition", PALETTE.interiorWall, block([COAT_STORAGE.backWallX, BASE, STAIR_OPENING.back], [COAT_STORAGE.x[0], COAT_STORAGE.top, STAIR_OPENING.turnZ])),
    part("entry-coat-side", ENTRY.owner, "partition", PALETTE.interiorWall, block([COAT_STORAGE.x[0], BASE, COAT_STORAGE.frontZ], [STAIR_OPENING.east, COAT_STORAGE.top, STAIR_OPENING.turnZ])),
  ],
  };
};
