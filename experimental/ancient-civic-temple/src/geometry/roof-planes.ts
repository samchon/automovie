/**
 * 명시된 지지선에서 박공의 두 높이 평면과 외쪽 지붕의 한 높이 평면을 만든다.
 * 지붕 위치·경사·두께·후보 영역은 호출한 공간 owner의 입력이며 여기서
 * 고르지 않는다. 반환 조각은 planar-domain 방향의 볼록 평면 영역과 상면
 * 식이며, 수직 두께는 법선 두께를 경사의 cos으로 나눈 값이다.
 */
import { clipPlan, type PlanPoint, type RoofPatch } from "./planar-domain";

export interface RoofRules {
  /** 중정 쪽 지지선(주랑 처마 기준)과 동측 박공 지지선의 상면 높이(m). */
  courtEave: number;
  /** 외쪽 지붕 경사(rad). */
  leanSlope: number;
  /** 박공 경사(rad). */
  gableSlope: number;
  /** 동측 박공만의 경사(rad). 남쪽 끝 용마루가 코핑 아래에 들도록 제실·포치보다 낮다. */
  eastGableSlope: number;
  /** 지붕 매스의 법선 두께(m). */
  normalThickness: number;
  /** 열린 처마 끝의 수평 돌출(m). */
  overhang: number;
  /** 동측 박공의 동측 외벽 중심 지지선 상면 높이(m). */
  eastWallSupport: number;
  /** 제실 박공 지지선 상면 높이(m). */
  sanctuarySupport: number;
  /** 포치 박공 지지선 상면 높이(m). */
  porchSupport: number;
}

/** 경사 slope의 수직 두께. */
export const roofVerticalThickness = (rules: RoofRules, slope: number): number =>
  rules.normalThickness / Math.cos(slope);

/**
 * 두 지지선 사이의 용마루. 두 지지선 상면 높이가 같으면 용마루는 중점이고,
 * 다르면 같은 경사의 두 면이 만나는 선으로 옮겨진다. 후보 영역은 지지선과
 * 독립적으로 받으며 여러 볼록 조각일 수 있다. 각 조각을 용마루 선에서 나눈다.
 */
export const gablePlanes = (props: {
  owner: string; id: string; tier: RoofPatch["tier"];
  pieces: readonly PlanPoint[][]; axis: "x" | "z";
  supportLow: number; supportHigh: number; height: number; highHeight?: number;
  slope: number; thickness: number;
}): RoofPatch[] => {
  const rise = Math.tan(props.slope);
  const highHeight = props.highHeight ?? props.height;
  const ridge = (highHeight - props.height + (props.supportLow + props.supportHigh) * rise) / (2 * rise);
  return props.pieces.flatMap((polygon, piece) => [-1, 1].flatMap((side) => {
    const gradient = -side * rise;
    // side<0: 낮은 좌표 지지선에서 올라가는 면, side>0: 높은 좌표 지지선에서 올라가는 면.
    const plane = {
      x: props.axis === "x" ? gradient : 0,
      z: props.axis === "z" ? gradient : 0,
      constant: side < 0 ? props.height - rise * props.supportLow : highHeight + rise * props.supportHigh,
    };
    const half = clipPlan(polygon, {
      x: props.axis === "x" ? side : 0,
      z: props.axis === "z" ? side : 0,
      constant: -side * ridge,
    });
    return half.length === 0 ? [] : [{
      id: `${props.id}.${piece}.${side < 0 ? "low" : "high"}`,
      owner: props.owner, surface: `surface.${props.owner}.upper`, tier: props.tier,
      polygon: half, height: plane, thickness: props.thickness,
    }];
  }));
};

/**
 * 한 지지선(lowLine)에서 rising 방향(+1은 좌표 증가 쪽)으로 올라가는 외쪽
 * 지붕. 지지선 위치의 상면이 height이며 반대쪽(처마 돌출)은 같은 평면으로
 * 낮아진다.
 */
export const leanToPlanes = (props: {
  owner: string; id: string; tier: RoofPatch["tier"];
  pieces: readonly PlanPoint[][]; axis: "x" | "z";
  lowLine: number; rising: 1 | -1; height: number;
  slope: number; thickness: number;
}): RoofPatch[] => {
  const gradient = props.rising * Math.tan(props.slope);
  const plane = {
    x: props.axis === "x" ? gradient : 0,
    z: props.axis === "z" ? gradient : 0,
    constant: props.height - gradient * props.lowLine,
  };
  return props.pieces.map((polygon, piece) => ({
    id: `${props.id}.${piece}`, owner: props.owner, surface: `surface.${props.owner}.upper`,
    tier: props.tier, polygon: polygon.map((p) => ({ ...p })), height: plane, thickness: props.thickness,
  }));
};
