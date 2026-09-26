/**
 * 연직 단면 판독: 외피 겹침 스캔과 같은 볼록 실체(벽 기둥 구간·지붕 slab·
 * 코핑·기단·바닥 slab)를 X 또는 Z 평면으로 잘라 정확한 단면 조각을 낸다.
 * 각 실체의 평면 다각형과 절단선의 교차 구간 양끝에서 하단·상단 평면 높이를
 * 읽어 사다리꼴을 만든다. 조각 사이의 틈·겹침이 그대로 드러나는 측정 도면이며
 * 시각 판정이나 문서 통과를 뜻하지 않는다.
 */
import { planeHeight, type PlanPoint } from "../geometry/planar-domain";
import type { ScanSolid } from "./envelope-overlaps";

export interface SectionPiece {
  group: string;
  kind: "wall" | "roof" | "trim" | "floor";
  /** 절단 평면 좌표(u = 다른 수평 축, y = 높이)의 반시계 사다리꼴. */
  points: Array<{ u: number; y: number }>;
}

const kindOf = (group: string): SectionPiece["kind"] =>
  group.startsWith("roof:") ? "roof" : group.startsWith("trim:") ? "trim" : group.startsWith("floor:") ? "floor" : "wall";

export const sectionProfile = (solids: readonly ScanSolid[], axis: "x" | "z", offset: number): SectionPiece[] => {
  const pieces: SectionPiece[] = [];
  for (const solid of solids) {
    const us: number[] = [];
    solid.polygon.forEach((a, i) => {
      const b = solid.polygon[(i + 1) % solid.polygon.length]!;
      const [ca, cb] = axis === "x" ? [a.x, b.x] : [a.z, b.z];
      const [ua, ub] = axis === "x" ? [a.z, b.z] : [a.x, b.x];
      if ((ca - offset) * (cb - offset) > 0) return;
      if (Math.abs(cb - ca) < 1e-12) {
        if (Math.abs(ca - offset) < 1e-12) us.push(ua, ub);
        return;
      }
      us.push(ua + (ub - ua) * (offset - ca) / (cb - ca));
    });
    if (us.length < 2) continue;
    const [u0, u1] = [Math.min(...us), Math.max(...us)];
    if (u1 - u0 < 1e-6) continue;
    const at = (u: number): PlanPoint => axis === "x" ? { x: offset, z: u } : { x: u, z: offset };
    const [p0, p1] = [at(u0), at(u1)];
    pieces.push({
      group: solid.group, kind: kindOf(solid.group),
      points: [
        { u: u0, y: planeHeight(solid.bottom, p0) }, { u: u1, y: planeHeight(solid.bottom, p1) },
        { u: u1, y: planeHeight(solid.top, p1) }, { u: u0, y: planeHeight(solid.top, p0) },
      ],
    });
  }
  return pieces;
};
