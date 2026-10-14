/**
 * One loop Intersections of six
 * plan regions with composite roof undersides divide cells without adding rooms
 * or walls. This file retains sole colonnade surface ownership; member collision is separate.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import type { RoofPatch } from "../../geometry/planar-domain";
import { roofedCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeLevels as y } from "../storey";
export const templeColonnadeRegions = [
  { id: "north", west: p.westRing, east: p.eastRing, north: p.northRing, south: p.courtBack },
  { id: "west", west: p.westRing, east: p.westCourt, north: p.courtBack, south: p.courtFront },
  { id: "east", west: p.eastCourt, east: p.eastRing, north: p.courtBack, south: p.courtFront },
  { id: "south", west: p.westRing, east: p.eastRing, north: p.courtFront, south: p.entranceBack },
  { id: "southwest", west: p.westRing, east: p.westPorchOuter, north: p.entranceBack, south: p.southInner },
  { id: "southeast", west: p.eastPorchOuter, east: p.eastRing, north: p.entranceBack, south: p.southInner },
] as const;

/**
 * One-loop floor inputs without turning cell division lines into physical seams.
 */
export const templeColonnadeFloor = () => roomFloorInput(
  "colonnade", templeColonnadeRegions.map((region) => ({ ...region, floor: y.floor })),
  [], y.slabThickness, y.floor,
);
export const templeColonnade = (roof: readonly RoofPatch[]): IAutoMovieBuiltSpace => ({
  id: "colonnade", kind: "colonnade", parent: y.storey, fidelity: "exact",
  cells: templeColonnadeRegions.flatMap((region) => roofedCells(
    `colonnade.${region.id}`, region, y.floor, roof.filter((patch) => patch.tier === "wing"),
  )),
});
