/**
 * Recessed porch and two steps
 * Uses each actual finished height as its cell bottom, excluding stone interiors
 * from space. The tread/landing inputs below are sole owners consumed unchanged by floor geometry.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import type { RoofPatch } from "../../geometry/planar-domain";
import { roofedCells, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeLevels as y } from "../storey";
export const templeEntranceSteps = { width: 1.8, tread: 0.35, rise: 0.12 } as const;

/**
 * The second tread and landing share one level face without an extra riser.
 */
export const templeEntranceFloors = () => {
  const half = templeEntranceSteps.width / 2;
  const firstBack = p.southOuter - templeEntranceSteps.tread;
  return [
    { id: "first-tread", west: -half, east: half, north: firstBack, south: p.southOuter,
      floor: y.publicRoad + templeEntranceSteps.rise },
    { id: "upper-landing", west: -half, east: half, north: p.entranceFront, south: firstBack,
      floor: y.floor },
    { id: "west-support", west: p.westPorchInner, east: -half,
      north: p.entranceFront, south: p.southOuter, floor: y.floor },
    { id: "east-support", west: half, east: p.eastPorchInner,
      north: p.entranceFront, south: p.southOuter, floor: y.floor },
  ];
};

/**
 * Returns actual step heights, side column supports and the recessed-wall threshold together.
 * Compartments touching site ground at south-outer extend structure to the common exterior-wall bottom.
 */
export const templeEntranceFloor = (exteriorBottom: number | null) => {
  const input = roomFloorInput("entrance", templeEntranceFloors(), templeDoorPassages, y.slabThickness, y.floor);
  if (exteriorBottom === null) return input;
  return {
    ...input,
    slabs: input.slabs.map((slab) => slab.south === p.southOuter
      ? { ...slab, bottom: Math.min(slab.bottom, exteriorBottom) } : slab),
  };
};
export const templeEntrance = (roof: readonly RoofPatch[]): IAutoMovieBuiltSpace => ({
  id: "entrance", kind: "entrance", parent: y.storey, fidelity: "exact",
  cells: [
    ...templeEntranceFloors().flatMap((region) => roofedCells(
      `entrance.${region.id}`, region, region.floor, roof.filter((patch) => patch.tier === "porch"),
    )),
    ...thresholdCells("entrance", templeDoorPassages, y.floor),
  ],
});
