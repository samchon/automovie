/**
 * `tub-bathroom`: the second upper bathroom at the end of the hall.
 *
 * Design owner: `docs/spaces/rooms/tub-bath.md#tub-bath-plan`. Finished inner
 * X = [3.22, 5.50], Z = [-8.80, -4.71] m. 07 assigns this owner its partitions
 * to the hall and shower bathroom (X = [3.07, 3.22], carrying `hall-tub-door`
 * Z = [-5.86, -4.86], Y = [3.06, 5.26] m) and to bedroom-three
 * (Z = [-4.71, -4.56], from X = 3.22). Under 07 interior-boundary-junctions the
 * X = [3.07, 3.22] run is split: this owner takes the wardrobe corner
 * Z = [-8.95, -8.80], while the shower-bath corner Z = [-6.06, -5.91] and the
 * bedroom-three corner Z = [-4.71, -4.56] belong to those owners. Fixtures are
 * later models.
 */
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
import { ceilingOf, floorOf } from "../storeys";
import { STAIR_OPENING } from "../stair";
/** Shared void owned by this room and consumed at its floor and adjacent finish.
 * @evidence spaces/rooms/tub-bath.md The hall-tub-door void follows the partition assigned to tub-bath.
 * @evidenceReview spaces/rooms/tub-bath.md #47f49cb `DOOR_HALL_TUB_DOOR` fixes the plan's left-wall Z = [-5.86, -4.86] opening and is used as the sole hole of the tub-owned hall partition.
 * @evidence principles/core/source-units.md#source-scope-preservation The hall-tub-door interval remains with tub-bath while its adjacent room receives the span.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The tub room exports its hall-door span; `buildUpperHall` imports `from` and `to` for the adjacent floor finish without defining another bathroom entrance.
 * @evidence principles/core/source-units.md#source-substantive-completion The hall-tub-door span cuts its wall and sets floor finish limits on both sides.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `buildTubBath` cuts `tub-hall-partition` with this door and finishes X = [3.145, 3.22]; `buildUpperHall` finishes X = [3.07, 3.145] using the same Z interval.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Tub-bath-plan places hall-tub-door in the left corridor wall at Z=[-5.86, -4.86], Y=[3.06, 5.26], apart from the shower room; this export carries its Z cut.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `tub-bath-plan` gives the hall-facing section of X = [3.07, 3.22] one rough opening at Z = [-5.86, -4.86], Y = [3.06, 5.26]; this upper-storey `door` carries that span without a shower or bedroom passage.
 */
export const DOOR_HALL_TUB_DOOR = door(
  "hall-tub-door",
  "upper-storey",
  -5.86,
  -4.86,
);

const FLOOR = floorOf("upper-storey");

const TUB_BATH: IRoomSpace = {
  id: "tub-bathroom",
  owner: "rooms/tub-bath.ts",
  storey: "upper-storey",
  outline: box([3.22, 5.5], [-8.8, STAIR_OPENING.guardBack]),
  floor: PALETTE.tile,
  // tub-bath.md#tub-fixture-use; right ends are the inner face X = 5.50, heights above the upper floor (+3.06).
  reservations: [
    { id: "tub-bathroom-vanity", kind: "fixture", x: [4.95, 5.5], z: [-5.75, -4.9], y: [FLOOR, FLOOR + 0.85] },
    { id: "tub-bathroom-vanity-use", kind: "use", x: [4.3, 4.95], z: [-5.7, -4.95] },
    { id: "tub-bathroom-toilet", kind: "fixture", x: [4.75, 5.5], z: [-6.65, -5.95], y: [FLOOR, FLOOR + 0.82] },
    { id: "tub-bathroom-toilet-use", kind: "use", x: [4.25, 4.75], z: [-6.6, -6.0] },
    { id: "tub-bathroom-tub", kind: "fixture", x: [4.7, 5.5], z: [-8.7, -6.9], y: [FLOOR, FLOOR + 0.55] },
    { id: "tub-bathroom-curtain-rail", kind: "fixture", x: [4.7, 4.8], z: [-8.7, -6.9], y: [FLOOR + 0.6, ceilingOf("upper-storey")] },
    { id: "tub-bathroom-tub-use", kind: "use", x: [3.65, 4.7], z: [-8.55, -7.0] },
    { id: "tub-bathroom-main-route", kind: "route", x: [3.32, 4.22], z: [-8.7, -5.0] },
    // Left wall (X = 3.22), projection at most 0.08, height 1.10-1.50.
    { id: "tub-bathroom-towel", kind: "fixture", x: [3.22, 3.3], z: [-6.85, -6.1], y: [FLOOR + 1.1, FLOOR + 1.5] },
    // Right wall (X = 5.50) over the vanity's Z width, projection at most 0.04, height 1.10-1.90.
    { id: "tub-bathroom-mirror", kind: "fixture", x: [5.46, 5.5], z: [-5.75, -4.9], y: [FLOOR + 1.1, FLOOR + 1.9] },
  ],
};

