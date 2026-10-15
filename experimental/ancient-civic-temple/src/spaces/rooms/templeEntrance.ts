/**
 * Recessed porch and two steps
 * Uses each actual finished height as its cell bottom, excluding stone interiors
 * from space. The tread/landing inputs below are sole owners consumed unchanged by floor geometry.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import type { RoofPatch } from "../../geometry/RoofPatch";
import { thresholdCells } from "../../geometry/thresholdCells";
import { roofedCells } from "../../geometry/roofedCells";
import { templeDoorPassages } from "../templeDoorPassages";
import { templeLevels as y } from "../templeLevels";
import { templeEntranceFloors } from "./templeEntranceFloors";
export const templeEntrance = (roof: readonly RoofPatch[]): IAutoMovieBuiltSpace => ({
  id: "entrance", kind: "entrance", parent: y.storey, fidelity: "exact",
  cells: [
    ...templeEntranceFloors().flatMap((region) => roofedCells(
      `entrance.${region.id}`, region, region.floor, roof.filter((patch) => patch.tier === "porch"),
    )),
    ...thresholdCells("entrance", templeDoorPassages, y.floor),
  ],
});
