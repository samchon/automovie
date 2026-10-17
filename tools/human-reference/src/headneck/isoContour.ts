import { CutPoint } from "../geometry/CutPoint.ts";
import { Polyline } from "../geometry/Polyline.ts";
import { Skin } from "../geometry/Skin.ts";
import { lerp } from "../geometry/lerp.ts";

/**
 * Extracts a linearly interpolated scalar level on the admitted source skin.
 * NaN vertices and an optional triangle scope leave explicit open endpoints.
 * Points retain their source-edge witness for private observation provenance.
 *
 * Canonical seam addresses join coincident source edges. Scalar values within
 * 1e-12 of the level receive a positive tie bias, so a vertex-level ambiguity
 * has one repeatable side. The graph follows its first unused continuation;
 * manifold scalar contours are required for a unique continuation.
 *
 * @evidence contracts/common.md#principled-implementation Affine edge roots inside source triangles produce scalar-isoline segments; canonical edge witnesses recover the admitted welded connectivity while scope and nonfinite fields retain open boundaries.
 * @evidence contracts/common.md#clear-and-simple-design Field classification, source-edge deduplication and graph traversal form one extraction operation, exposing ordered points and closure to region owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The tie bias resolves numerical degeneracy uniformly and no source identity or anatomical index selects output.
 * @evidence contracts/common.md#meaningful-documentation The contract states scalar interpolation, seam ownership, nonfinite scope, numerical ties and the manifold-contour limitation.
 * @evidence contracts/performance.md#efficient-algorithms V field classifications and T triangle visits take O(V+T+E), with maps bounded by intersected source edges E; each retained graph vertex is visited once.
 * @evidence contracts/performance.md#reuse-equivalent-work A canonical edge map computes each shared intersection once during the invocation; no result is cached across changed skins, fields or scopes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Field classifications and adjacency are invocation-owned; only returned polylines retain intersection records after completion.
 */
export function isoContour(
  skin: Skin,
  field: Float64Array,
  level: number,
  triangleScope?: (index: number) => boolean,
): Polyline[] {
  if (field.length !== skin.vertices.length || !Number.isFinite(level))
    throw new Error(
      "The scalar field must match the source vertex count and have a finite level",
    );
  const offsets: Float64Array = new Float64Array(field.length);
  for (let i: number = 0; i < field.length; i++) {
    const difference: number = field[i] - level;
    offsets[i] = Math.abs(difference) < 1e-12 ? 1e-12 : difference;
  }
  const adjacency: Map<string, string[]> = new Map();
  const intersections: Map<string, CutPoint> = new Map();
  for (let i: number = 0; i < skin.triangles.length; i++) {
    const triangle: [number, number, number] = skin.triangles[i];
    if (
      !Number.isFinite(offsets[triangle[0]]) ||
      !Number.isFinite(offsets[triangle[1]]) ||
      !Number.isFinite(offsets[triangle[2]])
    )
      continue;
    const first: boolean = offsets[triangle[0]] > 0;
    if (
      first === offsets[triangle[1]] > 0 &&
      first === offsets[triangle[2]] > 0
    )
      continue;
    if (triangleScope && !triangleScope(i)) continue;
    const keys: string[] = [];
    for (let corner: number = 0; corner < 3; corner++) {
      const a: number = triangle[corner];
      const b: number = triangle[(corner + 1) % 3];
      if (offsets[a] > 0 === offsets[b] > 0) continue;
      const canonicalA: number = skin.canon[a];
      const canonicalB: number = skin.canon[b];
      const key: string =
        canonicalA < canonicalB
          ? `${canonicalA}_${canonicalB}`
          : `${canonicalB}_${canonicalA}`;
      if (!intersections.has(key)) {
        const fraction: number = offsets[a] / (offsets[a] - offsets[b]);
        const point: CutPoint =
          canonicalA < canonicalB
            ? {
                p: lerp(skin.vertices[a], skin.vertices[b], fraction),
                a: canonicalA,
                b: canonicalB,
                t: fraction,
              }
            : {
                p: lerp(skin.vertices[a], skin.vertices[b], fraction),
                a: canonicalB,
                b: canonicalA,
                t: 1 - fraction,
              };
        intersections.set(key, point);
      }
      keys.push(key);
    }
    if (keys.length !== 2) continue;
    for (const key of keys) if (!adjacency.has(key)) adjacency.set(key, []);
    adjacency.get(keys[0])!.push(keys[1]);
    adjacency.get(keys[1])!.push(keys[0]);
  }
  const visited: Set<string> = new Set();
  const output: Polyline[] = [];
  for (const openFirst of [true, false])
    for (const [start, neighbours] of adjacency) {
      if (visited.has(start) || (openFirst && neighbours.length !== 1))
        continue;
      const keys: string[] = [start];
      let current: string = start;
      visited.add(start);
      let closed: boolean = false;
      for (;;) {
        const next: string | undefined = (adjacency.get(current) ?? []).find(
          (key: string): boolean => !visited.has(key),
        );
        if (next === undefined) {
          closed =
            keys.length > 2 && (adjacency.get(current) ?? []).includes(start);
          break;
        }
        visited.add(next);
        keys.push(next);
        current = next;
      }
      output.push({
        closed,
        pts: keys.map((key: string): CutPoint => intersections.get(key)!),
      });
    }
  return output;
}
