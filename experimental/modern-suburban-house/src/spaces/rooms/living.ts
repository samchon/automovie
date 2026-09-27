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
import { DOOR_LIVING_COMMON_OPENING } from "./common";
import { FRONT_WINDOWS } from "../envelope/front-windows";
import { LIVING_LEFT_WINDOW } from "../envelope/left";
import { MAIN } from "../building";
import { PALETTE } from "../palette";
import {
  box,
  door,
  doorFloor,
  partition,
  roomCeiling,
  roomFloor,
  type IRoomBuild,
  type IRoomSpace,
} from "./shared";
import { floorOf } from "../storeys";
import { STAIR_OPENING } from "../stair";
/** Shared void owned by this room and consumed at its floor and adjacent finish.
 * @evidence spaces/rooms/living.md The entry-living-door void follows the partition assigned to living.
 * @evidenceReview spaces/rooms/living.md #de6670b v-141 living.ts:35-40 door(-1.35,-0.35) is the hole of living-entry-partition L101-109; 07-boundary-assembly.md:29 gives living<->front-entry to living.ts; living.md:27.
 * @evidence principles/core/source-units.md#source-scope-preservation The entry-living-door interval remains with living while its adjacent room receives the span.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 entry.ts:23 imports; entry.ts:122 doorFloor Z from .from/.to; living.ts:89-94 own half.
 * @evidence principles/core/source-units.md#source-substantive-completion The entry-living-door span cuts its wall and sets floor finish limits on both sides.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 holes living.ts:108; living doorFloor X[-1.95,-1.875] L89-94; entry doorFloor X[-1.875,-1.8] entry.ts:122.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Living-plan locates entry-living-door in the entry/living wall at Z=[-1.35, -0.35], Y=[0, 2.20] and keeps furniture clear of its swing; this export supplies that rough cut.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 living.md:27 (#living-plan) X=[-1.95,-1.80] wall, Z=[-1.35,-0.35], Y=[0,2.20], 문 앞 바닥에는 가구를 놓지 않는다.
 */
export const DOOR_ENTRY_LIVING_DOOR = door(
  "entry-living-door",
  "ground-storey",
  -1.35,
  -0.35,
);

const FLOOR = floorOf("ground-storey");

const LIVING: IRoomSpace = {
  id: "living-room",
  owner: "rooms/living.ts",
  storey: "ground-storey",
  outline: box([-5.5, -1.95], [-6.05, -0.25]),
  floor: PALETTE.woodFloor,
  reservations: [
    { id: "living-front-curtain", kind: "fixture", x: [FRONT_WINDOWS.living.from - 0.1, FRONT_WINDOWS.living.to + 0.1], z: [MAIN.inner.z[1] - 0.12, MAIN.inner.z[1]], y: [FLOOR + 0.1, FRONT_WINDOWS.living.top + 0.12] },
    { id: "living-left-curtain", kind: "fixture", x: [MAIN.inner.x[0], MAIN.inner.x[0] + 0.12], z: [LIVING_LEFT_WINDOW.from - 0.1, LIVING_LEFT_WINDOW.to + 0.1], y: [FLOOR + 0.1, LIVING_LEFT_WINDOW.top + 0.12] },
    // living-plan: no furniture on the floor in front of entry-living-door.
    { id: "living-door-swing", kind: "swing", x: [-2.89, -1.95], z: [-1.4, -0.35] },
    // living-furniture-use.
    { id: "living-sofa", kind: "furniture", x: [-2.9, -1.95], z: [-3.75, -1.65], y: [FLOOR, FLOOR + 0.9] },
    { id: "living-table", kind: "furniture", x: [-3.95, -3.45], z: [-3.3, -2.0], y: [FLOOR, FLOOR + 0.42] },
    { id: "living-reading-chair", kind: "furniture", x: [-3.9, -3.05], z: [-5.65, -4.8], y: [FLOOR, FLOOR + 0.9] },
    { id: "living-bookcase", kind: "storage", x: [-2.3, -1.95], z: [-5.9, -4.9], y: [FLOOR, FLOOR + 1.9] },
    { id: "living-rug", kind: "covering", x: [-4.0, -2.0], z: [-3.9, -1.55], y: [FLOOR, FLOOR + 0.008] },
    { id: "living-sofa-use", kind: "use", x: [-3.45, -2.9], z: [-3.6, -1.8] },
    { id: "living-chair-use", kind: "use", x: [-3.9, -3.05], z: [-4.8, -4.2] },
    { id: "living-bookcase-use", kind: "use", x: [-2.9, -2.3], z: [-5.8, -5.0] },
    // living-through-route. The front floor's X runs from the main band's
    // left edge to the door-front zone, the two plans the text joins.
    { id: "living-main-route", kind: "route", x: [-4.9, -4.0], z: [-6.05, -1.45] },
    // living-through-route: the bookcase is reached across the floor behind the sofa,
    // Z = [-4.65, -3.75], from the main band (X = -4.00) to the bookcase use zone (X = -2.30).
    { id: "living-bookcase-cross-route", kind: "route", x: [-4.0, -2.3], z: [-4.65, -3.75] },
    { id: "living-front-route", kind: "route", x: [-4.9, -2.89], z: [-1.45, -0.45] },
  ],
};

