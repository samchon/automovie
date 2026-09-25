/**
 * docs/spaces/facades/south.md#south-envelope의 정면 외벽 실체.
 * 서·동 외벽 구간과 두 반환벽은 석재 코핑을 얹는 수평 파라펫이며 그 안쪽
 * 면은 주랑/방 마감·지붕 접면·지붕 위 파라펫 뒷면으로 나뉜다. 현관 후퇴벽은
 * 포치 지붕 하부까지 닫고 포치 박공 아래 삼각 막음(tympanum)도 이 입면
 * 소유다. 하단은 호출자가 층 접지 규칙으로 유도한 공통 외벽 하단이다.
 */
import type { WallSpec } from "../../geometry/wall-solids";
import { templePlan as p } from "../building";
import { templeInteriorWallEnds, templeOuterWallPlans, templeWallRect, templeWallTrim } from "../junctions";
import { templeDoorVoidsOn } from "../openings";

/**
 * 외곽 파라펫 코핑 상단(m). 서·북 입면이 같은 값을 소비한다.
 * @evidence spaces/facades/south.md 외곽 파라펫 코핑 상단 4.85m를 단일 값으로 둔다.
 * @evidence spaces/facades/south.md#south-envelope 서·북·동 입면과 반환벽이 소비하는 코핑 높이를 한 곳에서 정한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 코핑 높이만 가지며 코핑 두께·돌출은 junctions가 소유한다.
 * @evidence principles/core/source-units.md#source-substantive-completion 숫자 상수로 네 입면의 파라펫과 wall-trim 코핑 칸이 같은 높이를 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work facades/south.md의 4.85m를 그대로 옮겼고 세 지붕과 제실 처마가 코핑과 겹치지 않음을 겹침 스캔이 확인했다.
 * @evidenceReview spaces/facades/south.md #537093f # 남측 입면 파일의 파라펫 수평 윗단을 이 상수가 정하고 벽 segment는 templeSouthWalls가 구성한다.
 * @evidenceReview spaces/facades/south.md#south-envelope #4488857 # Y=4.85m 상단을 이 export 하나로 고정해 서·북 파라펫 및 반환벽 코핑에 같은 값을 공급한다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 숫자 4.85만 내고 templeWallTrim의 코핑 두께·돌출과 roof patch 높이는 수정하지 않는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 네 입면의 flat top 정책이 직접 읽는 유한 literal로 코핑 높이가 미정인 출력 경로가 없다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # south-envelope의 4.85m를 그대로 대조했고 self-check의 지붕·코핑 겹침 0에서 상단을 낮출 부모 결함이 나오지 않았다.
 */
export const templeParapetTop = 4.85;

/**
 * 외곽 바깥면 석재 기단 상단의 접지면 위 높이(m). 네 입면이 같은 값을 소비한다.
 * @evidence spaces/facades/south.md 외곽 바깥면 석재 기단 상단의 지면 위 높이 0.65m를 둔다.
 * @evidence principles/core/source-units.md#source-scope-preservation 기단 상단 높이만 가지며 돌출은 junctions가 소유한다.
 * @evidence principles/core/source-units.md#source-substantive-completion 숫자 상수로 wall-trim 기단 칸이 지면 평면 위 같은 높이로 오른다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work facades/south.md#south-envelope의 0.65m를 그대로 옮겼고 기단 model이 닫힌 실체로 결산된다.
 * @evidenceReview spaces/facades/south.md #537093f # 입면의 접지 상대 기단 높이 0.65m를 공통 상수로 내며 실제 grade 접합은 wall-trim이 계산한다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 돌출·절단 형상은 junctions의 trim profile에 남기고 여기서는 지면 위 rise 하나만 정한다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # plinthFaces가 동일한 0.65m를 외벽 네 면에 적용하므로 현관 도로 높이를 기단 절대 높이로 잘못 복제하지 않는다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # south-envelope의 지면 위 0.65m 기준을 source trim 입력에 옮겼고 지면 접합은 공통 wallBottom으로 내려가 부모 바닥 높이를 바꾸지 않았다.
 */
export const templePlinthRise = 0.65;

/**
 * 포치 삼각 막음의 아랫면(m): 기둥 위 수평 보가 받는 높이.
 * @evidence spaces/facades/south.md 포치 삼각 막음의 아랫면 3.5m를 둔다.
 * @evidence principles/core/source-units.md#source-scope-preservation 삼각 막음 아랫면 높이만 가지며 막음 윗변은 포치 지붕 하부에서 온다.
 * @evidence principles/core/source-units.md#source-substantive-completion 숫자 상수로 남측 입면의 pediment 벽 구간이 같은 높이에서 시작한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work facades/south.md#south-envelope의 3.5m를 그대로 옮겼고 pediment model이 닫힌 실체다.
 * @evidenceReview spaces/facades/south.md #537093f # 포치 삼각 막음의 하단 높이만 이 상수가 맡고 기둥·보 형상은 models에 남긴다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 막음 윗변은 templeSouthWalls의 porch roof top으로 받아 숫자 3.5가 윗변이나 용마루 높이를 새로 정하지 않는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # pediment WallSpec의 bottom이 이 3.5m 상수를 사용해 열린 포치 전면 위에 삼각 벽을 실제로 둔다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # south-envelope의 보 위 삼각 막음 아랫면 Y=3.50m와 일치해 현관 개구를 막는 추가 벽을 요구하지 않았다.
 */
export const templePedimentBase = 3.5;

const outer = "surface.facade-south.outer";
const back = "surface.facade-south.parapet-back";
const colonnade = "surface.colonnade.wall";
const entrance = "surface.entrance.return";
const coping = {
  kind: "flat", height: templeParapetTop, surface: "surface.facade-south.coping", coping: templeWallTrim.copingThickness,
} as const;
const wing = { tier: "wing", above: back } as const;

