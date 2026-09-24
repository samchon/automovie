/**
 * 같은 실체 집합 안에서 서로 맞닿은 수직 면의 겹친 부분을 제거한다.
 * 인접한 볼록 기둥/지붕 조각의 공통 접면은 양쪽 실체 안에 숨으므로
 * 노출 면이 아니며, 남기면 한 표면 part에서 한 변을 네 삼각형이 공유한다.
 * 같은 평면·반대 법선의 면끼리 평면 좌표 (s, y)에서 사다리꼴 차집합을
 * 계산해 실제로 드러난 부분(문설주 reveal, 지붕 높이 차이의 끝면)만 남긴다.
 * 겹침이 없는 면은 좌표를 다시 계산하지 않고 그대로 둔다.
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
    // 반대 면은 같은 평면을 -n 기준 s로 표현하므로 s 부호를 뒤집는다.
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

/** 법선이 수평이고 두 수직 변을 가진 볼록 사각형/삼각형만 평면 사다리꼴로 읽는다. */
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

/** strip에서 covers 합집합을 뺀 조각. 선분 교차점마다 s를 나눠 순서를 고정한다. */
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
 * 원래 면과 같은 법선의 꼭짓점. 한쪽 높이가 같으면 삼각형으로 줄인다.
 * 원래 꼭짓점이 어느 변부터 돌았든 asVertical과 같은 식으로 법선을 다시 구해
 * 원래 법선 (nx, nz)와 반대면 순서를 뒤집는다.
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
