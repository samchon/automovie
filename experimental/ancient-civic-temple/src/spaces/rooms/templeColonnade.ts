/**
 * One loop Intersections of six
 * plan regions with composite roof undersides divide cells without adding rooms
 * or walls. This file retains sole colonnade surface ownership; member collision is separate.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import type { RoofPatch } from "../../geometry/RoofPatch";
import { roofedCells } from "../../geometry/roofedCells";
import { templeLevels as y } from "../templeLevels";
import { templeColonnadeRegions } from "./templeColonnadeRegions";
export const templeColonnade = (roof: readonly RoofPatch[]): IAutoMovieBuiltSpace => ({
  id: "colonnade", kind: "colonnade", parent: y.storey, fidelity: "exact",
  cells: templeColonnadeRegions.flatMap((region) => roofedCells(
    `colonnade.${region.id}`, region, y.floor, roof.filter((patch) => patch.tier === "wing"),
  )),
});
