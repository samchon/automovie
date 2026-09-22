/**
 * docs/spaces/rooms/colonnade.md#ring-volume의 한 고리.
 * 여섯 평면 영역과 합성 지붕 하부의 교집합은 cell만 나누고 방/벽은 늘리지
 * 않는다. 주랑 표면의 단독 소유는 이 파일에 남으며 부재 충돌은 별도다.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import type { RoofPatch } from "../../geometry/planar-domain";
import { roofedCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeRoofRules } from "../roofs/assembly";
import { templeLevels as y } from "../storey";

export const templeColonnadeRegions = [
  { id: "north", west: p.westRing, east: p.eastRing, north: p.northRing, south: p.courtBack },
  { id: "west", west: p.westRing, east: p.westCourt, north: p.courtBack, south: p.courtFront },
  { id: "east", west: p.eastCourt, east: p.eastRing, north: p.courtBack, south: p.courtFront },
  { id: "south", west: p.westRing, east: p.eastRing, north: p.courtFront, south: p.entranceBack },
  { id: "southwest", west: p.westRing, east: p.westPorchOuter, north: p.entranceBack, south: p.southInner },
  { id: "southeast", west: p.eastPorchOuter, east: p.eastRing, north: p.entranceBack, south: p.southInner },
] as const;

/** cell 분해선을 물리 이음선으로 만들지 않는 한 고리 바닥 입력. */
export const templeColonnadeFloor = () => roomFloorInput(
  "colonnade", templeColonnadeRegions.map((region) => ({ ...region, floor: y.floor })),
  [], y.slabThickness, y.floor,
);

export const templeColonnade = (roof: readonly RoofPatch[]): IAutoMovieBuiltSpace => ({
  id: "colonnade", kind: "colonnade", parent: y.storey, fidelity: "exact",
  cells: templeColonnadeRegions.flatMap((region) => roofedCells(
    `colonnade.${region.id}`, region, y.floor, roof, templeRoofRules.verticalThickness,
  )),
});