/**
 * @evidence spaces/rooms/tub-bath.md This builder owns the long upper tub bathroom at the hall end.
 * @evidenceReview spaces/rooms/tub-bath.md #47f49cb `TUB_BATH.outline` uses the plan's X = [3.22, 5.50] and rear Z = -8.80 up to `STAIR_OPENING.guardBack`; `buildTubBath` returns its long independent upper-floor room and parts.
 * @evidence spaces/rooms/tub-bath.md#tub-bath-plan It cuts one hall door and closes the shower-side and bedroom-three-side runs at their assigned corners.
 * @evidenceReview spaces/rooms/tub-bath.md#tub-bath-plan #03995d0 `tub-hall-partition` alone has `DOOR_HALL_TUB_DOOR`; the shower-side and bedroom-three-side partitions have no holes and stop at their assigned junction edges.
 * @evidence spaces/rooms/tub-bath.md#tub-fixture-use Vanity, toilet, tub, towel, mirror, and their use/route areas remain separately reserved.
 * @evidenceReview spaces/rooms/tub-bath.md#tub-fixture-use #477e768 `TUB_BATH.reservations` separates vanity, toilet and tub body boxes from their use zones and the X = [3.32, 4.22] route; towel, mirror and curtain-rail boxes follow the specified walls.
 * @evidence principles/core/source-units.md#source-scope-preservation The function emits tile finish and three walls without authoring sanitary fixtures or stealing adjacent T corners.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The builder emits tile floor, ceiling, hall-door finish and three partition parts; sanitary fixtures stay in reservations, and the hall run ends at the bedroom-three junction.
 * @evidence principles/core/source-units.md#source-substantive-completion The return contains the room, floor/ceiling, door strip, and three concrete partition parts.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `buildTubBath` returns one room record plus floor, ceiling, hall door strip and three concrete partitions, with a hole for the only hall entrance.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Tub-bath-plan gives one hall-tub-door, and tub-fixture-use places the long left route beside basin, toilet, bath, and curtain-rail reservations.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `buildTubBath` keeps the single hall door and closed shower/bedroom partitions from `tub-bath-plan`, and reserves the left route beside the vanity, toilet, tub and curtain band from `tub-fixture-use`.
 */
export const buildTubBath = (): IRoomBuild => ({
  space: TUB_BATH,
  parts: [
    roomFloor(TUB_BATH),
    roomCeiling(TUB_BATH),
    doorFloor(
      TUB_BATH,
      "hall-tub-door",
      [3.145, 3.22],
      [DOOR_HALL_TUB_DOOR.from, DOOR_HALL_TUB_DOOR.to],
    ),
    partition({
      id: "tub-hall-partition",
      owner: TUB_BATH.owner,
      storey: "upper-storey",
      axis: "z",
      across: [3.07, 3.22],
      along: [-5.91, STAIR_OPENING.guardBack],
      holes: [DOOR_HALL_TUB_DOOR],
    }),
    partition({
      id: "tub-shower-partition",
      owner: TUB_BATH.owner,
      storey: "upper-storey",
      axis: "z",
      across: [3.07, 3.22],
      along: [-8.95, -6.06],
    }),
    partition({
      id: "tub-bedroom-three-partition",
      owner: TUB_BATH.owner,
      storey: "upper-storey",
      axis: "x",
      across: [STAIR_OPENING.guardBack, STAIR_OPENING.back],
      along: [3.22, 5.5],
    }),
  ],
});
