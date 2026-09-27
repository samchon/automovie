/**
 * Derive one boundary face's sided segments from the built space cells.
 *
 * Design owner: `docs/spaces/07-boundary-assembly.md` owns the common-wall
 * handoff and junction rule. `environment.ts` consumes these calculations to
 * emit engine boundaries and openings from the same wall face that produced
 * the visible mesh. No wall geometry or room finish is created here.
 *
 * Inputs are a wall outline and holes in local (u, world-Y) metres, an axis
 * and thickness across world X or Z, and compiled convex space cells. Probe
 * points lie 1 mm beyond either wall face. Segments split at each cell and
 * void edge, then merge only while their two side IDs remain equal. A segment
 * with equal IDs on both sides is not a separating boundary. Consumers must
 * rebuild after any room cell, wall outline, or void changes.
 */
import { builtSpaceContainsPoint } from "@automovie/engine";
import type {
  IAutoMovieBuiltSpace,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IWallFace, IWallPoint } from "./solid-records";

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

/** Clip a face outline to a (u, y) rectangle, one rectangle side at a time. */
/**
 * @evidence spaces/07-boundary-assembly.md clipOutline restricts one existing wall face to a smaller u/Y boundary rectangle.
 * @evidenceReview spaces/07-boundary-assembly.md #007d289 v-141 boundaries.ts:59-86 clips a face outline to a (u,y) rectangle; environment.ts:659 applies it per segment of one wall face. 07-boundary-assembly.md:47 gives boundaries.ts the same-boundary handoff without wall geometry.
 * @evidence principles/core/source-units.md#source-scope-preservation It returns clipped points only; it does not create another wall or assign a room finish.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 boundaries.ts:59-86 returns IWallPoint[] only (no part/mesh/colour); 07-boundary-assembly.md:47 and 03-surface-owners.md:60 say boundaries.ts owns no wall or finish.
 * @evidence principles/core/source-units.md#source-substantive-completion Four successive half-plane clips and duplicate-corner removal produce an actual polygon for the segment.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 boundaries.ts:60-65 four half-plane functions; L67-83 Sutherland-Hodgman clip per side plus consecutive-duplicate filter (1e-9); returns the clipped polygon (audited in measurements/boundary-audit.ts:76-79).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-junctions keeps one wall face across room and opening contacts; clipOutline restricts that supplied face to a u/Y segment without another wall body.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A holds: clipOutline (boundaries.ts:59-86) only clips a supplied face polygon to a u/Y rectangle, no wall body. B loose: #interior-boundary-junctions body (07-boundary-assembly.md:75-87) covers shared junction bodies, corner closure and one cut boundary for openings (07:77,79) and gives boundaries.ts junction plan zones (07:75); the sided-segment handoff clipOutline serves is 07:47 in sibling #interior-boundary-ownership.
 */
export const clipOutline = (outline: readonly IWallPoint[], u: readonly [number, number], y: readonly [number, number]): IWallPoint[] => {
  const sides: ((p: IWallPoint) => number)[] = [
    (p) => p.u - u[0],
    (p) => u[1] - p.u,
    (p) => p.y - y[0],
    (p) => y[1] - p.y,
  ];
  let poly: IWallPoint[] = [...outline];
  for (const d of sides) {
    const next: IWallPoint[] = [];
    for (let i = 0; i < poly.length; ++i) {
      const a = poly[i]!;
      const b = poly[(i + 1) % poly.length]!;
      const da = d(a);
      const db = d(b);
      if (da >= 0) next.push(a);
      if (da >= 0 !== db >= 0) {
        const s = da / (da - db);
        next.push({ u: a.u + s * (b.u - a.u), y: a.y + s * (b.y - a.y) });
      }
    }
    poly = next.filter((q, i, all) => {
      const prev = all[(i + all.length - 1) % all.length]!;
      return Math.abs(q.u - prev.u) > 1e-9 || Math.abs(q.y - prev.y) > 1e-9;
    });
  }
  return poly;
};

/** One boundary segment of a wall: a rectangle of its face between one pair of spaces. */
interface ISegment {
  u: [number, number];
  y: [number, number];
  sides: readonly [string, string];
}

/**
 * Cut a wall face into the rectangles that separate one pair of spaces. The
 * grid breaks at every room or stair cell edge along the wall axis and in
 * height, and at every void edge; a cell whose two sides are the same space,
 * or whose centre lies outside the wall outline, bounds nothing and is
 * dropped. Equal-pair cells merge along the wall, then equal runs merge upward.
 */
/**
 * @evidence spaces/07-boundary-assembly.md segmentsOf assigns the two logical sides of each part of an existing wall face.
 * @evidenceReview spaces/07-boundary-assembly.md #007d289 v-141 segmentsOf L109-159 gets [side-, side+] per cell via sidesAt L35-39 (probe at half+0.001), house-site when outside; 07-boundary-assembly.md:47 assembly passes the two partner spaces of each boundary.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-junctions It cuts at cell and void edges, then merges adjacent rectangles only when both space ids agree.
 * @evidenceReview spaces/07-boundary-assembly.md#interior-boundary-junctions #78b06b5 v-141 L113-123 cut at cell plane offsets (|n|=1) and hole from/to/bottom/top; L147 merge along u and L151-155 merge upward only when both sides equal. Matches 07-boundary-assembly.md:75 (no merge by plan projection alone) and :79 (same cut boundary).
 * @evidence principles/core/source-units.md#source-scope-preservation The function reads built cells and the given face; it emits boundary records without a second wall mesh.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 L109 reads inner built spaces and the face; returns ISegment[] (u,y,sides) with no mesh; environment.ts:649-665 turns them into boundaries. 03-surface-owners.md:60 and 07:47: boundaries.ts creates no wall.
 * @evidence principles/core/source-units.md#source-substantive-completion It drops exterior-to-exterior or same-side cells and returns deterministic u/Y segments for environment boundaries.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 L143 drops cells whose centre is outside the outline. L145 drops equal sides, including house-site|house-site. Cuts are sorted (L128-133) and merges are ordered, so the u/y segments are deterministic.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-junctions requires a single partition body and sided records at room/void changes; segmentsOf splits the existing face at those cell and opening edges.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A holds: segmentsOf (boundaries.ts:109-159) cuts u/y at cell planes and hole edges (113-123), resolves two sides (144) and merges equal pairs. B: "sided records" (two partner spaces per boundary) are required at 07-boundary-assembly.md:47 and the single common body at 07:27, both in sibling #interior-boundary-ownership; the junctions H2 (07:75-87) covers junction zones/heights and opening cuts. Same-file sibling attribution.
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
    (a, b) => a - b,
  );
  const yCuts = [...ys].filter((v) => v >= yMin && v <= yMax).sort(
    (a, b) => a - b,
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
        (m) => m.y[1] === seg.y[0] && m.u[0] === seg.u[0] && m.u[1] === seg.u[1] && m.sides[0] === seg.sides[0] && m.sides[1] === seg.sides[1],
      );
      if (below !== undefined) below.y[1] = seg.y[1];
      else merged.push(seg);
    }
  }
  return merged;
};
