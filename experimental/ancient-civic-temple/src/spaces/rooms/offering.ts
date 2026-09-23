/**
 * docs/spaces/rooms/offering.md#offering-volume의 긴 한 방.
 * 낮은 천장과 벽 두께 안의 문턱을 포함하며 숨은 후실은 만들지 않는다.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import { rectanglePolygon } from "../../geometry/planar-domain";
import { ceilingBoardFaces } from "../../geometry/roof-solids";
import { levelCell, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeLevels as y } from "../storey";

export const templeOfferingPlan = {
  west: p.westInner, east: p.westRoom, north: p.northInner, south: p.southInner,
} as const;

/** 긴 방 본체와 동쪽 문턱의 바닥을 하나의 소유로 반환한다. */
export const templeOfferingFloor = () => roomFloorInput(
  "offering", [{ ...templeOfferingPlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor,
);

export const templeOffering = (): IAutoMovieBuiltSpace => ({
  id: "offering", kind: "offering", parent: y.storey, fidelity: "exact",
  cells: [
    levelCell("offering.body", templeOfferingPlan, y.floor, y.lowCeiling),
    ...thresholdCells("offering", templeDoorPassages, y.floor),
  ],
});

/**
 * 낮은 널판 천장 실체. 아랫면 Y=lowCeiling과 위쪽 널판 예약은 층 소유
 * 값을 소비하며 노출 보의 단면은 후속 부재 단계가 이 예약 아래에 둔다.
 */
export const templeOfferingCeiling = () => ceilingBoardFaces(
  "offering", rectanglePolygon(templeOfferingPlan), y.lowCeiling, y.ceilingBoardReserve,
);
