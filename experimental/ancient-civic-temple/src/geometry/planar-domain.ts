/**
 * 지붕 높이장과 공간 cell이 공유하는 XZ 볼록 영역 계산.
 * 건물 치수/표면 소유를 결정하지 않는다. 입력은 유한한 CCW 볼록 다각형,
 * 출력은 원래 입력을 수정하지 않는 새 다각형이다. 높이는 y=ax+bz+c(m).
 * 수치 오차만 1e-9로 다루며 설계 허용 오차나 틈 메우기로 쓰지 않는다.
 */
export interface PlanPoint { x: number; z: number }
export interface HeightPlane { x: number; z: number; constant: number }
export interface RoofPatch {
  id: string;
  owner: string;
  surface: string;
  polygon: PlanPoint[];
  height: HeightPlane;
}
export interface PlanRectangle {
  west: number; east: number; north: number; south: number;
}

/** 수치 소거 한계. 끝선은 이 값만큼 이동시키지 않는다. */
const epsilon = 1e-9;

/** XZ에서 CCW인 네 모서리. 역전되거나 면적 없는 범위는 거부한다. */
export const rectanglePolygon = (r: PlanRectangle): PlanPoint[] => {
  if (![r.west, r.east, r.north, r.south].every(Number.isFinite) ||
      r.west >= r.east || r.north >= r.south) {
    throw new Error("planar-domain: 유한하고 양의 면적을 가진 사각형이 필요합니다.");
  }
  return [
    { x: r.west, z: r.north }, { x: r.east, z: r.north },
    { x: r.east, z: r.south }, { x: r.west, z: r.south },
  ];
};

/** 유한한 높이장의 한 점 평가. 입력 평면을 변경하지 않는다. */
export const planeHeight = (p: HeightPlane, at: PlanPoint): number =>
  p.x * at.x + p.z * at.z + p.constant;

/** a*x+b*z+c >= 0의 닫힌 반평면으로 clip한다. 빈 결과는 빈 배열이다. */
export const clipPlan = (
  polygon: readonly PlanPoint[],
  halfPlane: HeightPlane,
): PlanPoint[] => {
  const result: PlanPoint[] = [];
  for (let i = 0; i < polygon.length; ++i) {
    const a = polygon[i]!;
    const b = polygon[(i + 1) % polygon.length]!;
    const da = planeHeight(halfPlane, a);
    const db = planeHeight(halfPlane, b);
    if (da >= 0) result.push({ ...a });
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
      const t = da / (da - db);
      result.push({ x: a.x + t * (b.x - a.x), z: a.z + t * (b.z - a.z) });
    }
  }
  return cleanPlan(result);
};

/** CCW 변의 왼쪽을 내부로 삼는 반평면. 단위화는 필요하지 않다. */
export const edgeInside = (a: PlanPoint, b: PlanPoint): HeightPlane => ({
  x: a.z - b.z,
  z: b.x - a.x,
  constant: (b.z - a.z) * a.x - (b.x - a.x) * a.z,
});

/** 볼록 cutter와의 교집합 및 서로 겹치지 않는 바깥 조각을 반환한다. */
export const partitionPlan = (
  subject: readonly PlanPoint[],
  cutter: readonly PlanPoint[],
): { inside: PlanPoint[]; outside: PlanPoint[][] } => {
  let inside = subject.map((p) => ({ ...p }));
  const outside: PlanPoint[][] = [];
  for (let i = 0; i < cutter.length && inside.length > 0; ++i) {
    const plane = edgeInside(cutter[i]!, cutter[(i + 1) % cutter.length]!);
    const rejected = clipPlan(inside, {
      x: -plane.x, z: -plane.z, constant: -plane.constant,
    });
    if (rejected.length > 0) outside.push(rejected);
    inside = clipPlan(inside, plane);
  }
  return { inside, outside };
};

/** 끝점 중복과 면적 0을 제거하며 빈 영역을 삼각형으로 바꾸지 않는다. */
const cleanPlan = (points: PlanPoint[]): PlanPoint[] => {
  const result = points.filter((p, i) => {
    const next = points[(i + 1) % points.length]!;
    return Math.hypot(p.x - next.x, p.z - next.z) > epsilon;
  });
  const doubleArea = result.reduce((sum, p, i) => {
    const next = result[(i + 1) % result.length]!;
    return sum + p.x * next.z - next.x * p.z;
  }, 0);
  return doubleArea > epsilon ? result : [];
};
