/**
 * docs/spaces/rooms/service-yard.md#yard-volume의 열린 서비스 마당.
 * 서/동 두 문턱 모두 같은 마당 소유이며 지면/천장을 새로 만들지 않는다.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import { levelCell, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeRoofRules } from "../roofs/assembly";
import { templeLevels as y } from "../storey";

export const templeServiceYardPlan = {
  west: p.eastRoom, east: p.eastInner, north: p.northInner, south: p.yardFront,
} as const;

/** 동쪽 문턱은 외벽 바깥면까지만, 서쪽은 주랑 면까지 같은 마당이 소유한다. */
export const templeServiceYardFloor = () => roomFloorInput(
  "service-yard", [{ ...templeServiceYardPlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor,
);

export const templeServiceYard = (): IAutoMovieBuiltSpace => ({
  id: "service-yard", kind: "service-yard", parent: y.storey, fidelity: "exact",
  cells: [
    levelCell("service-yard.body", templeServiceYardPlan, y.floor, templeRoofRules.courtEave),
    ...thresholdCells("service-yard", templeDoorPassages, y.floor),
  ],
});
