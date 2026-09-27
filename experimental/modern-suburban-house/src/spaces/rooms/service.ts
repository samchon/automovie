/**
 * `service-access`: the ground-storey L-shaped service passage.
 *
 * Design owner: `docs/spaces/rooms/service.md#service-access-plan`. Finished
 * inner area is the right band X = [2.02, 3.07], Z = [-6.05, -0.25] m joined
 * with the band behind the stair X = [-1.80, 2.02], Z = [-6.05, -4.71] m. The
 * connection to the entry at X = 2.02, Z = [-3.41, -0.25] has no door or
 * partition. Its walls belong to the powder, laundry, pantry, living and
 * common owners (07), so this owner emits only its floor and ceiling finishes
 * and its halves of the floor finish under the door voids it faces, including
 * the service side of the coat-storage opening.
 */
import { DOOR_SERVICE_PANTRY_DOOR } from "./pantry";
import { DOOR_SERVICE_LAUNDRY_DOOR } from "./laundry";
import { DOOR_SERVICE_POWDER_DOOR } from "./powder";
import { DOOR_SERVICE_COMMON_OPENING } from "./common";
import { PALETTE } from "../palette";
import { MAIN } from "../building";
import { STAIR_OPENING } from "../stair";
import { COAT_STORAGE } from "./entry";
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
 * @evidenceReview spaces/rooms/service.md # SERVICE records the right passage band joined to the rear band behind the stair; buildService returns its floor and ceiling with the service-side coat-opening finish and four room-door finish shares.
 * @evidence spaces/rooms/service.md#service-access-plan The six-corner L outline keeps the front-entry connection wall-less and serves powder, laundry, pantry, and common openings.
 * @evidenceReview spaces/rooms/service.md#service-access-plan # SERVICE's six points trace the two authored L bands; one doorFloor covers the coat opening from the partition mid-plane to the passage face and four more use the powder, laundry, pantry and common spans.
 * @evidence principles/core/source-units.md#source-scope-preservation Its neighbours own all partition bodies; this builder emits only its floor, ceiling, and shares under the coat opening and four room voids.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # buildService returns only roomFloor, roomCeiling and doorFloor parts, including its half of the coat opening; adjoining owners retain the wall and opening bodies.
 * @evidence principles/core/source-units.md#source-substantive-completion The return has a continuous floor/ceiling and four named doorFloor strips for actual passage bottoms.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # The SERVICE outline feeds floor and ceiling parts; five named doorFloor strips cover the coat opening and powder, laundry, pantry and common thresholds.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Service-access-plan joins the right/front and stair-back bands without a wall and assigns the common, powder, laundry, and pantry door contacts; buildService keeps that one open service space.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # Service-access-plan fixes the two L bands, open entry boundary and powder, laundry, pantry and common contacts; SERVICE's outline and buildService's finish shares implement those inputs without a new service wall or route decision.
 */
export const buildService = (): IRoomBuild => ({
  space: SERVICE,
  parts: [
    roomFloor(SERVICE),
    doorFloor(SERVICE, "entry-coat-opening", [STAIR_OPENING.east + MAIN.partition / 2, STAIR_OPENING.east + MAIN.partition], [COAT_STORAGE.opening.from, COAT_STORAGE.opening.to]),
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
