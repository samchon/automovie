/**
 * Recessed porch and two steps of docs/spaces/rooms/entrance.md#entrance-volume.
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

/**
 * @evidence spaces/rooms/entrance.md Holds the two-step stone stair's width 1.8m, tread 0.35m and rise 0.12m.
 * @evidence principles/core/source-units.md#source-scope-preservation Holds stair dimensions only; circulation consumes the route.
 * @evidence principles/core/source-units.md#source-substantive-completion The as const values give floor compartments and the stair connector the same dimensions.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Transfers 1.8·0.35·0.12m from rooms/entrance.md#entrance-volume unchanged.
 */
export const templeEntranceSteps = { width: 1.8, tread: 0.35, rise: 0.12 } as const;

/**
 * The second tread and landing share one level face without an extra riser.
 * @evidence spaces/rooms/entrance.md Emits finished heights for four compartments: first tread, upper landing combining second tread and landing, and two side supports.
 * @evidence principles/core/source-units.md#source-scope-preservation Adds no riser between second tread and landing; applies half the stair width to each side of the axis.
 * @evidence principles/core/source-units.md#source-substantive-completion The compartment list carries IDs, ranges and finishes shared by floor slabs and cell bottoms.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements the rooms/entrance.md interval table unchanged: first tread -0.12, landing/supports 0.
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
 * @evidence spaces/rooms/entrance.md Emits floor inputs for four entrance compartments and the recessed-wall threshold, extending ground-contact structure at south-outer to the common exterior-wall bottom.
 * @evidence principles/core/source-units.md#source-scope-preservation Uses only the caller's exterior-wall bottom and creates no ground here.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns default-thickness inputs for null, or lowers front compartment bottoms when a value is supplied.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements front stone-step ground contact from rooms/entrance.md#entrance-volume and storey.md#wall-ground-contact unchanged.
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

/**
 * @evidence spaces/rooms/entrance.md Emits the entrance space record (id entrance) as compartment-specific porch-underside cells and threshold cells.
 * @evidence spaces/rooms/entrance.md#entrance-volume Uses each compartment's actual finish as its cell bottom and composite porch underside as its cap, excluding stone interiors from space.
 * @evidence principles/core/source-units.md#source-scope-preservation Does not copy the stair's minimum height across the complete entrance.
 * @evidence principles/core/source-units.md#source-substantive-completion roofedCells checks porch-roof coverage and returns the space with threshold cells added.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements the compartments, cap and threshold of rooms/entrance.md#entrance-volume unchanged.
 */
export const templeEntrance = (roof: readonly RoofPatch[]): IAutoMovieBuiltSpace => ({
  id: "entrance", kind: "entrance", parent: y.storey, fidelity: "exact",
  cells: [
    ...templeEntranceFloors().flatMap((region) => roofedCells(
      `entrance.${region.id}`, region, region.floor, roof.filter((patch) => patch.tier === "porch"),
    )),
    ...thresholdCells("entrance", templeDoorPassages, y.floor),
  ],
});
