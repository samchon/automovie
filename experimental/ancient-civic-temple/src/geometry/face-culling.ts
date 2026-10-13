/**
 * Removes the overlapping parts of vertical faces that touch each other within one solid set.
 * The shared contact face of adjacent convex columns or roof pieces is hidden inside both solids, so it is
 * not exposed; keeping it would make four triangles share one edge in one surface part.
 * For coplanar faces with opposite normals, the trapezoid difference is computed in plane coordinates (s, y)
 * and only the actually exposed parts (door-jamb reveals, end faces at roof height changes) are kept.
 * A face with no overlap is kept as is without recomputing its coordinates.
 */
import type { IAutoMovieVector3 } from "@automovie/interface";
import type { WallFace } from "./wall-solids";

interface Line { a: number; b: number } // y = a + b*s
interface Strip { s0: number; s1: number; low: Line; high: Line }
interface Vertical {
  face: WallFace;
  nx: number; nz: number; offset: number;
  strip: Strip;
}

const tolerance = 1e-6;

export const cullCoincidentVerticalFaces = (faces: readonly WallFace[]): WallFace[] => {
  const verticals: Vertical[] = [];
  const others: WallFace[] = [];
  for (const face of faces) {
    const vertical = asVertical(face);
    if (vertical === null) others.push(face);
    else verticals.push(vertical);
  }
  const key = (nx: number, nz: number, offset: number) =>
    `${Math.round(nx * 1e6)},${Math.round(nz * 1e6)},${Math.round(offset * 1e5)}`;
  const byPlane = new Map<string, Vertical[]>();
  for (const v of verticals) {
    const k = key(v.nx, v.nz, v.offset);
    byPlane.set(k, [...byPlane.get(k) ?? [], v]);
  }
  const result: WallFace[] = [...others];
  for (const v of verticals) {
    const opposing = byPlane.get(key(-v.nx, -v.nz, -v.offset)) ?? [];
    // The opposite face expresses the same plane with s along -n, so the sign of s is flipped.
    const covers = opposing.map((o) => flip(o.strip))
      .filter((c) => Math.min(c.s1, v.strip.s1) - Math.max(c.s0, v.strip.s0) > tolerance);
    if (covers.length === 0) {
      result.push(v.face);
      continue;
    }
    for (const piece of subtract(v.strip, covers)) {
      const corners = toCorners(v, piece);
      if (corners !== null) result.push({ surface: v.face.surface, corners });
    }
  }
  return result;
};

/** Reads only convex quads or triangles with a horizontal normal and two vertical edges as plane trapezoids. */
const asVertical = (face: WallFace): Vertical | null => {
  const c = face.corners;
  const n = cross(sub(c[1]!, c[0]!), sub(c[c.length - 1]!, c[0]!));
  const length = Math.hypot(n.x, n.y, n.z);
  if (length === 0 || Math.abs(n.y / length) > 1e-9) return null;
  const nx = n.x / length;
  const nz = n.z / length;
  const offset = nx * c[0]!.x + nz * c[0]!.z;
  const s = (p: IAutoMovieVector3) => -nz * p.x + nx * p.z;
  const values = c.map(s);
  const s0 = Math.min(...values);
  const s1 = Math.max(...values);
  if (s1 - s0 < tolerance) return null;
  const at = (target: number) => c.filter((_, i) => Math.abs(values[i]! - target) < tolerance).map((p) => p.y);
  const left = at(s0);
  const right = at(s1);
  if (left.length + right.length !== c.length || left.length === 0 || right.length === 0) return null;
  const line = (y0: number, y1: number): Line => ({ b: (y1 - y0) / (s1 - s0), a: y0 - (y1 - y0) / (s1 - s0) * s0 });
  return {
    face, nx, nz, offset,
    strip: {
      s0, s1,
      low: line(Math.min(...left), Math.min(...right)),
      high: line(Math.max(...left), Math.max(...right)),
    },
  };
};

const flip = (strip: Strip): Strip => ({
  s0: -strip.s1, s1: -strip.s0,
  low: { a: strip.low.a, b: -strip.low.b },
  high: { a: strip.high.a, b: -strip.high.b },
});

const y = (line: Line, s: number) => line.a + line.b * s;

/** The pieces of strip minus the union of covers. s is split at every segment crossing to fix the order. */
const subtract = (strip: Strip, covers: readonly Strip[]): Strip[] => {
  const lines = [strip.low, strip.high, ...covers.flatMap((c) => [c.low, c.high])];
  const breaks = new Set([strip.s0, strip.s1]);
  for (const c of covers) {
    for (const s of [c.s0, c.s1]) if (s > strip.s0 && s < strip.s1) breaks.add(s);
  }
  for (let i = 0; i < lines.length; ++i) {
    for (let j = i + 1; j < lines.length; ++j) {
      const db = lines[i]!.b - lines[j]!.b;
      if (Math.abs(db) < 1e-12) continue;
      const s = (lines[j]!.a - lines[i]!.a) / db;
      if (s > strip.s0 + tolerance && s < strip.s1 - tolerance) breaks.add(s);
    }
  }
  const ordered = [...breaks].sort((a, b) => a - b);
  const pieces: Strip[] = [];
  for (let k = 0; k + 1 < ordered.length; ++k) {
    const s0 = ordered[k]!;
    const s1 = ordered[k + 1]!;
    if (s1 - s0 < tolerance) continue;
    const m = (s0 + s1) / 2;
    const active = covers.filter((c) => c.s0 <= m && c.s1 >= m && y(c.high, m) - y(c.low, m) > tolerance)
      .sort((a, b) => y(a.low, m) - y(b.low, m));
    let bottom = strip.low;
    for (const c of active) {
      if (y(c.high, m) <= y(bottom, m) + tolerance) continue;
      if (y(c.low, m) >= y(strip.high, m) - tolerance) break;
      if (y(c.low, m) > y(bottom, m) + tolerance) pieces.push({ s0, s1, low: bottom, high: c.low });
      if (y(c.high, m) > y(bottom, m)) bottom = c.high;
    }
    if (y(strip.high, m) > y(bottom, m) + tolerance) pieces.push({ s0, s1, low: bottom, high: strip.high });
  }
  return pieces;
};

/**
 * Vertices with the same normal as the original face; collapses to a triangle when one side's heights match.
 * Whichever edge the original vertices started from, the normal is recomputed the same way as asVertical, and
 * the order is reversed when it opposes the original normal (nx, nz).
 */
const toCorners = (v: Vertical, piece: Strip): IAutoMovieVector3[] | null => {
  const point = (s: number, height: number): IAutoMovieVector3 => ({
    x: v.offset * v.nx - v.nz * s, y: height, z: v.offset * v.nz + v.nx * s,
  });
  const raw = [
    point(piece.s0, y(piece.low, piece.s0)), point(piece.s0, y(piece.high, piece.s0)),
    point(piece.s1, y(piece.high, piece.s1)), point(piece.s1, y(piece.low, piece.s1)),
  ];
  const corners = raw.filter((c, i) => {
    const next = raw[(i + 1) % raw.length]!;
    return Math.hypot(c.x - next.x, c.y - next.y, c.z - next.z) > tolerance;
  });
  if (corners.length < 3) return null;
  const n = cross(sub(corners[1]!, corners[0]!), sub(corners[corners.length - 1]!, corners[0]!));
  return n.x * v.nx + n.z * v.nz < 0 ? corners.reverse() : corners;
};

const sub = (a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const cross = (a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 => ({
  x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x,
});
