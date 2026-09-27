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
import { STAIR_OPENING } from "../stair";
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
    { x: -1.8, z: STAIR_OPENING.guardBack },
    { x: 2.02, z: STAIR_OPENING.guardBack },
  ],
  floor: PALETTE.woodFloor,
};

/** Emit the service passage floor and ceiling finishes and its shares of the floor under its door voids. */
/**
 * @evidence spaces/rooms/service.md This export supplies the joined right-and-rear service passage as a room record and finish surfaces.
 * @evidenceReview spaces/rooms/service.md #38103b3 v-141 SERVICE room record plus roomFloor/roomCeiling and 4 doorFloors (service.ts:26-79); service.md:29: right band plus rear band behind the stair.
 * @evidence spaces/rooms/service.md#service-access-plan The six-corner L outline keeps the front-entry connection wall-less and serves powder, laundry, pantry, and common openings.
 * @evidenceReview spaces/rooms/service.md#service-access-plan #de0716f v-141 6-point outline (service.ts:30-37) = service.md:29 bands. No partition emitted, so the X=2.02 connection stays wall-less (service.md:31). doorFloors for powder/laundry/pantry/common (service.ts:54-77) via door constants imported at service.ts:12-15.
 * @evidence principles/core/source-units.md#source-scope-preservation Its neighbours own all partition bodies; this builder emits only its floor, ceiling, and shares under four voids.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Parts are only roomFloor, roomCeiling and 4 doorFloor (service.ts:51-78); 07:33-35 plus the common/living rows assign the partitions to neighbours.
 * @evidence principles/core/source-units.md#source-substantive-completion The return has a continuous floor/ceiling and four named doorFloor strips for actual passage bottoms.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 One-outline floor and ceiling; four doorFloor ids service-powder/laundry/pantry-door and service-common-opening (service.ts:54-77).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Service-access-plan joins the right/front and stair-back bands without a wall and assigns the common, powder, laundry, and pantry door contacts; buildService keeps that one open service space.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 service.md:29 right band + stair-back band joined as one L; :31 entry connection without door or partition, powder/laundry/pantry doors in X=[3.07,3.22] owned by their rooms; :33 common open connection. Host outline service.ts:30-37, four doorFloor shares, no partition.
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
