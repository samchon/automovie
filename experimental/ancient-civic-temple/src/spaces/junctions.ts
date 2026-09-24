/**
 * docs/spaces/junctions.md#wall-junctions의 벽 접합 계산.
 * 외곽 네 모서리는 바깥/안쪽 꼭짓점을 잇는 수직 대각면으로 맞대어 각 입면의
 * 바깥 평면에 더 가까운 삼각형만 그 입면 벽이 가진다. 내부 T 접합은 관통벽의
 * 접면에서 가지 벽을 끝낸다. 이 파일은 평면 윤곽만 내고 표면을 소유하지 않는다.
 */
import type { PlanPoint } from "../geometry/planar-domain";
import { templePlan as p } from "./building";

/**
 * 대각 맞댐을 적용한 네 외벽과 남측 두 구간의 평면(planar-domain 방향).
 * @evidence spaces/junctions.md 네 외벽과 남측 두 구간의 대각 맞댐 평면을 낸다.
 * @evidence spaces/junctions.md#wall-junctions 외곽 네 모서리를 바깥·안쪽 꼭짓점을 잇는 대각면으로 나눠 각 입면이 자기 바깥면에 가까운 쪽만 갖게 한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 평면 윤곽만 내고 표면이나 높이를 소유하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 다섯 벽 평면을 planar-domain 방향의 사다리꼴로 돌려주며 입면 source가 그대로 prism host로 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work junctions.md#wall-junctions의 대각 맞댐 규칙을 적힌 그대로 구현했고 외피 겹침 스캔(1cm 격자)이 모서리 중복 0을 냈다.
 */
export const templeOuterWallPlans = () => ({
  north: [
    { x: p.westOuter, z: p.northOuter }, { x: p.eastOuter, z: p.northOuter },
    { x: p.eastInner, z: p.northInner }, { x: p.westInner, z: p.northInner },
  ],
  west: [
    { x: p.westOuter, z: p.northOuter }, { x: p.westInner, z: p.northInner },
    { x: p.westInner, z: p.southInner }, { x: p.westOuter, z: p.southOuter },
  ],
  east: [
    { x: p.eastInner, z: p.northInner }, { x: p.eastOuter, z: p.northOuter },
    { x: p.eastOuter, z: p.southOuter }, { x: p.eastInner, z: p.southInner },
  ],
  southWest: [
    { x: p.westInner, z: p.southInner }, { x: p.westPorchOuter, z: p.southInner },
    { x: p.westPorchOuter, z: p.southOuter }, { x: p.westOuter, z: p.southOuter },
  ],
  southEast: [
    { x: p.eastPorchOuter, z: p.southInner }, { x: p.eastInner, z: p.southInner },
    { x: p.eastOuter, z: p.southOuter }, { x: p.eastPorchOuter, z: p.southOuter },
  ],
}) satisfies Record<string, PlanPoint[]>;

/**
 * docs/spaces/junctions.md#plinth-coping의 외벽 석재 단면(m). 코핑은 평평한
 * 윗단(파라펫·마당 벽)에 얹히는 두께와 긴 면·자유 끝의 돌출, 기단은 외곽
 * 바깥면에서의 돌출이다. 기단 상단 높이는 남측 입면(templePlinthRise)이 소유한다.
 * @evidence spaces/junctions.md 코핑 두께 0.16m·돌출 0.06m, 기단 돌출 0.04m의 석재 단면 값을 둔다.
 * @evidence spaces/junctions.md#plinth-coping 코핑과 기단의 두께·돌출을 설계 값 그대로 wall-trim 입력으로 제공한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 단면 치수만 두고 코핑 높이(4.85m)와 기단 상단은 남측 입면이 소유한다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 값으로 wall-trim의 코핑·기단 칸 계산과 벽 받침면 높이가 같은 두께를 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work junctions.md#plinth-coping의 0.16·0.06·0.04m를 그대로 옮겼고 코핑·기단 model이 닫힌 실체로 결산된다.
 */
export const templeWallTrim = { copingThickness: 0.16, copingProjection: 0.06, plinthProjection: 0.04 } as const;

/**
 * T 접합으로 끝난 내부/현관 벽의 직사각형 host 평면(planar-domain 방향).
 * @evidence spaces/junctions.md T 접합으로 끝난 내부·현관 벽의 직사각 host 평면을 만든다.
 * @evidence principles/core/source-units.md#source-scope-preservation 네 값을 planar-domain 방향 사각형으로 바꾸는 일만 하며 끝선 위치는 호출자가 templeInteriorWallEnds에서 받는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 서→동, 북→남 네 꼭짓점을 같은 순서로 돌려줘 prism 옆면 법선이 바깥을 향한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work junctions.md#wall-junctions의 T 접합 끝선으로 만든 직사각형을 그대로 쓰며 부모 결함이 드러나지 않았다.
 */
export const templeWallRect = (west: number, east: number, north: number, south: number): PlanPoint[] => [
  { x: west, z: north }, { x: east, z: north }, { x: east, z: south }, { x: west, z: south },
];

/**
 * T 접합에서 가지 벽이 끝나는 관통벽 접면. 서·동 spine은 north-inner~
 * south-inner, 제실 남벽은 west-ring~east-ring, 가로 벽은 east-room~
 * east-inner, 후퇴벽은 porch-outer 사이, 반환벽은 entrance-front~south-outer다.
 * @evidence spaces/junctions.md 내부 T 접합에서 가지 벽이 끝나는 관통벽 접면 좌표를 낸다.
 * @evidence principles/core/source-units.md#source-scope-preservation spine·제실 남벽·가로 벽·후퇴벽·반환벽의 끝선만 기준선에서 골라 돌려준다.
 * @evidence principles/core/source-units.md#source-substantive-completion 다섯 벽 무리의 끝선을 이름 붙은 좌표로 돌려주며 boundaries와 남측 입면이 같은 값을 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work junctions.md#wall-junctions의 T 접합 끝선(north-inner~south-inner, west-ring~east-ring, east-room~east-inner, porch-outer, entrance-front~south-outer)을 그대로 구현했다.
 */
export const templeInteriorWallEnds = () => ({
  spine: { north: p.northInner, south: p.southInner },
  sanctuarySouth: { west: p.westRing, east: p.eastRing },
  crossWall: { west: p.eastRoom, east: p.eastInner },
  entryBack: { west: p.westPorchOuter, east: p.eastPorchOuter },
  porchReturn: { north: p.entranceFront, south: p.southOuter },
});
