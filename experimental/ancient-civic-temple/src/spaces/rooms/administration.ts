/** docs/spaces/rooms/administration.md#office-volume의 전면 업무방과 직접 문턱. */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import { rectanglePolygon } from "../../geometry/planar-domain";
import { ceilingBoardFaces } from "../../geometry/roof-solids";
import { levelCell, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeLevels as y } from "../storey";

export const templeAdministrationPlan = {
  west: p.eastRoom, east: p.eastInner, north: p.officeBack, south: p.southInner,
} as const;

/** 본체와 직접 문턱을 같은 완결 바닥 표면에 결속한다. */
export const templeAdministrationFloor = () => roomFloorInput(
  "administration", [{ ...templeAdministrationPlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor,
);

export const templeAdministration = (): IAutoMovieBuiltSpace => ({
  id: "administration", kind: "administration", parent: y.storey, fidelity: "exact",
  cells: [
    levelCell("administration.body", templeAdministrationPlan, y.floor, y.lowCeiling),
    ...thresholdCells("administration", templeDoorPassages, y.floor),
  ],
});

/**
 * 낮은 널판 천장 실체. 아랫면 Y=lowCeiling과 위쪽 널판 예약은 층 소유
 * 값을 소비하며 노출 보의 단면은 후속 부재 단계가 이 예약 아래에 둔다.
 */
export const templeAdministrationCeiling = () => ceilingBoardFaces(
  "administration", rectanglePolygon(templeAdministrationPlan), y.lowCeiling, y.ceilingBoardReserve,
);
