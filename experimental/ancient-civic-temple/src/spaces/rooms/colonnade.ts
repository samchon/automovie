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
import { templeLevels as y } from "../storey";

/**
 * @evidence spaces/rooms/colonnade.md 한 고리 주랑을 북·서·동·남과 현관 양옆 두 영역의 여섯 평면 영역으로 둔다.
 * @evidence principles/core/source-units.md#source-scope-preservation 영역 끝선을 기준선으로만 정하며 영역 경계는 cell 분해선일 뿐 방·벽을 늘리지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion id가 붙은 여섯 사각형 목록으로 바닥·cell·관찰의 영역 중심이 같은 분해를 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/colonnade.md#ring-volume의 여섯 영역을 그대로 옮겼고 영역 합집합이 중정 구멍과 현관 몸체를 비운다.
 */
export const templeColonnadeRegions = [
  { id: "north", west: p.westRing, east: p.eastRing, north: p.northRing, south: p.courtBack },
  { id: "west", west: p.westRing, east: p.westCourt, north: p.courtBack, south: p.courtFront },
  { id: "east", west: p.eastCourt, east: p.eastRing, north: p.courtBack, south: p.courtFront },
  { id: "south", west: p.westRing, east: p.eastRing, north: p.courtFront, south: p.entranceBack },
  { id: "southwest", west: p.westRing, east: p.westPorchOuter, north: p.entranceBack, south: p.southInner },
  { id: "southeast", west: p.eastPorchOuter, east: p.eastRing, north: p.entranceBack, south: p.southInner },
] as const;

/**
 * cell 분해선을 물리 이음선으로 만들지 않는 한 고리 바닥 입력.
 * @evidence spaces/rooms/colonnade.md 여섯 영역을 한 고리 바닥 소유(surface.colonnade.floor)의 Y=0 slab으로 낸다.
 * @evidence principles/core/source-units.md#source-scope-preservation 영역 경계를 물리 이음선으로 만들지 않고 문턱은 각 방이 소유하므로 주랑은 문턱을 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 여섯 구획을 가진 바닥 입력을 돌려주며 비균일 격자 면 생성이 내부 접면 없이 한 판으로 만든다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/colonnade.md의 한 고리 바닥과 storey.md#threshold-support의 방 소유 문턱을 그대로 구현했다.
 */
export const templeColonnadeFloor = () => roomFloorInput(
  "colonnade", templeColonnadeRegions.map((region) => ({ ...region, floor: y.floor })),
  [], y.slabThickness, y.floor,
);

/**
 * @evidence spaces/rooms/colonnade.md 주랑 공간 레코드(id colonnade)를 여섯 영역 × 날개 지붕 조각의 exact cell로 낸다.
 * @evidence spaces/rooms/colonnade.md#ring-volume 구멍 있는 하나의 고리를 영역과 합성 날개 지붕 하부의 교집합 cell로 표현하고 덮임이 부족하면 거부한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 상한은 실제 날개 지붕 하부이며 중정 위나 방 안으로 cell을 넓히지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion roofedCells가 영역마다 지붕 덮임을 검사해 부족하면 오류로 멈추고, 성공하면 모든 cell을 가진 공간을 돌려준다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/colonnade.md#ring-volume의 한 공간·여섯 영역·지붕 하부 상한을 그대로 구현했다.
 */
export const templeColonnade = (roof: readonly RoofPatch[]): IAutoMovieBuiltSpace => ({
  id: "colonnade", kind: "colonnade", parent: y.storey, fidelity: "exact",
  cells: templeColonnadeRegions.flatMap((region) => roofedCells(
    `colonnade.${region.id}`, region, y.floor, roof.filter((patch) => patch.tier === "wing"),
  )),
});
