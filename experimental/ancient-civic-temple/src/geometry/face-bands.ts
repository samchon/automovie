/**
 * 벽의 한 수직 면을 옆에 닿는 지붕의 하부·상면 선으로 세 띠로 나눈다.
 * 하부 아래는 실내/주랑 마감, 지붕 두께 안은 가려진 접면, 상면 위는
 * 하늘에 드러난 파라펫/박공의 외면이다. 면 형상은 바꾸지 않고 같은 평면의
 * 사다리꼴로만 나누며 원래 감김 순서를 유지한다(수치 한계 1e-6 m).
 */
import type { IAutoMovieVector3 } from "@automovie/interface";
import { planeHeight, type HeightPlane } from "./planar-domain";
import type { WallFace } from "./wall-solids";

interface Line { a: number; b: number }

/**
 * corners는 prism 옆면 순서 [a아래, a위, b위, b아래]다. owners의 빈 문자열
 * 띠는 내보내지 않는다.
 */
export const splitVerticalFace = (
  corners: readonly IAutoMovieVector3[],
  plane: HeightPlane,
  thickness: number,
  owners: { below: string; within: string; above: string },
): WallFace[] => {
  if (corners.length !== 4) return [{ surface: owners.below, corners: [...corners] }];
  const [aLow, aHigh, bHigh, bLow] = corners as [IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3];
  const length = Math.hypot(bLow.x - aLow.x, bLow.z - aLow.z);
  const at = (s: number) => ({ x: aLow.x + (bLow.x - aLow.x) * s / length, z: aLow.z + (bLow.z - aLow.z) * s / length });
  const line = (y0: number, y1: number): Line => ({ a: y0, b: (y1 - y0) / length });
  const low = line(aLow.y, bLow.y);
  const high = line(aHigh.y, bHigh.y);
  const top = line(planeHeight(plane, at(0)), planeHeight(plane, at(length)));
  const under: Line = { a: top.a - thickness, b: top.b };
  const y = (l: Line, s: number) => l.a + l.b * s;
  const breaks = new Set([0, length]);
  for (const r of [top, under]) {
    for (const w of [low, high]) {
      const db = r.b - w.b;
      if (Math.abs(db) < 1e-12) continue;
      const s = (w.a - r.a) / db;
      if (s > 1e-6 && s < length - 1e-6) breaks.add(s);
    }
  }
  const ordered = [...breaks].sort((p, q) => p - q);
  const faces: WallFace[] = [];
  for (let k = 0; k + 1 < ordered.length; ++k) {
    const s0 = ordered[k]!;
    const s1 = ordered[k + 1]!;
    const m = (s0 + s1) / 2;
    const pick = (lines: Line[], kind: "max" | "min"): Line => lines.reduce((best, l) =>
      (kind === "max" ? y(l, m) > y(best, m) : y(l, m) < y(best, m)) ? l : best);
    const bands: Array<[string, Line, Line]> = [
      [owners.below, low, pick([high, under], "min")],
      [owners.within, pick([low, under], "max"), pick([high, top], "min")],
      [owners.above, pick([low, top], "max"), high],
    ];
    for (const [surface, lo, hi] of bands) {
      if (surface.length === 0 || y(hi, m) - y(lo, m) < 1e-6) continue;
      const p0 = at(s0);
      const p1 = at(s1);
      const raw = [
        { x: p0.x, y: y(lo, s0), z: p0.z }, { x: p0.x, y: y(hi, s0), z: p0.z },
        { x: p1.x, y: y(hi, s1), z: p1.z }, { x: p1.x, y: y(lo, s1), z: p1.z },
      ];
      const kept = raw.filter((c, i) => {
        const n = raw[(i + 1) % raw.length]!;
        return Math.hypot(c.x - n.x, c.y - n.y, c.z - n.z) > 1e-6;
      });
      if (kept.length >= 3) faces.push({ surface, corners: kept });
    }
  }
  return faces;
};

/**
 * 볼록 수직 면을 수평면 y=level에서 아래·위 두 볼록 면으로 나눈다.
 * 꼭짓점 순서를 유지하므로 바깥 법선이 바뀌지 않는다. 한쪽만 걸치면
 * 원래 면을 그 쪽 표면으로 돌려주고, 면적 없는 조각은 버린다.
 */
export const splitAtLevel = (face: WallFace, level: number, below: string, above: string): WallFace[] => {
  const clip = (keepBelow: boolean): IAutoMovieVector3[] => {
    const inside = (p: IAutoMovieVector3) => keepBelow ? p.y <= level + 1e-9 : p.y >= level - 1e-9;
    const out: IAutoMovieVector3[] = [];
    face.corners.forEach((a, i) => {
      const b = face.corners[(i + 1) % face.corners.length]!;
      if (inside(a)) out.push(a);
      if (inside(a) !== inside(b) && Math.abs(b.y - a.y) > 1e-12) {
        const t = (level - a.y) / (b.y - a.y);
        out.push({ x: a.x + (b.x - a.x) * t, y: level, z: a.z + (b.z - a.z) * t });
      }
    });
    return out.filter((c, i) => {
      const n = out[(i + 1) % out.length]!;
      return Math.hypot(c.x - n.x, c.y - n.y, c.z - n.z) > 1e-6;
    });
  };
  const ys = face.corners.map((c) => c.y);
  if (Math.max(...ys) <= level + 1e-6) return [{ surface: below, corners: face.corners }];
  if (Math.min(...ys) >= level - 1e-6) return [{ surface: above, corners: face.corners }];
  return [
    { surface: below, corners: clip(true) }, { surface: above, corners: clip(false) },
  ].filter((f) => f.corners.length >= 3);
};
