/** Front work room and direct threshold of docs/spaces/rooms/administration.md#office-volume. */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import { rectanglePolygon } from "../../geometry/planar-domain";
import { ceilingBoardFaces } from "../../geometry/roof-solids";
import { levelCell, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeLevels as y } from "../storey";

/**
 * @evidence spaces/rooms/administration.md Defines the administration body plan by four datums: east-room~east-inner and office-back~south-inner.
 * @evidence principles/core/source-units.md#source-scope-preservation Uses only east-room, east-inner, office-back and south-inner to set room ends, inventing no interior dimensions.
 * @evidence principles/core/source-units.md#source-substantive-completion One as const rectangle gives administration floors, body cells and boarding ceiling the same 4.0×3.75m plan.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Transfers the administration range of rooms/administration.md (east-room~east-inner, office-back~south-inner) unchanged; wall and threshold interfaces fit with 0 overlap.
 */
export const templeAdministrationPlan = {
  west: p.eastRoom, east: p.eastInner, north: p.officeBack, south: p.southInner,
} as const;

/**
 * Binds the body and direct threshold to the same complete floor surface.
 * @evidence spaces/rooms/administration.md Emits slabs and supports for the administration body and colonnade-side threshold under one surface owner, surface.administration.floor.
 * @evidence spaces/storey.md#threshold-support Passes the door table to roomFloorInput so administration owns the east-spine door-administration threshold slab across the full wall depth and frame width, with support confined to the clear 1.0m width.
 * @evidence principles/core/source-units.md#source-scope-preservation Takes finished floor Y=0 and structure 0.18m from the storey and selects only door-administration (centre Z=7.65) for its threshold.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns the administration body compartment and door-administration threshold slab/support compartments together, sharing inputs between floor-face generation and the east spine's threshold reservation.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The single administration floor compartment and door-administration threshold ownership fit the east-spine door void as specified by rooms/administration.md and storey.md#threshold-support, exposing no parent decision to repair.
 */
export const templeAdministrationFloor = () => roomFloorInput(
  "administration", [{ ...templeAdministrationPlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor,
);

/**
 * @evidence spaces/rooms/administration.md Emits the administration space record (id administration, parent temple-ground) with exact cells.
 * @evidence spaces/rooms/administration.md#office-volume Combines the 4.0×3.75m administration body and east-spine colonnade door threshold (door-administration, centre Z=7.65) as one space capped at the boarding underside.
 * @evidence principles/core/source-units.md#source-scope-preservation Uses the storey's low ceiling 3.10m as the administration cell cap, without extending beyond the records partition or adding hidden annexes.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns one space record containing body and door-administration threshold cells; observation stations and colonnade connectors use those cells for containment.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The 4.0×3.75m range, 3.10m cap and door position of rooms/administration.md#office-volume hold unchanged, and the door-administration connector endpoint lies inside the room cell, exposing no parent decision to repair.
 */
export const templeAdministration = (): IAutoMovieBuiltSpace => ({
  id: "administration", kind: "administration", parent: y.storey, fidelity: "exact",
  cells: [
    levelCell("administration.body", templeAdministrationPlan, y.floor, y.lowCeiling),
    ...thresholdCells("administration", templeDoorPassages, y.floor),
  ],
});

/**
 * Low boarding ceiling solid. Takes underside Y=lowCeiling and the boarding
 * reserve above from storey-owned values; later members place exposed beam sections below that reserve.
 * @evidence spaces/rooms/administration.md Emits the low administration boarding ceiling as a plate with underside 3.10m and thickness 0.10m.
 * @evidence principles/core/source-units.md#source-scope-preservation Uses only the storey's low ceiling height and boarding reserve over the administration plan; exposed beams belong to later members.
 * @evidence principles/core/source-units.md#source-substantive-completion ceilingBoardFaces returns a closed 4.0×3.75m administration plate with surface.administration.ceiling underneath and ceiling-back on top and sides.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Using the 3.10m·0.10m reserve of rooms/administration.md and storey.md unchanged, the administration boarding does not overlap the neighboring records ceiling above the partition; no parent decision needed repair.
 */
export const templeAdministrationCeiling = () => ceilingBoardFaces(
  "administration", rectanglePolygon(templeAdministrationPlan), y.lowCeiling, y.ceilingBoardReserve,
);
