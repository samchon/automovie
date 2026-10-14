/**
 * One loop from docs/spaces/rooms/colonnade.md#ring-volume. Intersections of six
 * plan regions with composite roof undersides divide cells without adding rooms
 * or walls. This file retains sole colonnade surface ownership; member collision is separate.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import type { RoofPatch } from "../../geometry/planar-domain";
import { roofedCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeLevels as y } from "../storey";

/**
 * @evidence spaces/rooms/colonnade.md Defines the colonnade loop as six plan regions: north, west, east, south and the two entrance sides.
 * @evidence principles/core/source-units.md#source-scope-preservation Sets region ends only from datums; boundaries divide cells without adding rooms or walls.
 * @evidence principles/core/source-units.md#source-substantive-completion Six ID-bearing rectangles give floors, cells and observation region centres the same decomposition.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Transfers the six regions of rooms/colonnade.md#ring-volume unchanged; their union leaves the courtyard hole and entrance body empty.
 */
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
 * @evidence spaces/rooms/colonnade.md Emits six regions as Y=0 slabs under the single loop-floor owner surface.colonnade.floor.
 * @evidence principles/core/source-units.md#source-scope-preservation Makes no physical seam at region boundaries and no colonnade thresholds, which belong to individual rooms.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns six floor compartments; irregular-grid face generation makes one slab without interior interfaces.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements the loop floor of rooms/colonnade.md and room-owned thresholds of storey.md#threshold-support unchanged.
 */
export const templeColonnadeFloor = () => roomFloorInput(
  "colonnade", templeColonnadeRegions.map((region) => ({ ...region, floor: y.floor })),
  [], y.slabThickness, y.floor,
);

/**
 * @evidence spaces/rooms/colonnade.md Emits the colonnade space record (id colonnade) as exact cells over six regions × wing-roof patches.
 * @evidence spaces/rooms/colonnade.md#ring-volume Represents one loop with a hole as intersections of regions and composite wing-roof undersides, refusing insufficient coverage.
 * @evidence principles/core/source-units.md#source-scope-preservation Caps cells at actual wing-roof undersides, without extending them above the courtyard or into rooms.
 * @evidence principles/core/source-units.md#source-substantive-completion roofedCells checks roof coverage per region, stops on insufficiency and otherwise returns the space with all cells.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements the single space, six regions and roof-underside cap of rooms/colonnade.md#ring-volume unchanged.
 */
export const templeColonnade = (roof: readonly RoofPatch[]): IAutoMovieBuiltSpace => ({
  id: "colonnade", kind: "colonnade", parent: y.storey, fidelity: "exact",
  cells: templeColonnadeRegions.flatMap((region) => roofedCells(
    `colonnade.${region.id}`, region, y.floor, roof.filter((patch) => patch.tier === "wing"),
  )),
});
