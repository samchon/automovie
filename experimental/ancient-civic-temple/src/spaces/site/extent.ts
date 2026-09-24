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
 * @evidence spaces/site.md#site-extent 사각 범위를 templePlan 외곽 네 바깥면에서 유도한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 범위 네 값만 정한다.
 * @evidence principles/core/source-units.md#source-substantive-completion PlanRectangle 값으로 cell·지면·배치 구역이 같은 범위를 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-extent의 25m를 그대로 구현했다.
 */
export const templeSiteExtent: PlanRectangle = {
  west: p.westOuter - 25, east: p.eastOuter + 25,
  north: p.northOuter - 25, south: p.southOuter + 25,
};

/**
 * docs/spaces/site.md#site-extent: 논리 공간 cell의 아래·위 한계.
 * @evidence spaces/site.md 대지 논리 공간 cell의 아래 -0.3m·위 6.0m 한계를 둔다.
 * @evidence principles/core/source-units.md#source-scope-preservation 두 한계만 가지며 하늘을 막는 면을 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 값으로 대지 cell 네 개가 같은 높이 범위를 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-extent의 논리 범위를 그대로 옮겼다.
 */
export const templeSiteVolume = { floor: -0.3, ceiling: 6.0 } as const;

/**
 * docs/spaces/site.md#site-grade: Z에만 따르는 지면 높이.
 * yard-front 북쪽 Y=0(서비스 외부), south-outer 남쪽 Y=-0.24(정문 도로),
 * 그 사이는 곧은 경사다. 세 구간의 경계 Z를 함께 내보낸다.
 * @evidence spaces/site.md 지면 경사가 바뀌는 두 전환선 yard-front와 south-outer를 둔다.
 * @evidence spaces/site.md#site-grade 북쪽 Y=0, 남쪽 Y=-0.24, 그 사이 곧은 경사의 세 구간 경계를 기준선으로 정한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 두 Z 값만 기준선에서 고른다.
 * @evidence principles/core/source-units.md#source-substantive-completion 읽기 전용 튜플로 지면 평면·경계석·기단 칸이 같은 전환선에서 나뉜다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-grade의 전환선을 그대로 구현했다.
 */
export const templeSiteGradeBreaks = [p.yardFront, p.southOuter] as const;

/**
 * @evidence spaces/site.md Z 위치의 지면 평면(y=ax+bz+c)을 세 구간 규칙에서 돌려준다.
 * @evidence principles/core/source-units.md#source-scope-preservation 서비스 접점 Y=0과 정문 도로 Y=-0.24는 층 값을 받는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 북쪽은 수평 0, 남쪽은 수평 -0.24, 사이는 Z 기울기를 가진 평면을 돌려준다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-grade의 식을 그대로 구현했다.
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
 * @evidence principles/core/source-units.md#source-scope-preservation 지면 평면 계산만 한다.
 * @evidence principles/core/source-units.md#source-substantive-completion 한 숫자를 돌려주며 접촉 최저값과 관찰 눈높이가 같은 식을 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-grade의 높이 식을 그대로 쓴다.
 */
export const templeSiteGrade = (z: number): number => {
  const plane = templeSiteGradePlane(z);
  return plane.z * z + plane.constant;
};

/**
 * docs/spaces/storey.md#wall-ground-contact가 읽는 외벽 바깥 접촉선의 최저 지면.
 * 지면은 Z에 대해 단조이므로 접촉선의 북·남 두 끝 중 낮은 값이다.
 * @evidence spaces/site.md 외벽 바깥 접촉선의 최저 지면 높이를 돌려준다.
 * @evidence principles/core/source-units.md#source-scope-preservation 지면이 Z에 단조라는 설계에 따라 북·남 두 끝만 비교한다.
 * @evidence principles/core/source-units.md#source-substantive-completion 한 숫자를 돌려줘 storey의 외벽 하단 식이 소비한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-grade와 storey.md#wall-ground-contact의 접촉 규칙을 그대로 구현했다.
 */
export const templeSiteContactMinimum = (): number =>
  Math.min(templeSiteGrade(p.northOuter), templeSiteGrade(p.southOuter));

/**
 * docs/spaces/site.md#site-paving: 경계석 안쪽 선, 폭, 높이와 포장 띠.
 * @evidence spaces/site.md 경계석 안쪽 선·폭·높이·매입, 골목 폭, 정면 거리 깊이, 정문 진입 폭, 서비스 앞마당 범위를 둔다.
 * @evidence spaces/site.md#site-paving 구획표의 경계석(폭 0.3·높이 0.12·매입 0.1m), 골목 3.0m, 거리 8.0m, 정문 진입 반폭(현관 반환벽 안쪽면), 앞마당 Z -7.3~-5.5를 옮긴다.
 * @evidence principles/core/source-units.md#source-scope-preservation 대지 쪽 선만 정하고 건물 기준선은 templePlan에서 받는다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 값으로 구획·경계석·배치 구역이 같은 선을 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-paving의 구획 값을 그대로 옮겼다.
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
 * @evidence principles/core/source-units.md#source-scope-preservation 두 값의 합만 계산한다.
 * @evidence principles/core/source-units.md#source-substantive-completion PlanRectangle로 포장·골목 구획이 같은 선을 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-paving의 경계석 바깥선을 그대로 쓴다.
 */
export const templeSiteCurbOuter: PlanRectangle = {
  west: l.curbWest - l.curbWidth, east: l.curbEast + l.curbWidth,
  north: l.curbNorth - l.curbWidth, south: l.curbSouth + l.curbWidth,
};

/**
 * 골목 바깥선과 정면 거리 남쪽 선.
 * @evidence spaces/site.md 골목 바깥선과 정면 거리 남쪽 선을 경계석 바깥선에서 유도한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 골목 폭과 거리 깊이만 더한다.
 * @evidence principles/core/source-units.md#source-substantive-completion PlanRectangle로 이웃 바닥·배치 구역이 같은 선을 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-paving의 골목·거리 선을 그대로 쓴다.
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
 * @evidence spaces/site.md#placement-zones 남·서·동·북 구역의 범위와 허용 개체(neighbour, tree)를 설계 표 그대로 정한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 구역만 정하고 개체를 만들지 않는다(instances 소유).
 * @evidence principles/core/source-units.md#source-substantive-completion ID·허용 목록·범위를 가진 목록으로 후속 배치가 같은 구역을 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#placement-zones의 물러남 1.5m와 네 구역을 그대로 구현했다.
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
 * @evidence principles/core/source-units.md#source-scope-preservation 폭 두 값만 가진다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 값으로 후속 풀 배치가 같은 폭을 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#placement-zones의 풀 띠 규칙을 그대로 옮겼다.
 */
export const templeSiteGrassBand = { width: 0.6, clearOfAccess: 0.5 } as const;
