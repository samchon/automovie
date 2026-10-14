/**
 * Sanctuary body and threshold of docs/spaces/rooms/sanctuary.md#sanctuary-volume.
 * Caps cells at the actual composite roof underside, without a flat ceiling cut.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import type { RoofPatch } from "../../geometry/planar-domain";
import { roofedCells, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeLevels as y } from "../storey";

/**
 * @evidence spaces/rooms/sanctuary.md Defines the sanctuary body plan by four datums: west-ring~east-ring and north-inner~sanctuary-front.
 * @evidence principles/core/source-units.md#source-scope-preservation Uses only west-ring, east-ring, north-inner and sanctuary-front to set room ends, inventing no altar-step or niche dimension.
 * @evidence principles/core/source-units.md#source-substantive-completion One as const rectangle gives sanctuary floors and roof-underside cells the same plan.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Transfers the sanctuary range of rooms/sanctuary.md (west-ring~east-ring, north-inner~sanctuary-front) unchanged; wall and threshold interfaces fit with 0 overlap.
 */
export const templeSanctuaryPlan = {
  west: p.westRing, east: p.eastRing, north: p.northInner, south: p.sanctuaryFront,
} as const;

/**
 * Makes only the sanctuary body and existing threshold, without inventing a local altar step.
 * @evidence spaces/rooms/sanctuary.md Emits slabs and supports for the sanctuary body and colonnade-side double-door threshold under one surface owner, surface.sanctuary.floor.
 * @evidence spaces/storey.md#threshold-support Passes the door table to roomFloorInput so sanctuary owns the south door-sanctuary threshold slab across full wall depth and frame width, with support confined to the clear 1.4m width.
 * @evidence principles/core/source-units.md#source-scope-preservation Takes finished floor Y=0 and structure 0.18m from the storey, selecting only the south door with room=sanctuary for its threshold and inventing no local altar step.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns sanctuary body and door-sanctuary threshold slab/support compartments together, sharing inputs between floor-face generation and the south boundary's threshold reservation.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Sanctuary floor and door-sanctuary threshold ownership fit the south-boundary door void as specified by rooms/sanctuary.md and storey.md#threshold-support; the flat-floor decision without an altar step exposed nothing to repair.
 */
export const templeSanctuaryFloor = () => roomFloorInput(
  "sanctuary", [{ ...templeSanctuaryPlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor,
);

/**
 * @evidence spaces/rooms/sanctuary.md Emits the sanctuary space record (id sanctuary, parent temple-ground) with exact cells.
 * @evidence spaces/rooms/sanctuary.md#sanctuary-volume Combines the 11.2×5.5m sanctuary body split by two roof patches and the south-wall double-door threshold (door-sanctuary, width 1.4m) as one space.
 * @evidence principles/core/source-units.md#source-scope-preservation Uses the composite sanctuary roof underside rather than a flat ceiling as the cell cap, without adding exterior areas or hidden annexes.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns body cells partitioned by roofedCells per sanctuary roof patch together with door-sanctuary threshold cells; caps follow the composite roof underside rather than a flat ceiling.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The 11.2×5.5m range and roof-underside cap of rooms/sanctuary.md#sanctuary-volume hold unchanged; the door-sanctuary connector endpoint lies inside the room cell. The clerestory-binding defect was repaired in openings.md rather than this room (c7af729c).
 */
export const templeSanctuary = (roof: readonly RoofPatch[]): IAutoMovieBuiltSpace => ({
  id: "sanctuary", kind: "sanctuary", parent: y.storey, fidelity: "exact",
  cells: [
    ...roofedCells("sanctuary.body", templeSanctuaryPlan, y.floor, roof.filter((patch) => patch.tier === "sanctuary")),
    ...thresholdCells("sanctuary", templeDoorPassages, y.floor),
  ],
});
