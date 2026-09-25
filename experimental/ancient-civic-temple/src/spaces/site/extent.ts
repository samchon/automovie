/**
 * docs/spaces/site.md의 대지 범위·지면 높이·구획·배치 구역 단일 입력(m).
 * 건물 기준선은 templePlan에서 받고 대지 쪽 선만 여기서 정한다.
 * 이 파일은 geometry를 만들지 않으며 ground/ridge/assembly가 소비한다.
 */
import type { HeightPlane, PlanRectangle } from "../../geometry/planar-domain";
import { templePlan as p } from "../building";
import { templeLevels as y } from "../storey";

/**
 * docs/spaces/site.md#site-extent: 외곽 네 바깥면에서 25m.
 * @evidence spaces/site.md 대지 범위를 건물 외곽 네 바깥면에서 25m로 둔다.
 * @evidenceReview spaces/site.md # templeSiteExtent의 네 끝이 p.outer에서 각각 바깥쪽 25m라 건물 주위 대지 사각 범위를 정한다.
 * @evidence spaces/site.md#site-extent 사각 범위를 templePlan 외곽 네 바깥면에서 유도한다.
 * @evidenceReview spaces/site.md#site-extent # 서·동·북·남 값이 건물 outer datum에서 유도되어 건물 위치가 바뀌어도 25m 여백을 유지한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 범위 네 값만 정한다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 이 PlanRectangle은 네 평면 끝선뿐이고 지면 높이 또는 이웃 집 형상을 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion PlanRectangle 값으로 cell·지면·배치 구역이 같은 범위를 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # siteCells·ground 조각·placement zone이 같은 extent를 읽어 대지 끝선이 소비자마다 달라지지 않는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-extent의 25m를 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 판정된 대지 여백 25m를 네 외곽선에 그대로 더하고 새 필지 규모를 선택하지 않았다.
 */
export const templeSiteExtent: PlanRectangle = {
  west: p.westOuter - 25, east: p.eastOuter + 25,
  north: p.northOuter - 25, south: p.southOuter + 25,
};

/**
 * docs/spaces/site.md#site-extent: 논리 공간 cell의 아래·위 한계.
 * @evidence spaces/site.md 대지 논리 공간 cell의 아래 -0.3m·위 6.0m 한계를 둔다.
 * @evidenceReview spaces/site.md # templeSiteVolume의 floor −0.3m·ceiling 6.0m가 대지 네 논리 cell의 수직 경계를 제공한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 두 한계만 가지며 하늘을 막는 면을 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 두 number는 공간 포함 판정용이며 sky roof 또는 먼 산 mesh를 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 값으로 대지 cell 네 개가 같은 높이 범위를 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # siteCells가 v.floor와 v.ceiling을 네 방향 levelCell 모두에 적용한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-extent의 논리 범위를 그대로 옮겼다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 수직 −0.3..6m는 기존 site-extent 예약 그대로라 건물 층 상한을 바꾸지 않았다.
 */
export const templeSiteVolume = { floor: -0.3, ceiling: 6.0 } as const;

/**
 * docs/spaces/site.md#site-grade: Z에만 따르는 지면 높이.
 * yard-front 북쪽 Y=0(서비스 외부), south-outer 남쪽 Y=-0.24(정문 도로),
 * 그 사이는 곧은 경사다. 세 구간의 경계 Z를 함께 내보낸다.
 * @evidence spaces/site.md 지면 경사가 바뀌는 두 전환선 yard-front와 south-outer를 둔다.
 * @evidenceReview spaces/site.md # GradeBreaks 튜플의 두 값이 서비스 마당 앞선과 건물 남쪽 외곽선의 Z 위치다.
 * @evidence spaces/site.md#site-grade 북쪽 Y=0, 남쪽 Y=-0.24, 그 사이 곧은 경사의 세 구간 경계를 기준선으로 정한다.
 * @evidenceReview spaces/site.md#site-grade # 두 Z datum 사이만 경사이고 각각 북·남은 수평인 세 구간을 이 break tuple이 분리한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 두 Z 값만 기준선에서 고른다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # templePlan의 yardFront·southOuter만 참조해 경사 전환에 새 하드코딩 Z를 넣지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 읽기 전용 튜플로 지면 평면·경계석·기단 칸이 같은 전환선에서 나뉜다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # as const 두 경계가 GradePlane과 gradeBands에서 공유되어 표면 경사 띠가 동일한 선에 맞는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-grade의 전환선을 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 두 구간 경계가 부모의 야드 앞과 남외벽 선 그대로라 지면 경사를 다시 설계하지 않았다.
 */
