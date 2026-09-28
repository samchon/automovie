/**
 * 볼록 평면 다각형 위의 수직 프리즘을 닫힌 면 목록으로 만든다.
 * 하단과 상단은 각각 y=ax+bz+c 평면이며 벽 상단이 실제 지붕 하부를
 * 따르는 경사 면일 수 있다. 입력 다각형은 planar-domain의 방향(rectangle
 * 순서)을 따르고, 출력 면은 engine polyhedron이 바깥 법선을 얻는 순서다.
 * 면마다 방향과 원래 다각형 변 번호를 남겨 호출자가 표면 소유를 정한다.
 */
import type { IAutoMovieVector3 } from "@automovie/interface";
import { planeHeight, type HeightPlane, type PlanPoint } from "./planar-domain";

export interface PrismFace {
  /** "top" | "bottom" 또는 다각형 변 번호로 식별되는 옆면. */
  side: "top" | "bottom" | "edge";
  edge: number;
  /** XZ 바깥 법선(옆면만). 위아래 면은 0 벡터다. */
  normal: PlanPoint;
  corners: IAutoMovieVector3[];
}

/**
 * 모든 꼭짓점에서 상단이 하단보다 높아야 한다. 같거나 뒤집힌 높이는
 * 틈을 숨기는 0 두께 면이 되므로 거부한다(수치 한계 1e-9 m).
 */
export const prismFaces = (
  polygon: readonly PlanPoint[],
  bottom: HeightPlane,
  top: HeightPlane,
): PrismFace[] => {
  if (polygon.length < 3) throw new Error("prism: 세 꼭짓점 이상의 평면이 필요합니다.");
  const low = polygon.map((p) => planeHeight(bottom, p));
  const high = polygon.map((p) => planeHeight(top, p));
  polygon.forEach((_, i) => {
    if (!(high[i]! - low[i]! > 1e-9)) {
      throw new Error(`prism: 꼭짓점 ${i}의 상단 ${high[i]}가 하단 ${low[i]}보다 높지 않습니다.`);
    }
  });
  const v = (p: PlanPoint, y: number): IAutoMovieVector3 => ({ x: p.x, y, z: p.z });
  const faces: PrismFace[] = [
    {
      side: "top", edge: -1, normal: { x: 0, z: 0 },
      corners: polygon.map((p, i) => v(p, high[i]!)).reverse(),
    },
    {
      side: "bottom", edge: -1, normal: { x: 0, z: 0 },
      corners: polygon.map((p, i) => v(p, low[i]!)),
    },
  ];
  polygon.forEach((a, i) => {
    const j = (i + 1) % polygon.length;
    const b = polygon[j]!;
    const length = Math.hypot(b.x - a.x, b.z - a.z);
    faces.push({
      side: "edge", edge: i,
      normal: { x: (b.z - a.z) / length, z: (a.x - b.x) / length },
      corners: [v(a, low[i]!), v(a, high[i]!), v(b, high[j]!), v(b, low[j]!)],
    });
  });
  return faces;
};

/** 상수 높이 평면. */
export const levelPlane = (height: number): HeightPlane => ({ x: 0, z: 0, constant: height });
