/**
 * docs/spaces/facades/north.md#north-envelope의 후면 외벽 실체.
 * 봉헌실 구간은 남측과 같은 코핑 높이의 파라펫, 제실 구간은 제실 박공
 * 하부까지 닫는 박공 끝벽, 마당 구간은 Y=2.55m의 낮은 석벽이다. 제실 박공의
 * 두 높은 채광구가 실제 void로 뚫린다. 모서리는 대각 맞댐 평면을 소비한다.
 */
import type { WallSpec } from "../../geometry/wall-solids";
import { templePlan as p } from "../building";
import { templeOuterWallPlans, templeWallTrim } from "../junctions";
import { templeClerestoryVoidsOn } from "../openings";
import { templeParapetTop } from "./south";

const outer = "surface.facade-north.outer";
const sanctuary = { kind: "roof", tier: "sanctuary" } as const;
const coping = {
  kind: "flat", height: templeParapetTop, surface: "surface.facade-north.coping", coping: templeWallTrim.copingThickness,
} as const;
const wing = { tier: "wing", above: "surface.facade-north.parapet-back" } as const;

/**
 * 마당 벽 상단(m). 입면 설계의 단일 값이며 보관실 박공에 복사하지 않는다.
 * @evidence spaces/facades/north.md 마당 구간 낮은 석벽의 상단 높이 2.55m를 단일 값으로 둔다.
 * @evidence spaces/facades/north.md#north-envelope 후면 마당 구간과 동측 마당 벽이 같은 2.55m를 소비하게 한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 마당 벽 상단만 가지며 보관실 북쪽 박공 높이에 복사하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 숫자 상수로 북측·동측 마당 벽과 서비스 마당 공간 판단이 같은 높이를 받는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work facades/north.md의 2.55m를 그대로 옮겼고 서비스 마당 창 판단(마당 위 외부)이 이 값으로 성립했다.
 * @evidenceReview spaces/facades/north.md #a387c65 # templeYardWallTop은 북측 설계의 마당 상단 숫자만 공개하고 WallSpec 조립은 아래 templeNorthWalls가 맡는다.
 * @evidenceReview spaces/facades/north.md#north-envelope #9cc0e76 # 서비스 마당 윗면 Y=2.55m를 이 상수에서 동측 낮은 마당 벽도 가져가므로 두 벽 높이가 갈라지지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 상수 2.55는 보관실 지붕 높이나 제실 박공선에 쓰이지 않고 yardTop과 마당 벽에만 전달된다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 2.55라는 유한 literal이 북측·동측 낮은 벽의 flat top을 즉시 구성하며 임시 계산이나 미정 값이 없다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # north-envelope의 Y=2.55m가 상수와 일치하고 마당 위 외부를 닫을 만큼 높이지 않아 부모의 열린 마당 결정을 바꾸지 않았다.
 */
export const templeYardWallTop = 2.55;

/**
 * @evidence spaces/facades/north.md 북측 외벽 WallSpec을 봉헌실 파라펫, 제실 박공 끝벽, 마당 낮은 벽 구간으로 낸다.
 * @evidence principles/core/source-units.md#source-scope-preservation 코핑 높이는 남측, 마당 벽은 templeYardWallTop, 제실 구간 상단은 제실 지붕 하부를 받는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 두 북측 채광구 void와 띠 분할(파라펫 뒷면)을 포함한 WallSpec을 돌려준다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work facades/north.md#north-envelope의 세 구간과 박공 창 두 개를 그대로 구현했고 외피 겹침 0이다.
 * @evidenceReview spaces/facades/north.md #a387c65 # wall.facade-north 하나의 segment 배열 안에 서측 봉헌실·중앙 제실·동측 마당의 서로 다른 높이와 표면을 배정했다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 파라펫 상단은 south, 제실 상단은 sanctuary roof, 낮은 마당 상단은 templeYardWallTop에서 받아 같은 후면에 새 지붕 높이를 발명하지 않는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 북측 외벽 plan과 두 채광구 void, 여섯 구간의 top·surface·parapet-back split을 채워 후면 박공과 코핑을 실제 벽 실체로 만들 수 있다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 세 높이 구간과 북측 두 창을 facades/north·openings의 주소에 맞췄고 self-check가 겹침을 찾지 않아 숨은 후문을 더하지 않았다.
 */
export const templeNorthWalls = (bottom: number): WallSpec[] => [{
  id: "wall.facade-north", owner: "facade-north", axis: "x", bottom,
  plan: templeOuterWallPlans().north,
  voids: templeClerestoryVoidsOn("boundary-north.sanctuary"),
  segments: [
    { from: p.westOuter, to: p.westInner, low: outer, high: "joint", top: coping },
    { from: p.westInner, to: p.westRoom, low: outer, high: "surface.offering.wall", top: coping, highSplit: wing },
    { from: p.westRoom, to: p.westRing, low: outer, high: "joint", top: sanctuary },
    { from: p.westRing, to: p.eastRing, low: outer, high: "surface.sanctuary.wall", top: sanctuary },
    { from: p.eastRing, to: p.eastRoom, low: outer, high: "joint", top: sanctuary },
    { from: p.eastRoom, to: p.eastOuter, low: outer, high: "surface.service-yard.wall",
      top: { kind: "flat", height: templeYardWallTop, surface: "surface.service-yard.wall-top", coping: templeWallTrim.copingThickness } },
  ],
}];
