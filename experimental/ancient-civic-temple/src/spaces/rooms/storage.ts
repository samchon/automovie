/** docs/spaces/rooms/storage.md#storage-volume의 후면 보관실과 직접 문턱. */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import { rectanglePolygon } from "../../geometry/planar-domain";
import { ceilingBoardFaces } from "../../geometry/roof-solids";
import { levelCell, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeLevels as y } from "../storey";

export const templeStoragePlan = {
  west: p.eastRoom, east: p.eastInner, north: p.storageBack, south: p.storageFront,
} as const;

/** 보관실 본체와 반입 문턱이 같은 Y=0 지지면에서 이어진다. */
export const templeStorageFloor = () => roomFloorInput(
  "storage", [{ ...templeStoragePlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor,
);

export const templeStorage = (): IAutoMovieBuiltSpace => ({
  id: "storage", kind: "storage", parent: y.storey, fidelity: "exact",
  cells: [
    levelCell("storage.body", templeStoragePlan, y.floor, y.lowCeiling),
    ...thresholdCells("storage", templeDoorPassages, y.floor),
  ],
});

/**
 * 낮은 널판 천장 실체. 아랫면 Y=lowCeiling과 위쪽 널판 예약은 층 소유
 * 값을 소비하며 노출 보의 단면은 후속 부재 단계가 이 예약 아래에 둔다.
 */
export const templeStorageCeiling = () => ceilingBoardFaces(
  "storage", rectanglePolygon(templeStoragePlan), y.lowCeiling, y.ceilingBoardReserve,
);
