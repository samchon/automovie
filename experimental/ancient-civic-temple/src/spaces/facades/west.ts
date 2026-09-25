/**
 * docs/spaces/facades/west.md#west-envelope의 서측 외벽 실체.
 * 개구부 없는 전 길이 파라펫이며 코핑 높이는 남측 입면 값을 소비한다.
 * 안쪽 면은 봉헌실 마감·서측 지붕 접면·지붕 위 파라펫 뒷면으로 나뉜다.
 * 두 모서리는 대각 맞댐 평면을 소비한다.
 */
import type { WallSpec } from "../../geometry/wall-solids";
import { templePlan as p } from "../building";
import { templeOuterWallPlans, templeWallTrim } from "../junctions";
import { templeParapetTop } from "./south";

/**
 * @evidence spaces/facades/west.md 개구부 없는 서측 외벽 전 길이 파라펫 WallSpec을 낸다.
 * @evidence spaces/facades/west.md#west-envelope 코핑 높이는 남측 값을, 안쪽 면은 봉헌실 마감·지붕 접면·파라펫 뒷면으로 나누는 띠 분할을 구현한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 창이나 문을 더하지 않고 두 모서리는 대각 맞댐 평면을 받는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 평면·상단·띠 분할을 채운 WallSpec을 돌려준다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work facades/west.md의 무창 파라펫과 코핑 높이를 그대로 구현했고 외피 겹침 0이다.
 * @evidenceReview spaces/facades/west.md # 서측 전 길이 무창 파라펫 실체를 wall.facade-west 하나로 반환하고 봉헌실 내부 면과 두 모서리 joint를 구분한다.
 * @evidenceReview spaces/facades/west.md#west-envelope # west 안쪽 지붕 위 부분은 highSplit의 facade-west.parapet-back, 아래는 offering.wall로 나뉘며 제실 flank 표면은 boundaries의 west-spine split이 같은 입면 owner로 낸다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # voids 빈 배열을 유지하고 plan은 templeOuterWallPlans, top은 south의 templeParapetTop을 받아 새 창이나 별도 코핑 높이를 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 북·중·남 세 segment와 바깥 실체 bottom, 양끝 joint, 중간 봉헌실/파라펫 뒷면을 채워 무창 외벽 모델을 생성할 입력이 있다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 서측 무창·봉헌실 안면·남측과 같은 코핑을 wall spec에 대조했고 겹침 검사는 0으로 부모에 새 출입이나 높이 보정이 필요하지 않았다.
 */
export const templeWestWalls = (bottom: number): WallSpec[] => [{
  id: "wall.facade-west", owner: "facade-west", axis: "z", bottom, voids: [],
  plan: templeOuterWallPlans().west,
  segments: [
    { from: p.northOuter, to: p.northInner, low: "surface.facade-west.outer", high: "joint",
      top: { kind: "flat", height: templeParapetTop, surface: "surface.facade-west.coping", coping: templeWallTrim.copingThickness } },
    { from: p.northInner, to: p.southInner, low: "surface.facade-west.outer", high: "surface.offering.wall",
      top: { kind: "flat", height: templeParapetTop, surface: "surface.facade-west.coping", coping: templeWallTrim.copingThickness },
      highSplit: { tier: "wing", above: "surface.facade-west.parapet-back" } },
    { from: p.southInner, to: p.southOuter, low: "surface.facade-west.outer", high: "joint",
      top: { kind: "flat", height: templeParapetTop, surface: "surface.facade-west.coping", coping: templeWallTrim.copingThickness } },
  ],
}];
