/**
 * docs/spaces/rooms/entrance.md#entrance-volume의 후퇴 포치와 두 단.
 * 석재 내부를 공간에 넣지 않도록 각 실제 완성면을 cell 하한으로 쓴다.
 * 아래 디딤/참 입력은 이후 바닥 geometry가 그대로 소비할 단독 소유다.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import type { RoofPatch } from "../../geometry/planar-domain";
import { roofedCells, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeRoofRules } from "../roofs/assembly";
import { templeLevels as y } from "../storey";

export const templeEntranceSteps = { width: 1.8, tread: 0.35, rise: 0.12 } as const;

/** 둘째 디딤과 참은 같은 높이의 한 면이며 추가 챌면을 만들지 않는다. */
export const templeEntranceFloors = () => {
  const half = templeEntranceSteps.width / 2;
  const firstBack = p.southOuter - templeEntranceSteps.tread;
  return [
    { id: "first-tread", west: -half, east: half, north: firstBack, south: p.southOuter,
      floor: y.publicRoad + templeEntranceSteps.rise },
    { id: "upper-landing", west: -half, east: half, north: p.entranceFront, south: firstBack,
      floor: y.floor },
    { id: "west-support", west: p.westPorchInner, east: -half,
      north: p.entranceFront, south: p.southOuter, floor: y.floor },
    { id: "east-support", west: half, east: p.eastPorchInner,
      north: p.entranceFront, south: p.southOuter, floor: y.floor },
  ];
};

export const templeEntrance = (roof: readonly RoofPatch[]): IAutoMovieBuiltSpace => ({
  id: "entrance", kind: "entrance", parent: y.storey, fidelity: "exact",
  cells: [
    ...templeEntranceFloors().flatMap((region) => roofedCells(
      `entrance.${region.id}`, region, region.floor, roof, templeRoofRules.verticalThickness,
    )),
    ...thresholdCells("entrance", templeDoorPassages, y.floor),
  ],
});
