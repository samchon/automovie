/**
 * docs/spaces/junctions.md#wall-junctions의 벽 접합 계산.
 * 외곽 네 모서리는 바깥/안쪽 꼭짓점을 잇는 수직 대각면으로 맞대어 각 입면의
 * 바깥 평면에 더 가까운 삼각형만 그 입면 벽이 가진다. 내부 T 접합은 관통벽의
 * 접면에서 가지 벽을 끝낸다. 이 파일은 평면 윤곽만 내고 표면을 소유하지 않는다.
 */
import type { PlanPoint } from "../geometry/planar-domain";
import { templePlan as p } from "./building";

/** 대각 맞댐을 적용한 네 외벽과 남측 두 구간의 평면(planar-domain 방향). */
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

/** T 접합으로 끝난 내부/현관 벽의 직사각형 host 평면(planar-domain 방향). */
export const templeWallRect = (west: number, east: number, north: number, south: number): PlanPoint[] => [
  { x: west, z: north }, { x: east, z: north }, { x: east, z: south }, { x: west, z: south },
];

/**
 * T 접합에서 가지 벽이 끝나는 관통벽 접면. 서·동 spine은 north-inner~
 * south-inner, 제실 남벽은 west-ring~east-ring, 가로 벽은 east-room~
 * east-inner, 후퇴벽은 porch-outer 사이, 반환벽은 entrance-front~south-outer다.
 */
export const templeInteriorWallEnds = () => ({
  spine: { north: p.northInner, south: p.southInner },
  sanctuarySouth: { west: p.westRing, east: p.eastRing },
  crossWall: { west: p.eastRoom, east: p.eastInner },
  entryBack: { west: p.westPorchOuter, east: p.eastPorchOuter },
  porchReturn: { north: p.entranceFront, south: p.southOuter },
});
