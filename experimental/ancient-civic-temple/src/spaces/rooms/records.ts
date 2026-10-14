/** Middle records room and direct threshold of docs/spaces/rooms/records.md#records-volume. */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import { rectanglePolygon } from "../../geometry/planar-domain";
import { ceilingBoardFaces } from "../../geometry/roof-solids";
import { levelCell, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeLevels as y } from "../storey";

/**
 * @evidence spaces/rooms/records.md Defines the records body plan by four datums: east-room~east-inner and records-back~records-front.
 * @evidence principles/core/source-units.md#source-scope-preservation Uses only east-room, east-inner, records-back and records-front to set room ends, inventing no interior dimensions.
 * @evidence principles/core/source-units.md#source-substantive-completion One as const rectangle gives records floors, body cells and boarding ceiling the same plan between administration and storage.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Transfers the records range of rooms/records.md (east-room~east-inner, records-back~records-front) unchanged; wall and threshold interfaces fit with 0 overlap.
 */
export const templeRecordsPlan = {
  west: p.eastRoom, east: p.eastInner, north: p.recordsBack, south: p.recordsFront,
} as const;

/**
 * Solid/support inputs for the records floor and colonnade-side wall-depth threshold.
 * @evidence spaces/rooms/records.md Emits slabs and supports for the records body and colonnade-side threshold under one surface owner, surface.records.floor.
 * @evidence spaces/storey.md#threshold-support Passes the door table to roomFloorInput so records owns the east-spine door-records threshold slab across full wall depth and frame width, with support confined to the clear 1.0m width.
 * @evidence principles/core/source-units.md#source-scope-preservation Takes finished floor Y=0 and structure 0.18m from the storey and selects only door-records (centre Z=3.725) for its threshold.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns records body and door-records threshold slab/support compartments together, sharing inputs between floor-face generation and the east spine's threshold reservation.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Records floor and door-records threshold ownership hold as specified by rooms/records.md and storey.md#threshold-support; no overlap with administration/storage floors occurs under partitions, exposing no parent decision to repair.
 */
export const templeRecordsFloor = () => roomFloorInput(
  "records", [{ ...templeRecordsPlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor,
);

/**
 * @evidence spaces/rooms/records.md Emits the records space record (id records, parent temple-ground) with exact cells.
 * @evidence spaces/rooms/records.md#records-volume Combines the 4.0×3.75m records body and colonnade door threshold (door-records, centre Z=3.725) as one space; north/south shared walls remain closed.
 * @evidence principles/core/source-units.md#source-scope-preservation Uses the storey's low ceiling 3.10m as the records cell cap, without adding neighboring administration/storage areas.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns one space record containing body and door-records threshold cells; observation stations and colonnade connectors use those cells for containment.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The 4.0×3.75m range and 3.10m cap of rooms/records.md#records-volume hold unchanged; the door-records connector endpoint lies inside the room cell, exposing no parent decision to repair.
 */
export const templeRecords = (): IAutoMovieBuiltSpace => ({
  id: "records", kind: "records", parent: y.storey, fidelity: "exact",
  cells: [
    levelCell("records.body", templeRecordsPlan, y.floor, y.lowCeiling),
    ...thresholdCells("records", templeDoorPassages, y.floor),
  ],
});

/**
 * Low boarding ceiling solid. Takes underside Y=lowCeiling and the boarding
 * reserve above from storey-owned values; later members place exposed beam sections below that reserve.
 * @evidence spaces/rooms/records.md Emits the low records boarding ceiling as a plate with underside 3.10m and thickness 0.10m.
 * @evidence principles/core/source-units.md#source-scope-preservation Uses only the storey's low ceiling height and boarding reserve over the records plan; exposed shelf-supporting beams belong to later members.
 * @evidence principles/core/source-units.md#source-substantive-completion ceilingBoardFaces returns a closed 4.0×3.75m records plate with surface.records.ceiling underneath and ceiling-back on top and sides.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Using the 3.10m·0.10m reserve of rooms/records.md and storey.md unchanged, the records boarding does not overlap administration/storage ceilings above partitions; no parent decision needed repair.
 */
export const templeRecordsCeiling = () => ceilingBoardFaces(
  "records", rectanglePolygon(templeRecordsPlan), y.lowCeiling, y.ceilingBoardReserve,
);
