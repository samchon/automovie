/**
 * `service-access`: the ground-storey L-shaped service passage.
 *
 * Design owner: `docs/spaces/rooms/service.md#service-access-plan`. Finished
 * inner area is the right band X = [2.02, 3.07], Z = [-6.05, -0.25] m joined
 * with the band behind the stair X = [-1.80, 2.02], Z = [-6.05, -4.71] m. The
 * connection to the entry at X = 2.02, Z = [-3.41, -0.25] has no door or
 * partition. Its walls belong to the powder, laundry, pantry, living and
 * common owners (07), so this owner emits only its floor and ceiling finishes
 * and its halves of the floor finish under the door voids it faces.
 */
import { DOOR_SERVICE_PANTRY_DOOR } from "./pantry";
import { DOOR_SERVICE_LAUNDRY_DOOR } from "./laundry";
import { DOOR_SERVICE_POWDER_DOOR } from "./powder";
import { DOOR_SERVICE_COMMON_OPENING } from "./common";
import { PALETTE } from "../palette";
import {
  doorFloor,
  roomCeiling,
  roomFloor,
  type IRoomBuild,
  type IRoomSpace,
} from "./shared";

const SERVICE: IRoomSpace = {
  id: "service-access",
  owner: "rooms/service.ts",
  storey: "ground-storey",
  outline: [
    { x: 2.02, z: -0.25 },
    { x: 3.07, z: -0.25 },
    { x: 3.07, z: -6.05 },
    { x: -1.8, z: -6.05 },
    { x: -1.8, z: -4.71 },
    { x: 2.02, z: -4.71 },
  ],
  floor: PALETTE.woodFloor,
};

/** Emit the service passage floor and ceiling finishes and its shares of the floor under its door voids. */
/**
 * @evidence spaces/rooms/service.md This export supplies the joined right-and-rear service passage as a room record and finish surfaces.
 * @evidence spaces/rooms/service.md#service-access-plan The six-corner L outline keeps the front-entry connection wall-less and serves powder, laundry, pantry, and common openings.
 * @evidence principles/core/source-units.md#source-scope-preservation Its neighbours own all partition bodies; this builder emits only its floor, ceiling, and shares under four voids.
 * @evidence principles/core/source-units.md#source-substantive-completion The return has a continuous floor/ceiling and four named doorFloor strips for actual passage bottoms.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The service parent fixes the two joined bands and all door contacts; the builder added no sixth door or barrier.
 */
export const buildService = (): IRoomBuild => ({
  space: SERVICE,
  parts: [
    roomFloor(SERVICE),
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