export const templeSiteGradeBreaks = [p.yardFront, p.southOuter] as const;

/**
 * @evidence spaces/site.md Z 위치의 지면 평면(y=ax+bz+c)을 세 구간 규칙에서 돌려준다.
 * @evidenceReview spaces/site.md # GradePlane은 북쪽 상수 0, 남쪽 상수 −0.24, 중간 Z 기울기 평면을 분기해 어느 Z에서도 한 평면을 준다.
 * @evidence principles/core/source-units.md#source-scope-preservation 서비스 접점 Y=0과 정문 도로 Y=-0.24는 층 값을 받는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 두 끝 높이는 templeLevels.serviceApproach와 publicRoad에서 읽고 함수에 독립 높이 상수를 두지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 북쪽은 수평 0, 남쪽은 수평 -0.24, 사이는 Z 기울기를 가진 평면을 돌려준다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # middle slope=(road−service)/(south−north), constant=service−slope*north라 양 전환선에서 높이가 연속된다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-grade의 식을 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 세 구간의 높이와 선형 보간식을 부모 그대로 써 경사 각도나 서비스 접점 높이를 새로 고르지 않았다.
 */
export const templeSiteGradePlane = (z: number): HeightPlane => {
  const [north, south] = templeSiteGradeBreaks;
  if (z <= north) return { x: 0, z: 0, constant: y.serviceApproach };
  if (z >= south) return { x: 0, z: 0, constant: y.publicRoad };
  const slope = (y.publicRoad - y.serviceApproach) / (south - north);
  return { x: 0, z: slope, constant: y.serviceApproach - slope * north };
};

/**
 * @evidence spaces/site.md Z 위치의 지면 높이(m)를 평면에서 계산한다.
 * @evidenceReview spaces/site.md # Grade가 같은 Z의 plane.z*z+constant를 계산해 바닥·관찰이 소비할 m 단위 지면 높이를 낸다.
 * @evidence principles/core/source-units.md#source-scope-preservation 지면 평면 계산만 한다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # GradePlane에서 받은 계수만 평가하며 X 방향 경사나 작은 지형 요철을 추가하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 한 숫자를 돌려주며 접촉 최저값과 관찰 눈높이가 같은 식을 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 반환 scalar를 ContactMinimum이 직접 쓰고 site support plane 역시 같은 GradePlane에서 만들어 눈높이 기초가 일치한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-grade의 높이 식을 그대로 쓴다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 이미 결정된 선형 grade를 평가할 뿐 별도 표면 높이 함수를 만들어 부모 지면을 바꾸지 않았다.
 */
export const templeSiteGrade = (z: number): number => {
  const plane = templeSiteGradePlane(z);
  return plane.z * z + plane.constant;
};

/**
 * docs/spaces/storey.md#wall-ground-contact가 읽는 외벽 바깥 접촉선의 최저 지면.
 * 지면은 Z에 대해 단조이므로 접촉선의 북·남 두 끝 중 낮은 값이다.
 * @evidence spaces/site.md 외벽 바깥 접촉선의 최저 지면 높이를 돌려준다.
 * @evidenceReview spaces/site.md # ContactMinimum이 북·남 외벽 접점의 Grade 두 값을 비교해 공통 벽 하단 식의 지면 입력을 낸다.
 * @evidence principles/core/source-units.md#source-scope-preservation 지면이 Z에 단조라는 설계에 따라 북·남 두 끝만 비교한다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # p.northOuter와 southOuter 두 끝만 Math.min에 넣으며 대지 전체 최저값으로 과장하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 한 숫자를 돌려줘 storey의 외벽 하단 식이 소비한다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 계산 결과 하나가 templeWallBottom의 outsideContactMinimum 인수로 쓰일 수 있다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-grade와 storey.md#wall-ground-contact의 접촉 규칙을 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 단조 grade의 건물 남북 접촉만 비교하므로 부모 외벽 접지 산식을 바꾸지 않았다.
 */
