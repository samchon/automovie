/**
 * `garage`: the empty two-car garage interior.
 *
 * Design owner: `docs/spaces/rooms/garage-interior.md#garage-interior-plan`,
 * whose outline and inner faces come from
 * `docs/spaces/00-building.md#attached-garage-extent`: finished inner
 * X = [5.75, 11.45], Z = [-6.45, -0.55] m, floor Y = -0.15 m. The garage stays
 * empty: no car or vehicle silhouette is authored. Its concrete floor body,
 * ceiling base and shared wall are emitted by `garage.ts`; this owner emits
 * the 0.015 m ceiling finish Y = [2.55, 2.565] (09 garage-ceiling-closure).
 * Shelves and the workbench are later models.
 */
import { PALETTE } from "../palette";
import { STOREYS } from "../storeys";
import { GARAGE_FRONT_DOOR } from "../envelope/front";
import { GARAGE } from "../building";
import { box, roomCeiling, type IRoomBuild, type IRoomSpace } from "./shared";

const FLOOR = STOREYS.garageFloor;

const GARAGE_INTERIOR: IRoomSpace = {
  id: "garage",
  owner: "rooms/garage-interior.ts",
  storey: "ground-storey",
  outline: box([5.75, 11.45], [-6.45, -0.55]),
  floor: PALETTE.concrete,
  levels: [STOREYS.garageFloor, STOREYS.garageCeiling],
  reservations: [
    { id: "garage-door-overhead-guide", kind: "fixture", x: [GARAGE_FRONT_DOOR.from - 0.1, GARAGE_FRONT_DOOR.to + 0.1], z: [-3.4, GARAGE.inner.z[1]], y: [GARAGE_FRONT_DOOR.top, FLOOR + 2.65] },
    { id: "garage-door-left-rail", kind: "fixture", x: [GARAGE_FRONT_DOOR.from - 0.1, GARAGE_FRONT_DOOR.from + 0.06], z: [GARAGE.inner.z[1] - 0.17, GARAGE.inner.z[1]], y: [FLOOR, FLOOR + 2.65] },
    { id: "garage-door-right-rail", kind: "fixture", x: [GARAGE_FRONT_DOOR.to - 0.06, GARAGE_FRONT_DOOR.to + 0.1], z: [GARAGE.inner.z[1] - 0.17, GARAGE.inner.z[1]], y: [FLOOR, FLOOR + 2.65] },
    // garage-storage-use, heights stated above the garage floor Y = -0.15 and converted to world.
    // Shelf: rear inner face Z = -6.45 to -5.85, full height 2.05.
    { id: "garage-shelf", kind: "storage", x: [7.15, 8.85], z: [-6.45, -5.85], y: [FLOOR, FLOOR + 2.05] },
    { id: "garage-shelf-use", kind: "use", x: [7.15, 8.85], z: [-5.85, -4.8] },
    // Workbench: same rear depth, top 0.90; drawers pull at most 0.45 m +Z.
    { id: "garage-workbench", kind: "furniture", x: [9.0, 10.2], z: [-6.45, -5.85], y: [FLOOR, FLOOR + 0.9] },
    { id: "garage-workbench-drawers", kind: "swing", x: [9.0, 10.2], z: [-5.85, -5.4] },
    { id: "garage-workbench-use", kind: "use", x: [9.0, 10.2], z: [-5.4, -4.8] },
    // Tool board: same X, within 0.15 m of the rear wall, 1.10-2.10 above the garage floor.
    { id: "garage-tool-board", kind: "storage", x: [9.0, 10.2], z: [-6.45, -6.3], y: [FLOOR + 1.1, FLOOR + 2.1] },
    // garage-use-routes; the right limit is the inner face X = 11.45 less the 0.06 m interior
    // sill/handle projection limit of 06 external-opening-interface.
    { id: "garage-west-route", kind: "route", x: [5.95, 6.95], z: [-5.85, -0.95] },
    { id: "garage-cross-route", kind: "route", x: [5.95, 11.39], z: [-4.75, -3.85] },
    { id: "garage-window-route", kind: "route", x: [10.35, 11.39], z: [-5.85, -3.85] },
  ],
};

/** Emit the garage record and its ceiling finish (09 garage-ceiling-closure). */
/**
 * @evidence spaces/rooms/garage-interior.md This builder records the empty garage room and its visible ceiling finish.
 * @evidence spaces/rooms/garage-interior.md#garage-interior-plan Its -0.15 m floor and 2.55 m ceiling come from STOREYS while garage.ts owns structural base and shared wall.
 * @evidence spaces/rooms/garage-interior.md#garage-storage-use Shelf, workbench, drawer, and tool-board occupancy are reserved at the rear wall, without vehicle geometry.
 * @evidence spaces/rooms/garage-interior.md#garage-use-routes West, cross, and window routes remain as clear floor reservations around those storage boxes.
 * @evidence principles/core/source-units.md#source-scope-preservation It emits no car, shelf, or garage base; only its logical interior and ceiling finish leave this builder.
 * @evidence principles/core/source-units.md#source-substantive-completion The room record has explicit levels, reservations, and a real ceiling finish part.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The garage-interior parent fixes empty-floor, storage, and access roles; source needed no vehicle placement.
 */
export const buildGarageInterior = (): IRoomBuild => ({
  space: GARAGE_INTERIOR,
  parts: [roomCeiling(GARAGE_INTERIOR)],
});
