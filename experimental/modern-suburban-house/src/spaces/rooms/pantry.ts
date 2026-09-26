/**
 * `pantry`: the store room at the back of the service band.
 *
 * Design owner: `docs/spaces/rooms/pantry.md#pantry-plan`. Finished inner
 * X = [3.22, 5.50], Z = [-6.05, -4.70] m. 07 assigns this owner its partition
 * to service-access (X = [3.07, 3.22]) carrying `service-pantry-door`
 * Z = [-5.75, -4.80], Y = [0, 2.20] m. Shelves are later models.
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
import { floorOf } from "../storeys";
/** Shared void owned by this room and consumed at its floor and adjacent finish.
 * @evidence spaces/rooms/pantry.md The service-pantry-door void follows the partition assigned to pantry.
 * @evidence principles/core/source-units.md#source-scope-preservation The service-pantry-door interval remains with pantry while its adjacent room receives the span.
 * @evidence principles/core/source-units.md#source-substantive-completion The service-pantry-door span cuts its wall and sets floor finish limits on both sides.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The service-pantry-door width and position are fixed by the pantry design.
 */
export const DOOR_SERVICE_PANTRY_DOOR = door(
  "service-pantry-door",
  "ground-storey",
  -5.75,
  -4.8,
);

const FLOOR = floorOf("ground-storey");

const PANTRY: IRoomSpace = {
  id: "pantry",
  owner: "rooms/pantry.ts",
  storey: "ground-storey",
  outline: box([3.22, 5.5], [-6.05, -4.7]),
  floor: PALETTE.woodFloor,
  reservations: [
    // pantry-plan L-shelf: back band 0.25 m deep from Z = -6.05, right band 0.30 m deep from X = 5.50.
    // pantry-storage-use: one L-shaped shelf; the right band starts at the back band's front
    // so the corner is owned once. Five tops from 0.20 m at 0.40 m (top 1.80) plus the
    // 0.30 m item limit give the body height 2.10 m.
    { id: "pantry-back-shelf", kind: "storage", x: [3.22, 5.5], z: [-6.05, -5.8], y: [FLOOR, FLOOR + 2.1] },
    { id: "pantry-right-shelf", kind: "storage", x: [5.2, 5.5], z: [-5.8, -4.7], y: [FLOOR, FLOOR + 2.1] },
    // pantry-use-route: entrance X = 3.22 to the right shelf front, back shelf front to the
    // door/handle limit 0.08 m behind the +Z jamb plane Z = -4.80.
    { id: "pantry-use-route", kind: "route", x: [3.22, 5.2], z: [-5.8, -4.88] },
    // 0.90 m turning square centred 0.50 m -X of the right shelf front (X = 4.70) and on the
    // use band's Z centre (-5.34).
    { id: "pantry-turning", kind: "use", x: [4.25, 5.15], z: [-5.79, -4.89] },
  ],
};

/** Emit the pantry floor and its partition to the service band. */
/**
 * @evidence spaces/rooms/pantry.md This builder forms the narrow rear service-band pantry behind its one door.
 * @evidence spaces/rooms/pantry.md#pantry-plan PANTRY retains the 3.22..5.50 by -6.05..-4.70 interior and service-facing partition.
 * @evidence spaces/rooms/pantry.md#pantry-storage-use Separate back and right shelf reserves share their L corner once and rise to 2.10 m.
 * @evidence spaces/rooms/pantry.md#pantry-use-route A clear route and turning box remain between the open door and shelves.
 * @evidence principles/core/source-units.md#source-scope-preservation The function leaves shelves and food to models and emits only floor/ceiling finish and its door-cut wall.
 * @evidence principles/core/source-units.md#source-substantive-completion The room record and four solids include the floor under the service-pantry-door void.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The pantry parent fixes L-shelf bands, turn area, and door opening; construction found no missing access dimension.
 */
export const buildPantry = (): IRoomBuild => ({
  space: PANTRY,
  parts: [
    roomFloor(PANTRY),
    roomCeiling(PANTRY),
    doorFloor(
      PANTRY,
      "service-pantry-door",
      [3.145, 3.22],
      [DOOR_SERVICE_PANTRY_DOOR.from, DOOR_SERVICE_PANTRY_DOOR.to],
    ),
    partition({
      id: "pantry-service-partition",
      owner: PANTRY.owner,
      storey: "ground-storey",
      axis: "z",
      across: [3.07, 3.22],
      along: [-6.05, -4.7],
      holes: [DOOR_SERVICE_PANTRY_DOOR],
    }),
  ],
});
