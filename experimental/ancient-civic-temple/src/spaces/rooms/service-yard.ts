/**
 * docs/spaces/rooms/service-yard.md#yard-volume의 열린 서비스 마당.
 * 서/동 두 문턱 모두 같은 마당 소유이며 지면/천장을 새로 만들지 않는다.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { levelCell, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeRoofRules } from "../roofs/assembly";
import { templeLevels as y } from "../storey";

export const templeServiceYardPlan = {
  west: p.eastRoom, east: p.eastInner, north: p.northInner, south: p.yardFront,
} as const;

export const templeServiceYard = (): IAutoMovieBuiltSpace => ({
  id: "service-yard", kind: "service-yard", parent: y.storey, fidelity: "exact",
  cells: [
    levelCell("service-yard.body", templeServiceYardPlan, y.floor, templeRoofRules.supportHeight),
    ...thresholdCells("service-yard", templeDoorPassages, y.floor),
  ],
});