/**
 * @evidence spaces/facades/south.md 정면 외벽 두 구간, 두 반환벽, 현관 후퇴벽, 포치 삼각 막음의 WallSpec을 낸다.
 * @evidence principles/core/source-units.md#source-scope-preservation 코핑·기단·삼각 막음 높이는 위 상수, 후퇴벽 상단은 포치 지붕 하부, 끝선은 junctions를 받는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 정문 void, 파라펫 뒷면 띠 분할, 후퇴벽 양끝 코핑 칸을 모두 채운 WallSpec 배열을 돌려준다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work facades/south.md#south-envelope의 파라펫·반환벽·후퇴벽·삼각 막음 구성을 그대로 구현했고 외피 겹침 0이다.
 * @evidenceReview spaces/facades/south.md #537093f # 두 날개 외벽·두 반환벽·후퇴벽·삼각 막음 여섯 WallSpec을 같은 남측 소유로 내며 중앙 문 void만 openings에서 받는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 앞쪽 벽과 반환벽의 코핑은 templeParapetTop, 박공 막음 하단은 templePedimentBase, 윗변은 porch roof를 써 후속 기둥 형상을 여기서 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # entry-back의 door void, end 두 칸의 coping top, 반환벽의 wing/porch split과 pediment의 상단 roof 정책이 각각 WallSpec의 실제 구간을 이룬다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 후퇴벽 북면 끝 칸과 반환벽 위쪽, 앞쪽 삼각 막음을 설계된 범위로 나눴고 겹침 전수 검사 0에서 부모 박공 위치를 바꿀 요구가 없었다.
 */
export const templeSouthWalls = (bottom: number): WallSpec[] => {
  const plans = templeOuterWallPlans();
  const entry = templeInteriorWallEnds().entryBack;
  const ret = templeInteriorWallEnds().porchReturn;
  return [
    {
      id: "wall.facade-south.west", owner: "facade-south", plan: plans.southWest,
      axis: "x", bottom, voids: [], ends: { high: "joint" },
      segments: [
        { from: p.westOuter, to: p.westInner, low: "joint", high: outer, top: coping },
        { from: p.westInner, to: p.westRoom, low: "surface.offering.wall", high: outer, top: coping, lowSplit: wing },
        { from: p.westRoom, to: p.westRing, low: "joint", high: outer, top: coping, lowSplit: wing },
        { from: p.westRing, to: p.westPorchOuter, low: colonnade, high: outer, top: coping, lowSplit: wing },
      ],
    },
    {
      id: "wall.facade-south.east", owner: "facade-south", plan: plans.southEast,
      axis: "x", bottom, voids: [], ends: { low: "joint" },
      segments: [
        { from: p.eastPorchOuter, to: p.eastRing, low: colonnade, high: outer, top: coping, lowSplit: wing },
        { from: p.eastRing, to: p.eastRoom, low: "joint", high: outer, top: coping, lowSplit: wing },
        { from: p.eastRoom, to: p.eastInner, low: "surface.administration.wall", high: outer, top: coping, lowSplit: wing },
        { from: p.eastInner, to: p.eastOuter, low: "joint", high: outer, top: coping },
      ],
    },
    {
      id: "wall.facade-south.return-west", owner: "facade-south", axis: "z", bottom, voids: [],
      plan: templeWallRect(p.westPorchOuter, p.westPorchInner, ret.north, ret.south),
      ends: { low: "joint", high: outer },
      segments: [
        { from: ret.north, to: p.southInner, low: colonnade, high: entrance, top: coping,
          lowSplit: wing, highSplit: { tier: "porch", above: back } },
        { from: p.southInner, to: ret.south, low: "joint", high: entrance, top: coping,
          highSplit: { tier: "porch", above: back } },
      ],
    },
    {
      id: "wall.facade-south.return-east", owner: "facade-south", axis: "z", bottom, voids: [],
      plan: templeWallRect(p.eastPorchInner, p.eastPorchOuter, ret.north, ret.south),
      ends: { low: "joint", high: outer },
      segments: [
        { from: ret.north, to: p.southInner, low: entrance, high: colonnade, top: coping,
          lowSplit: { tier: "porch", above: back }, highSplit: wing },
        { from: p.southInner, to: ret.south, low: entrance, high: "joint", top: coping,
          lowSplit: { tier: "porch", above: back } },
      ],
    },
    {
      id: "wall.facade-south.entry-back", owner: "facade-south", axis: "x", bottom,
      plan: templeWallRect(entry.west, entry.east, p.entranceBack, p.entranceFront),
      voids: templeDoorVoidsOn("boundary-entry"),
      ends: { low: colonnade, high: colonnade },
      segments: [
        { from: entry.west, to: p.westPorchInner, low: colonnade, high: "joint", top: coping, lowSplit: wing },
        { from: p.westPorchInner, to: p.eastPorchInner, low: colonnade, high: outer,
          top: { kind: "roof", tier: "porch" }, lowSplit: wing },
        { from: p.eastPorchInner, to: entry.east, low: colonnade, high: "joint", top: coping, lowSplit: wing },
      ],
    },
    {
      id: "wall.facade-south.pediment", owner: "facade-south", axis: "x", bottom: templePedimentBase, voids: [],
      plan: templeWallRect(p.westPorchInner, p.eastPorchInner, p.southOuter - 0.2, p.southOuter),
      ends: { low: "joint", high: "joint" },
      segments: [{
        from: p.westPorchInner, to: p.eastPorchInner, low: "surface.entrance.pediment-back", high: outer,
        top: { kind: "roof", tier: "porch" },
      }],
    },
  ];
};
