/**
 * docs/spaces/site.md의 대지 범위·지면 높이·구획·배치 구역 단일 입력(m).
 * 건물 기준선은 templePlan에서 받고 대지 쪽 선만 여기서 정한다.
 * 이 파일은 geometry를 만들지 않으며 ground/ridge/assembly가 소비한다.
 */
import type { HeightPlane, PlanRectangle } from "../../geometry/planar-domain";
import { templePlan as p } from "../building";
import { templeLevels as y } from "../storey";

/** docs/spaces/site.md#site-extent: 외곽 네 바깥면에서 25m. */
export const templeSiteExtent: PlanRectangle = {
  west: p.westOuter - 25, east: p.eastOuter + 25,
  north: p.northOuter - 25, south: p.southOuter + 25,
};

/** docs/spaces/site.md#site-extent: 논리 공간 cell의 아래·위 한계. */
export const templeSiteVolume = { floor: -0.3, ceiling: 6.0 } as const;

/**
 * docs/spaces/site.md#site-grade: Z에만 따르는 지면 높이.
 * yard-front 북쪽 Y=0(서비스 외부), south-outer 남쪽 Y=-0.24(정문 도로),
 * 그 사이는 곧은 경사다. 세 구간의 경계 Z를 함께 내보낸다.
 */
export const templeSiteGradeBreaks = [p.yardFront, p.southOuter] as const;

export const templeSiteGradePlane = (z: number): HeightPlane => {
  const [north, south] = templeSiteGradeBreaks;
  if (z <= north) return { x: 0, z: 0, constant: y.serviceApproach };
  if (z >= south) return { x: 0, z: 0, constant: y.publicRoad };
  const slope = (y.publicRoad - y.serviceApproach) / (south - north);
  return { x: 0, z: slope, constant: y.serviceApproach - slope * north };
};

export const templeSiteGrade = (z: number): number => {
  const plane = templeSiteGradePlane(z);
  return plane.z * z + plane.constant;
};

/**
 * docs/spaces/storey.md#wall-ground-contact가 읽는 외벽 바깥 접촉선의 최저 지면.
 * 지면은 Z에 대해 단조이므로 접촉선의 북·남 두 끝 중 낮은 값이다.
 */
export const templeSiteContactMinimum = (): number =>
  Math.min(templeSiteGrade(p.northOuter), templeSiteGrade(p.southOuter));

/** docs/spaces/site.md#site-paving: 경계석 안쪽 선, 폭, 높이와 포장 띠. */
export const templeSiteLines = {
  curbWest: -11.5, curbEast: 11.5, curbNorth: -11.25, curbSouth: 13.25,
  curbWidth: 0.3, curbRise: 0.12, curbEmbed: 0.1,
  laneWidth: 3.0, streetDepth: 8.0,
  entryHalfWidth: p.eastPorchInner,
  serviceApron: { north: -7.3, south: -5.5 },
} as const;

const l = templeSiteLines;

/** 경계석 바깥선. */
export const templeSiteCurbOuter: PlanRectangle = {
  west: l.curbWest - l.curbWidth, east: l.curbEast + l.curbWidth,
  north: l.curbNorth - l.curbWidth, south: l.curbSouth + l.curbWidth,
};

/** 골목 바깥선과 정면 거리 남쪽 선. */
export const templeSiteLaneOuter: PlanRectangle = {
  west: templeSiteCurbOuter.west - l.laneWidth, east: templeSiteCurbOuter.east + l.laneWidth,
  north: templeSiteCurbOuter.north - l.laneWidth, south: templeSiteCurbOuter.south + l.streetDepth,
};

/** docs/spaces/site.md#placement-zones: 포장 가장자리에서 1.5m 물러난 이웃 구역. */
const setback = 1.5;
const e = templeSiteExtent;
const lane = templeSiteLaneOuter;
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

/** docs/spaces/site.md#placement-zones: 벽 밑 풀 띠 폭과 접근 포장 양옆 금지 폭. */
export const templeSiteGrassBand = { width: 0.6, clearOfAccess: 0.5 } as const;
