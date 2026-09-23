/** docs/spaces/rooms/records.md#records-volume의 중앙 기록실과 직접 문턱. */
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

/** 기록실 바닥과 주랑 쪽 wall-depth 문턱의 실체/support 입력. */
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
 * 낮은 널판 천장 실체. 아랫면 Y=lowCeiling과 위쪽 널판 예약은 층 소유
 * 값을 소비하며 노출 보의 단면은 후속 부재 단계가 이 예약 아래에 둔다.
 */
export const templeRecordsCeiling = () => ceilingBoardFaces(
  "records", rectanglePolygon(templeRecordsPlan), y.lowCeiling, y.ceilingBoardReserve,
);
