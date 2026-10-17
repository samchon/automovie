import type { Bone } from "../geometry/Bone.ts";
import type { Mesh } from "../geometry/Mesh.ts";
import type { Skin } from "../geometry/Skin.ts";
import { SurfaceIndex } from "../geometry/SurfaceIndex.ts";
import type { V3 } from "../geometry/V3.ts";
import { add } from "../geometry/add.ts";
import { buildSkin } from "../geometry/buildSkin.ts";
import { components } from "../geometry/components.ts";
import { cross } from "../geometry/cross.ts";
import { dot } from "../geometry/dot.ts";
import { mul } from "../geometry/mul.ts";
import { norm } from "../geometry/norm.ts";
import { sub } from "../geometry/sub.ts";
import type { ReferenceManifest } from "../io/ReferenceManifest.ts";
import { loadGate } from "../io/loadGate.ts";
import type { AuxiliarySurface } from "./AuxiliarySurface.ts";
import type { HeadContext } from "./HeadContext.ts";

/**
 * Loads one hash-bound native source and indexes its skin and auxiliary eyes.
 *
 * Eye classification uses separate closed components with 18..34 mm bounding
 * extents near the paired orbits. This is a source-classification convention;
 * ambiguous sources fail rather than acquire invented anatomical identities.
 * Area-weighted normals use the combined closed skin's signed orientation.
 * The source must already have qualified closure and consistent face winding;
 * a nonzero signed volume selects orientation but does not prove those premises.
 *
 * @evidence contracts/common.md#principled-implementation Hash-admitted source loading, seam-canonical area normals, connected components and edge incidence establish one native observation context; classification ambiguity fails.
 * @evidence contracts/common.md#clear-and-simple-design Skin and auxiliary spatial indexes are created once and supplied to all head observers through one context.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Component size, location and triangle-count rules are explicit source-classification conventions, not demographic facts or per-identity fallback geometry.
 * @evidence contracts/common.md#meaningful-documentation States native-only registration, auxiliary classification uncertainty, normal orientation and context ownership; members describe units and failure effects.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices and T triangles, normals and components use O(V+T) scans; spatial indexes require their BVH construction cost, and component-local edge scans total O(T).
 * @evidence contracts/performance.md#reuse-equivalent-work One loaded context shares canonical skin, vertex normals and component indexes across the current operation's consumers; no cross-manifest cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned operation-owned context retains O(V+T) arrays and indexes; temporary component maps are released after return and there are no persistent handles or caches.
 */
export function loadHeadContext(manifest: ReferenceManifest): HeadContext {
  if (manifest.pose !== "native-A")
    throw new Error(
      "Head observations require the declared native-A source; diagnostic poses need a separate protocol.",
    );
  const g: ReturnType<typeof loadGate> = loadGate(manifest);
  const s: Skin = buildSkin(g.body, g.head, "native-A");
  const idx: SurfaceIndex = new SurfaceIndex(s.vertices, s.triangles);
  const accumulated: V3[] = s.vertices.map((): V3 => [0, 0, 0]);
  let sixVolume: number = 0;
  for (const triangle of s.triangles) {
    const a: V3 = s.vertices[triangle[0]];
    const b: V3 = s.vertices[triangle[1]];
    const c: V3 = s.vertices[triangle[2]];
    const normal: V3 = cross(sub(b, a), sub(c, a));
    sixVolume += dot(a, cross(b, c));
    for (const vertex of triangle)
      accumulated[s.canon[vertex]] = add(accumulated[s.canon[vertex]], normal);
  }
  if (!Number.isFinite(sixVolume) || Math.abs(sixVolume) < 1e-6)
    throw new Error("Closed source skin has no reliable global orientation.");
  const sign: number = sixVolume < 0 ? -1 : 1;
  const vn: V3[] = s.vertices.map(
    (_point: V3, i: number): V3 => mul(norm(accumulated[s.canon[i]]), sign),
  );
  const head: Mesh = g.head;
  const labels: ReturnType<typeof components> = components(
    head.vertices.length,
    head.triangles,
  );
  const byComponent: number[][] = Array.from(
    { length: labels.count },
    (): number[] => [],
  );
  head.triangles.forEach(
    (triangle: [number, number, number], i: number): void => {
      byComponent[labels.comp[triangle[0]]].push(i);
    },
  );
  const candidates: AuxiliarySurface[] = [];
  for (const sourceTriangles of byComponent) {
    if (sourceTriangles.length < 500) continue;
    const used: Set<number> = new Set<number>();
    for (const i of sourceTriangles)
      for (const vertex of head.triangles[i]) used.add(vertex);
    const low: V3 = [Infinity, Infinity, Infinity];
    const high: V3 = [-Infinity, -Infinity, -Infinity];
    for (const vertex of used)
      for (let axis: number = 0; axis < 3; axis++) {
        low[axis] = Math.min(low[axis], head.vertices[vertex][axis]);
        high[axis] = Math.max(high[axis], head.vertices[vertex][axis]);
      }
    const size: V3 = sub(high, low);
    const centre: V3 = mul(add(low, high), 0.5);
    if (
      !size.every((extent: number): boolean => extent > 18 && extent < 34) ||
      Math.abs(centre[0]) <= 15 ||
      Math.abs(centre[0]) >= 50
    )
      continue;
    const edgeCounts: Map<string, number> = new Map<string, number>();
    for (const i of sourceTriangles)
      for (let edge: number = 0; edge < 3; edge++) {
        const a: number = head.triangles[i][edge];
        const b: number = head.triangles[i][(edge + 1) % 3];
        const key: string = a < b ? `${a}_${b}` : `${b}_${a}`;
        edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1);
      }
    if (
      ![...edgeCounts.values()].every((count: number): boolean => count === 2)
    )
      continue;
    const local: Map<number, number> = new Map<number, number>();
    const vertices: V3[] = [];
    const triangles: [number, number, number][] = sourceTriangles.map(
      (i: number): [number, number, number] =>
        head.triangles[i].map((vertex: number): number => {
          if (!local.has(vertex)) {
            local.set(vertex, vertices.length);
            vertices.push(head.vertices[vertex]);
          }
          return local.get(vertex)!;
        }) as [number, number, number],
    );
    candidates.push({
      name: centre[0] > 0 ? "eyeball-l" : "eyeball-r",
      vertices,
      triangles,
      centre,
      idx: new SurfaceIndex(vertices, triangles),
    });
  }
  const left: AuxiliarySurface[] = candidates.filter(
    (candidate: AuxiliarySurface): boolean => candidate.centre[0] > 0,
  );
  const right: AuxiliarySurface[] = candidates.filter(
    (candidate: AuxiliarySurface): boolean => candidate.centre[0] < 0,
  );
  if (left.length !== 1 || right.length !== 1)
    throw new Error(
      `Source auxiliary-eye classification is ambiguous: ${candidates.length} qualifying components.`,
    );
  const bone: (name: string) => V3 = (name: string): V3 => {
    const value: Bone | undefined = s.bones.get(name) ?? s.headBones.get(name);
    if (!value) throw new Error(`Missing declared source bone: ${name}`);
    return value.pos;
  };
  return {
    gate: manifest.gate,
    manifest,
    g,
    s,
    idx,
    vn,
    eyes: { l: left[0], r: right[0] },
    bone,
  };
}