/** Emit the living floor and the partitions 07 gives this owner. */
/**
 * @evidence spaces/rooms/living.md This export builds the front-left living room and its two assigned partition runs.
 * @evidenceReview spaces/rooms/living.md #de6670b v-141 living.ts:84-119 room box + living-entry-partition L101-109 + living-service-partition L110-117; 07-boundary-assembly.md:29.
 * @evidence spaces/rooms/living.md#living-plan The room box and entry-door void align with the partition on X=[-1.95,-1.80].
 * @evidenceReview spaces/rooms/living.md#living-plan #64a1649 v-141 box right face X=-1.95 L48; both partitions across [-1.95,-1.8] L106,115; door in the entry partition; living.md:25,27. Values literal; no derivation claimed.
 * @evidence spaces/rooms/living.md#living-furniture-use Sofa, table, reading chair, bookcase, rug, and their use rectangles are reserved in LIVING.
 * @evidenceReview spaces/rooms/living.md#living-furniture-use #89ac81c v-141 sofa, table, reading chair, bookcase, rug and sofa/chair/bookcase use L56-63 = living.md:59-66.
 * @evidence spaces/rooms/living.md#living-through-route Front, main, and bookcase-cross route bands occupy the authored floor around the furniture boxes.
 * @evidenceReview spaces/rooms/living.md#living-through-route #687df5e v-141 main X[-4.9,-4.0] Z[-6.05,-1.45], front Z[-1.45,-0.45], bookcase-cross Z[-4.65,-3.75] L66-70 = living.md:96,100; X ends of front/cross joined from stated zones (main band, door zone -2.89, bookcase use -2.30).
 * @evidence principles/core/source-units.md#source-scope-preservation It leaves furniture meshes to models and the stair's intervening wall to the stair owner.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 no furniture parts; entry partition along [-1.45,-0.25] and service partition along [-6.05,guardBack -4.71] leave Z[-4.71,-1.45] to stair.ts stair-left-ground/stair-back-ground. M5: living.ts:107 literal vs L116 derived; row claims no derivation.
 * @evidence principles/core/source-units.md#source-substantive-completion Floor, ceiling, both threshold halves, and the door-cut entry partition are returned with the room record.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 roomFloor, roomCeiling, doorFloor entry-living-door + doorFloor living-common-opening (living's two halves), living-entry-partition with hole (L87-109), plus the service partition.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Living-plan fixes entry-living-door at Z=[-1.35, -0.35], common-room-plan owns living-common-opening at X=[-5.00, -2.15], living-furniture-use assigns the seats, and living-through-route keeps the passage inside this room; buildLiving consumes both opening owners.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 living.md:27 entry-living-door; common.md:27 owns living-common-opening X=[-5.00,-2.15]; living.ts:12 imports DOOR_LIVING_COMMON_OPENING and :98 uses it. v-143 F2 closed.
 */
export const buildLiving = (): IRoomBuild => ({
  space: LIVING,
  parts: [
    roomFloor(LIVING),
    roomCeiling(LIVING),
    doorFloor(
      LIVING,
      "entry-living-door",
      [-1.95, -1.875],
      [DOOR_ENTRY_LIVING_DOOR.from, DOOR_ENTRY_LIVING_DOOR.to],
    ),
    doorFloor(
      LIVING,
      "living-common-opening",
      [DOOR_LIVING_COMMON_OPENING.from, DOOR_LIVING_COMMON_OPENING.to],
      [-6.125, -6.05],
    ),
    partition({
      id: "living-entry-partition",
      owner: LIVING.owner,
      storey: "ground-storey",
      axis: "z",
      across: [-1.95, -1.8],
      along: [-1.45, -0.25],
      holes: [DOOR_ENTRY_LIVING_DOOR],
    }),
    partition({
      id: "living-service-partition",
      owner: LIVING.owner,
      storey: "ground-storey",
      axis: "z",
      across: [-1.95, -1.8],
      along: [-6.05, STAIR_OPENING.guardBack],
    }),
  ],
});
