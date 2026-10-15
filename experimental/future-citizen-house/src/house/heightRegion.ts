/** Metric regions with explicit lower/upper faces. The public triangulator
 * retains holes; the public polyhedron builder owns winding, normals and UVs.
 * These helpers own no building layout and never merge touching members. */
import { buildAutoMoviePolyhedron, triangulateAutoMovieRegion, inspectAutoMovieMeshTopology } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";
import { v } from "./v";
import { Point } from "./Point";
import { Height } from "./Height";

/** Heights must be affine on every emitted face; a fall reversal is split by
 * the owning caller, not approximated with one tilted box. */
export function heightRegion(outer: Point[], bottom: Height, top: Height, holes: Point[][] = [], boreBottom?: Height): IAutoMovieMesh {
  const plan = triangulateAutoMovieRegion({ outer, holes });
  const lower = plan.points.map(p => v(p.x, bottom(p.x, p.y), p.y));
  const upper = plan.points.map(p => v(p.x, top(p.x, p.y), p.y));
  if (lower.some((p, i) => p.y >= upper[i].y)) throw new Error("Solid has nonpositive depth");
  if (boreBottom && holes.flat().some(p => boreBottom(p.x, p.y) <= bottom(p.x, p.y) || boreBottom(p.x, p.y) >= top(p.x, p.y)))
    throw new Error("Blind bore floor must be inside the solid");
  const faces: IAutoMovieVector3[][] = [];
  for (let i = 0; i < plan.triangles.length; i += 3) {
    const [a, b, c] = plan.triangles.slice(i, i + 3);
    if (!boreBottom) faces.push([lower[a], lower[b], lower[c]]);
    faces.push([upper[c], upper[b], upper[a]]);
  }
  for (const ring of plan.rings) for (let i = 0; i < ring.count; i++) {
    const a = ring.start + i, b = ring.start + (i + 1) % ring.count;
    const lowA = boreBottom && ring !== plan.rings[0] ? v(lower[a].x, boreBottom(lower[a].x, lower[a].z), lower[a].z) : lower[a];
    const lowB = boreBottom && ring !== plan.rings[0] ? v(lower[b].x, boreBottom(lower[b].x, lower[b].z), lower[b].z) : lower[b];
    faces.push([lowA, upper[a], upper[b], lowB]);
  }
  if (boreBottom) {
    const cap = (ring: Point[], height: Height, up: boolean) => {
      const t = triangulateAutoMovieRegion({ outer: ring });
      for (let i = 0; i < t.triangles.length; i += 3) {
        const points = t.triangles.slice(i, i + 3).map(j => v(t.points[j].x, height(t.points[j].x, t.points[j].y), t.points[j].y));
        faces.push(up ? points.reverse() : points);
      }
    };
    cap(outer, bottom, false);
    for (const hole of holes) cap(hole, boreBottom, true);
  }
  const mesh = buildAutoMoviePolyhedron(faces);
  const report = inspectAutoMovieMeshTopology(mesh);
  if (!report.watertight || report.volume <= 0 || report.nonFinite || report.degenerate)
    throw new Error("Metric solid topology: " + JSON.stringify(report));
  return mesh;
}