export const templeSiteContactMinimum = (): number =>
  Math.min(templeSiteGrade(p.northOuter), templeSiteGrade(p.southOuter));

/**
 * docs/spaces/site.md#site-paving: 경계석 안쪽 선, 폭, 높이와 포장 띠.
 * @evidence spaces/site.md 경계석 안쪽 선·폭·높이·매입, 골목 폭, 정면 거리 깊이, 정문 진입 폭, 서비스 앞마당 범위를 둔다.
 * @evidenceReview spaces/site.md # SiteLines가 네 curb 안쪽 선과 0.3m 폭·0.12m 상승·0.1m 매입, 3m 골목·8m 거리·진입 폭·서비스 apron을 함께 둔다.
 * @evidence spaces/site.md#site-paving 구획표의 경계석(폭 0.3·높이 0.12·매입 0.1m), 골목 3.0m, 거리 8.0m, 정문 진입 반폭(현관 반환벽 안쪽면), 앞마당 Z -7.3~-5.5를 옮긴다.
 * @evidenceReview spaces/site.md#site-paving # curb·lane·street 수치와 entryHalfWidth=p.eastPorchInner, apron의 −7.3..−5.5가 포장 구획표의 치수다.
 * @evidence principles/core/source-units.md#source-scope-preservation 대지 쪽 선만 정하고 건물 기준선은 templePlan에서 받는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 정문 개구 폭의 기준은 porch datum을 참조하고 나머지는 대지 구획선만이어서 건물 외벽 선을 재정의하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 값으로 구획·경계석·배치 구역이 같은 선을 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # ground pieces·curb rect·placement zone이 하나의 SiteLines를 읽어 포장 가장자리의 기준을 공유한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-paving의 구획 값을 그대로 옮겼다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 경계석·골목·거리·서비스 apron 수치가 기존 site-paving 표와 같고 새 접근로를 늘리지 않았다.
 */
export const templeSiteLines = {
  curbWest: -11.5, curbEast: 11.5, curbNorth: -11.25, curbSouth: 13.25,
  curbWidth: 0.3, curbRise: 0.12, curbEmbed: 0.1,
  laneWidth: 3.0, streetDepth: 8.0,
  entryHalfWidth: p.eastPorchInner,
  serviceApron: { north: -7.3, south: -5.5 },
} as const;

const l = templeSiteLines;

/**
 * 경계석 바깥선.
 * @evidence spaces/site.md 경계석 바깥선을 안쪽 선과 폭에서 유도한다.
 * @evidenceReview spaces/site.md # CurbOuter의 네 끝은 curb 안쪽 선에서 각각 폭 0.3m만 바깥으로 나가 닫힌 고리의 외변을 정한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 두 값의 합만 계산한다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 각 끝선은 SiteLines의 같은 쪽 값±curbWidth뿐이라 새 여유 폭이나 조경선을 더하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion PlanRectangle로 포장·골목 구획이 같은 선을 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 네 바깥 끝이 PlanRectangle 한 개로 나와 paving street·lane 경계가 같은 curb 외측을 참조한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-paving의 경계석 바깥선을 그대로 쓴다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 부모의 0.3m 경계석 폭만 적용해 포장 구획의 바깥 둘레를 새로 고르지 않았다.
 */
export const templeSiteCurbOuter: PlanRectangle = {
  west: l.curbWest - l.curbWidth, east: l.curbEast + l.curbWidth,
  north: l.curbNorth - l.curbWidth, south: l.curbSouth + l.curbWidth,
};

/**
 * 골목 바깥선과 정면 거리 남쪽 선.
 * @evidence spaces/site.md 골목 바깥선과 정면 거리 남쪽 선을 경계석 바깥선에서 유도한다.
 * @evidenceReview spaces/site.md # LaneOuter가 curb 바깥 양옆·북쪽에 3m, 남쪽에 8m를 더해 골목과 정면 거리의 바깥 사각선을 낸다.
 * @evidence principles/core/source-units.md#source-scope-preservation 골목 폭과 거리 깊이만 더한다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 네 식은 l.laneWidth 또는 l.streetDepth만 사용하고 이웃 집 높이나 대지 범위를 이 레코드에서 정하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion PlanRectangle로 이웃 바닥·배치 구역이 같은 선을 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 남·서·동·북 lane 범위가 단일 PlanRectangle이어서 ground pieces와 placement zones가 동일한 포장 가장자리를 받는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-paving의 골목·거리 선을 그대로 쓴다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 골목 3m와 거리 8m를 부모 포장 계획대로 외측에만 더해 대지 연결의 방향을 바꾸지 않았다.
 */
