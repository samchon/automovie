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
import { type IRoomBuild, type IRoomSpace, box, roomCeiling } from "./shared";

const GARAGE_INTERIOR: IRoomSpace = {
  id: "garage",
  owner: "rooms/garage-interior.ts",
  storey: "ground-storey",
  outline: box([5.75, 11.45], [-6.45, -0.55]),
  floor: PALETTE.concrete,
  levels: [STOREYS.garageFloor, STOREYS.garageCeiling],
};

/** Emit the garage record and its ceiling finish (09 garage-ceiling-closure). */
export const buildGarageInterior = (): IRoomBuild => ({
  space: GARAGE_INTERIOR,
  parts: [roomCeiling(GARAGE_INTERIOR)],
});
