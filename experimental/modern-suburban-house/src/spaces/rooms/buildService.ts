/**
 * `service-access`: the ground-storey L-shaped service passage.
 *
 * Finished
 * inner area is the right band X = [2.02, 3.07], Z = [-6.05, -0.25] m joined
 * with the band behind the stair X = [-1.80, 2.02], Z = [-6.05, -4.71] m. The
 * connection to the entry at X = 2.02, Z = [-3.41, -0.25] has no door or
 * partition. Its walls belong to the powder, laundry, pantry, living and
 * common owners (07), so this owner emits only its floor and ceiling finishes
 * and its halves of the floor finish under the door voids it faces, including
 * the service side of the coat-storage opening.
 */
import { DOOR_SERVICE_PANTRY_DOOR } from "./DOOR_SERVICE_PANTRY_DOOR";
import { DOOR_SERVICE_LAUNDRY_DOOR } from "./DOOR_SERVICE_LAUNDRY_DOOR";
import { DOOR_SERVICE_POWDER_DOOR } from "./DOOR_SERVICE_POWDER_DOOR";
import { DOOR_SERVICE_COMMON_OPENING } from "./DOOR_SERVICE_COMMON_OPENING";
import { PALETTE } from "../PALETTE";
import { MAIN_OUTLINE } from "../MAIN_OUTLINE";
import { STAIR_OPENING } from "../STAIR_OPENING";
import { COAT_STORAGE } from "./COAT_STORAGE";
import {
  type IRoomBuild,
} from "./IRoomBuild";
import { roomCeiling } from "./roomCeiling";
import { doorFloor } from "./doorFloor";
import { roomFloor } from "./roomFloor";
import { type IRoomSpace } from "./IRoomSpace";

const SERVICE: IRoomSpace = {
  id: "service-access",
  owner: "rooms/service.ts",
  storey: "ground-storey",
  outline: [
    { x: 2.02, z: -0.25 },
    { x: 3.07, z: -0.25 },
    { x: 3.07, z: -6.05 },
    { x: -1.8, z: -6.05 },
    { x: -1.8, z: STAIR_OPENING.guardBack },
    { x: 2.02, z: STAIR_OPENING.guardBack },
  ],
  floor: PALETTE.woodFloor,
};

/** Emit the service passage floor and ceiling finishes and its shares of the floor under its door voids. */
export const buildService = (): IRoomBuild => ({
  space: SERVICE,
  parts: [
    roomFloor(SERVICE),
    doorFloor(
      SERVICE,
      "entry-coat-opening",
      [
        STAIR_OPENING.east + MAIN_OUTLINE.partition / 2,
        STAIR_OPENING.east + MAIN_OUTLINE.partition,
      ],
      [COAT_STORAGE.opening.from, COAT_STORAGE.opening.to],
    ),
    roomCeiling(SERVICE),
    doorFloor(
      SERVICE,
      "service-powder-door",
      [3.07, 3.145],
      [DOOR_SERVICE_POWDER_DOOR.from, DOOR_SERVICE_POWDER_DOOR.to],
    ),
    doorFloor(
      SERVICE,
      "service-laundry-door",
      [3.07, 3.145],
      [DOOR_SERVICE_LAUNDRY_DOOR.from, DOOR_SERVICE_LAUNDRY_DOOR.to],
    ),
    doorFloor(
      SERVICE,
      "service-pantry-door",
      [3.07, 3.145],
      [DOOR_SERVICE_PANTRY_DOOR.from, DOOR_SERVICE_PANTRY_DOOR.to],
    ),
    doorFloor(
      SERVICE,
      "service-common-opening",
      [DOOR_SERVICE_COMMON_OPENING.from, DOOR_SERVICE_COMMON_OPENING.to],
      [-6.125, -6.05],
    ),
  ],
});