export const templeSiteLaneOuter: PlanRectangle = {
  west: templeSiteCurbOuter.west - l.laneWidth, east: templeSiteCurbOuter.east + l.laneWidth,
  north: templeSiteCurbOuter.north - l.laneWidth, south: templeSiteCurbOuter.south + l.streetDepth,
};

/** docs/spaces/site.md#placement-zones: 포장 가장자리에서 1.5m 물러난 이웃 구역. */
const setback = 1.5;
const e = templeSiteExtent;
const lane = templeSiteLaneOuter;
/**
 * @evidence spaces/site.md 이웃 집과 나무를 둘 네 배치 구역을 포장 가장자리에서 1.5m 물러나 둔다.
 * @evidenceReview spaces/site.md # PlacementZones의 남·서·동·북 네 rect가 lane 가장자리에서 setback 1.5m 밖으로 물러나 있다.
 * @evidence spaces/site.md#placement-zones 남·서·동·북 구역의 범위와 허용 개체(neighbour, tree)를 설계 표 그대로 정한다.
 * @evidenceReview spaces/site.md#placement-zones # 네 zone ID 모두 allows neighbour/tree이며 각각 남쪽 거리·서동 골목·북쪽 골목 밖의 예약 범위를 가진다.
 * @evidence principles/core/source-units.md#source-scope-preservation 구역만 정하고 개체를 만들지 않는다(instances 소유).
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 배열 요소에는 id·allows·rect만 있고 실제 집 mesh나 나무 instance는 없다.
 * @evidence principles/core/source-units.md#source-substantive-completion ID·허용 목록·범위를 가진 목록으로 후속 배치가 같은 구역을 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 각 예약에 안정 ID와 허용 종류 및 네 좌표가 있어 후속 instances가 구역을 다시 고르지 않아도 된다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#placement-zones의 물러남 1.5m와 네 구역을 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 포장 밖 1.5m 물러남과 네 배치 구역만 정의해 부모가 예약한 대지 조경 범위를 늘리지 않았다.
 */
export const templeSitePlacementZones: readonly { id: string; allows: readonly string[]; rect: PlanRectangle }[] = [
  { id: "zone.neighbour-south", allows: ["neighbour", "tree"],
    rect: { west: e.west, east: e.east, north: lane.south + setback, south: e.south } },
  { id: "zone.neighbour-west", allows: ["neighbour", "tree"],
    rect: { west: e.west, east: lane.west - setback, north: e.north, south: templeSiteCurbOuter.south - setback } },
  { id: "zone.neighbour-east", allows: ["neighbour", "tree"],
    rect: { west: lane.east + setback, east: e.east, north: e.north, south: templeSiteCurbOuter.south - setback } },
  { id: "zone.neighbour-north", allows: ["neighbour", "tree"],
    rect: { west: lane.west - setback, east: lane.east + setback, north: e.north, south: lane.north - setback } },
];

/**
 * docs/spaces/site.md#placement-zones: 벽 밑 풀 띠 폭과 접근 포장 양옆 금지 폭.
 * @evidence spaces/site.md 벽 밑 풀 띠 폭 0.6m와 접근 포장 양옆 금지 폭 0.5m를 둔다.
 * @evidenceReview spaces/site.md # GrassBand의 width 0.6m와 clearOfAccess 0.5m가 벽 밑 풀과 두 접근로 이격을 함께 지정한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 폭 두 값만 가진다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 두 숫자만 있고 풀 오브젝트 수나 나무 배치를 이 공간 설계 상수에 넣지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 값으로 후속 풀 배치가 같은 폭을 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # instances가 한 상수에서 풀 띠와 포장 금지 여유를 함께 읽을 수 있어 별도 배치 폭 선택이 없다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#placement-zones의 풀 띠 규칙을 그대로 옮겼다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 두 폭을 기존 placement-zones 그대로 받았고 실제 풀 배치를 앞당기지 않아 부모 규칙을 수정하지 않았다.
 */
export const templeSiteGrassBand = { width: 0.6, clearOfAccess: 0.5 } as const;
