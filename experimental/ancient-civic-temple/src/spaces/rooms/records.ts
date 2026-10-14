/** Middle records room and direct threshold */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import { rectanglePolygon } from "../../geometry/planar-domain";
import { ceilingBoardFaces } from "../../geometry/roof-solids";
import { levelCell, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeLevels as y } from "../storey";
export const templeRecordsPlan = {
  west: p.eastRoom, east: p.eastInner, north: p.recordsBack, south: p.recordsFront,
} as const;

/**
 * Solid/support inputs for the records floor and colonnade-side wall-depth threshold.
 */
export const templeRecordsFloor = () => roomFloorInput(
  "records", [{ ...templeRecordsPlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor,
);
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
 */
export const templeRecordsCeiling = () => ceilingBoardFaces(
  "records", rectanglePolygon(templeRecordsPlan), y.lowCeiling, y.ceilingBoardReserve,
);
