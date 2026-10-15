import type { IAutoMovieBuiltSpace, IAutoMovieVector3 } from "@automovie/interface";
import type { IWallFace } from "../types/IWallFace";
import { builtSpaceContainsPoint } from "@automovie/engine";
import type { IWallPoint } from "../types/IWallPoint";
import { ISegment } from "./ISegment";

/** World point at (u, y) of a face, pushed `offset` along the face normal. */
const facePoint = (face: IWallFace, u: number, y: number, offset: number): IAutoMovieVector3 => {
  const center = (face.across[0] + face.across[1]) / 2 + offset;
  return face.axis === "x" ? { x: u, y, z: center } : { x: center, y, z: u };
};
/**
 * The logical spaces on the two sides of a wall face at (u, y): the room or
 * stair space containing a point 1 mm beyond each face, or the site when a
 * side lies in no room or stair.
 */
const sidesAt = (inner: readonly IAutoMovieBuiltSpace[], face: IWallFace, u: number, y: number): readonly [string, string] => {
  const half = (face.across[1] - face.across[0]) / 2 + 0.001;
  const at = (offset: number): string => inner.find((s) => builtSpaceContainsPoint(s, facePoint(face, u, y, offset)))?.id ?? "house-site";
  return [at(-half), at(half)];
};
/** Even-odd test of a face point against the face outline. */
const insideOutline = (outline: readonly IWallPoint[], u: number, y: number): boolean => {
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const a = outline[i]!;
    const b = outline[j]!;
    if (a.y > y !== b.y > y && u < ((b.u - a.u) * (y - a.y)) / (b.y - a.y) + a.u) inside = !inside;
  }
  return inside;
};
/**
 * Cut a wall face into the rectangles that separate one pair of spaces. The
 * grid breaks at every room or stair cell edge along the wall axis and in
 * height, and at every void edge; a cell whose two sides are the same space,
 * or whose centre lies outside the wall outline, bounds nothing and is
 * dropped. Equal-pair cells merge along the wall, then equal runs merge upward.
 */

export const segmentsOf = (inner: readonly IAutoMovieBuiltSpace[], face: IWallFace): ISegment[] => {
  const axis = face.axis;
  const us = new Set<number>(face.outline.map((q) => q.u));
  const ys = new Set<number>(face.outline.map((q) => q.y));
  for (const s of inner)
    for (const c of s.cells)
      for (const plane of c.planes) {
        const n = plane.normal;
        if (Math.abs(n[axis]) === 1) us.add(plane.offset * n[axis]);
        if (Math.abs(n.y) === 1) ys.add(plane.offset * n.y);
      }
  for (const h of face.holes) {
    us.add(h.from).add(h.to);
    ys.add(h.bottom).add(h.top);
  }
  const uMin = Math.min(...face.outline.map((q) => q.u));
  const uMax = Math.max(...face.outline.map((q) => q.u));
  const yMin = Math.min(...face.outline.map((q) => q.y));
  const yMax = Math.max(...face.outline.map((q) => q.y));
  const uCuts = [...us].filter((v) => v >= uMin && v <= uMax).sort(
    (a, b) => a - b
  );
  const yCuts = [...ys].filter((v) => v >= yMin && v <= yMax).sort(
    (a, b) => a - b
  );
  const merged: ISegment[] = [];
  for (let j = 0; j + 1 < yCuts.length; ++j) {
    const row: ISegment[] = [];
    for (let i = 0; i + 1 < uCuts.length; ++i) {
      const u: [number, number] = [uCuts[i]!, uCuts[i + 1]!];
      const y: [number, number] = [yCuts[j]!, yCuts[j + 1]!];
      if (u[1] - u[0] < 1e-6 || y[1] - y[0] < 1e-6) continue;
      const cu = (u[0] + u[1]) / 2;
      const cy = (y[0] + y[1]) / 2;
      if (!insideOutline(face.outline, cu, cy)) continue;
      const sides = sidesAt(inner, face, cu, cy);
      if (sides[0] === sides[1]) continue;
      const last = row[row.length - 1];
      if (last !== undefined && last.u[1] === u[0] && last.sides[0] === sides[0] && last.sides[1] === sides[1]) last.u[1] = u[1];
      else row.push({ u, y, sides });
    }
    for (const seg of row) {
      const below = merged.find(
        (m) => m.y[1] === seg.y[0] && m.u[0] === seg.u[0] && m.u[1] === seg.u[1] && m.sides[0] === seg.sides[0] && m.sides[1] === seg.sides[1]
      );
      if (below !== undefined) below.y[1] = seg.y[1];
      else merged.push(seg);
    }
  }
  return merged;
};
