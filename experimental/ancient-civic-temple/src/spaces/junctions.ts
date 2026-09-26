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
 * @evidenceReview spaces/junctions.md #e40d5aa # 외벽 접합 파일의 대각 평면을 north/west/east/southWest/southEast 다섯 윤곽으로 내고 다른 접합 치수는 아래 exports에 둔다.
 * @evidenceReview spaces/junctions.md#wall-junctions #46ba9a9 # 북서·북동·남서·남동의 외점과 내점이 인접 윤곽에서 같은 대각 끝선을 공유해 두 벽의 모서리 체적이 중복되지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # PlanPoint 배열만 반환하고 코핑·벽 높이·표면 ID는 이 함수가 만들지 않아 접합 계산의 책임을 넘지 않는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 네 입면이 바로 plan으로 쓰는 닫힌 꼭짓점 순서 다섯 개를 반환하며 남측은 현관 후퇴로 양분한다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 외곽 네 쌍의 대각 끝을 junctions 기준선과 대조했고 1cm 외피 스캔의 겹침 0에서 부모 모서리 규칙을 바꿀 필요가 없었다.
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
 * @evidenceReview spaces/junctions.md #e40d5aa # 외벽 석재 단면 수치만 이 상수가 내고 대각 벽 윤곽과 T 접합은 같은 파일의 다른 exports가 계산한다.
 * @evidenceReview spaces/junctions.md#plinth-coping #711b673 # copingThickness 0.16, copingProjection 0.06, plinthProjection 0.04가 설계의 세 독립 단면 치수와 같다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 4.85m 코핑 상단이나 지면 위 0.65m 기단 높이를 재선택하지 않고 wall-trim에 두께·돌출만 준다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # as const 치수 객체가 copingFaces와 plinthFaces에서 동일하게 쓰여 별도 코핑·기단 박스 상수를 두지 않는다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 설계의 0.16·0.06·0.04m와 객체 값이 같고 self-check 겹침 0이 접합을 받아 부모 단면을 수정하지 않았다.
 */
export const templeWallTrim = { copingThickness: 0.16, copingProjection: 0.06, plinthProjection: 0.04 } as const;

/**
 * T 접합으로 끝난 내부/현관 벽의 직사각형 host 평면(planar-domain 방향).
 * @evidence spaces/junctions.md T 접합으로 끝난 내부·현관 벽의 직사각 host 평면을 만든다.
 * @evidence principles/core/source-units.md#source-scope-preservation 네 값을 planar-domain 방향 사각형으로 바꾸는 일만 하며 끝선 위치는 호출자가 templeInteriorWallEnds에서 받는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 서→동, 북→남 네 꼭짓점을 같은 순서로 돌려줘 prism 옆면 법선이 바깥을 향한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work junctions.md#wall-junctions의 T 접합 끝선으로 만든 직사각형을 그대로 쓰며 부모 결함이 드러나지 않았다.
 * @evidenceReview spaces/junctions.md #e40d5aa # 내부 T 접합의 끝선 값 자체는 templeInteriorWallEnds가 내고 이 함수는 그 네 수치로 plan polygon을 형성한다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # west/east/north/south 인수를 다시 고르지 않고 네 PlanPoint로만 옮겨 내부벽 높이·문을 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 서북→동북→동남→서남 순서가 planar-domain의 바깥법선과 맞아 wall prism이 뒤집힌 면 없이 생성된다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # T 접합 위치는 caller의 templeInteriorWallEnds에서 받은 그대로 사각 윤곽이 되고 junctions H2에 없는 위치 보정이 없었다.
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
 * @evidenceReview spaces/junctions.md #e40d5aa # 내부 spine·제실 남벽·업무방 가로벽과 현관 반환부의 접합 값을 별도 이름으로 내어 WallRect 소비자가 한 기준선을 공유한다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 각 끝점은 templePlan의 기존 경계선이고 이 함수에는 새 벽 두께·표면·문 좌표가 없다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # spine, sanctuarySouth, crossWall, entryBack, porchReturn의 다섯 반환값을 boundaries와 south facade가 직접 사용한다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # T 가지 벽 끝을 parent의 north-inner/south-inner, west-ring/east-ring, east-room/east-inner와 비교했고 임의 여유를 더하지 않았다.
 */
export const templeInteriorWallEnds = () => ({
  spine: { north: p.northInner, south: p.southInner },
  sanctuarySouth: { west: p.westRing, east: p.eastRing },
  crossWall: { west: p.eastRoom, east: p.eastInner },
  entryBack: { west: p.westPorchOuter, east: p.eastPorchOuter },
  porchReturn: { north: p.entranceFront, south: p.southOuter },
});
