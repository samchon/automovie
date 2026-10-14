/**
 * One long room from docs/spaces/rooms/offering.md#offering-volume.
 * Includes a low ceiling and wall-depth threshold without a hidden rear room.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import { rectanglePolygon } from "../../geometry/planar-domain";
import { ceilingBoardFaces } from "../../geometry/roof-solids";
import { levelCell, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeLevels as y } from "../storey";

/**
 * @evidence spaces/rooms/offering.md Defines the offering body plan by four datums: west-inner~west-room and north-inner~south-inner.
 * @evidence principles/core/source-units.md#source-scope-preservation Uses only west-inner, west-room, north-inner and south-inner to set room ends, without dividing the long room into a rear chamber.
 * @evidence principles/core/source-units.md#source-substantive-completion One as const rectangle gives offering floors, body cells and boarding ceiling the same plan along the complete west wing.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Transfers the offering range of rooms/offering.md (west-inner~west-room, north-inner~south-inner) unchanged; wall and threshold interfaces fit with 0 overlap.
 */
export const templeOfferingPlan = {
  west: p.westInner, east: p.westRoom, north: p.northInner, south: p.southInner,
} as const;

/**
 * Returns the long room body floor and east threshold under one owner.
 * @evidence spaces/rooms/offering.md Emits slabs and supports for the offering body and colonnade-side threshold under one surface owner, surface.offering.floor.
 * @evidence spaces/storey.md#threshold-support Passes the door table to roomFloorInput so offering owns the west-spine door-offering threshold slab across full wall depth and frame width, with support confined to the clear 1.2m width.
 * @evidence principles/core/source-units.md#source-scope-preservation Takes finished floor Y=0 and structure 0.18m from the storey and selects only the east door with room=offering for its threshold.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns offering body and door-offering threshold slab/support compartments together, sharing inputs between floor-face generation and the west spine's threshold reservation.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The offering room's 19.3m-long floor and door-offering threshold ownership fit the west-spine door void as specified by rooms/offering.md and storey.md#threshold-support, exposing no parent decision to repair.
 */
export const templeOfferingFloor = () => roomFloorInput(
  "offering", [{ ...templeOfferingPlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor,
);

/**
 * @evidence spaces/rooms/offering.md Emits the offering space record (id offering, parent temple-ground) with exact cells.
 * @evidence spaces/rooms/offering.md#offering-volume Combines one long 4.0×19.3m room and its west-spine colonnade-door threshold (door-offering, width 1.2m, centre Z=2.175) as one space without a rear chamber.
 * @evidence principles/core/source-units.md#source-scope-preservation Uses the storey's low ceiling 3.10m as the offering cell cap, without adding areas beyond the long room or hidden rear chambers.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns one space record containing body and door-offering threshold cells; observation stations and colonnade connectors use those cells for containment.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The 4.0×19.3m range, 3.10m cap and absence of a rear chamber from rooms/offering.md#offering-volume hold unchanged; the door-offering connector endpoint lies inside the room cell, exposing no parent decision to repair.
 */
export const templeOffering = (): IAutoMovieBuiltSpace => ({
  id: "offering", kind: "offering", parent: y.storey, fidelity: "exact",
  cells: [
    levelCell("offering.body", templeOfferingPlan, y.floor, y.lowCeiling),
    ...thresholdCells("offering", templeDoorPassages, y.floor),
  ],
});

/**
 * Low boarding ceiling solid. Takes underside Y=lowCeiling and the boarding
 * reserve above from storey-owned values; later members place exposed beam sections below that reserve.
 * @evidence spaces/rooms/offering.md Emits the low offering boarding ceiling as a plate with underside 3.10m and thickness 0.10m.
 * @evidence principles/core/source-units.md#source-scope-preservation Uses only the storey's low ceiling height and boarding reserve over the complete offering plan; exposed beams belong to later members.
 * @evidence principles/core/source-units.md#source-substantive-completion ceilingBoardFaces returns a closed full-length 4.0×19.3m offering plate with surface.offering.ceiling underneath and ceiling-back on top and sides.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Using the 3.10m·0.10m reserve of rooms/offering.md and storey.md unchanged, the offering boarding fits below the west-wing roof underside; no parent decision needed repair.
 */
export const templeOfferingCeiling = () => ceilingBoardFaces(
  "offering", rectanglePolygon(templeOfferingPlan), y.lowCeiling, y.ceilingBoardReserve,
);
