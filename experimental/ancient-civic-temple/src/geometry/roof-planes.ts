/**
 * 명시된 지지선/끝선에서 박공의 두 높이 평면을 만든다.
 * 지붕 위치·경사·두께는 호출한 공간 owner의 입력이며 여기서 고르지 않는다.
 * 반환 조각은 CCW 평면 영역과 상면 식이다. 아직 닫힌 slab mesh는 아니다.
 */
import { clipPlan, rectanglePolygon, type PlanRectangle, type RoofPatch } from "./planar-domain";

export interface RoofRules {
  supportHeight: number;
  slope: number;
  overhang: number;
  verticalThickness: number;
}

/** 대칭 두 지지선 사이의 용마루. 끝선은 지지선과 독립적으로 받는다. */
export const gablePlanes = (
  owner: string,
  id: string,
  bounds: PlanRectangle,
  axis: "x" | "z",
  supportLow: number,
  supportHigh: number,
  height: number,
  slope: number,
): RoofPatch[] => {
  const ridge = (supportLow + supportHigh) / 2;
  const rise = Math.tan(slope);
  const polygon = rectanglePolygon(bounds);
  return [-1, 1].flatMap((side) => {
    const gradient = -side * rise;
    const plane = {
      x: axis === "x" ? gradient : 0,
      z: axis === "z" ? gradient : 0,
      constant: height + rise * (supportHigh - supportLow) / 2 - gradient * ridge,
    };
    const half = clipPlan(polygon, {
      x: axis === "x" ? side : 0,
      z: axis === "z" ? side : 0,
      constant: -side * ridge,
    });
    return half.length === 0 ? [] : [{
      id: `${id}.${side < 0 ? "low" : "high"}`,
      owner, surface: `surface.${owner}.upper`, polygon: half, height: plane,
    }];
  });
};
