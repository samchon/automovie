import { CutPoint } from "./CutPoint.ts";
import { Plane } from "./Plane.ts";
import { Polyline } from "./Polyline.ts";
import { Skin } from "./Skin.ts";
import { V3 } from "./V3.ts";
import { dot } from "./dot.ts";
import { lerp } from "./lerp.ts";
import { sub } from "./sub.ts";

/**
 * Intersects source triangles and walks their canonical edge adjacency in O(vertices + triangles).
 * Source vertices within 1e-9 length units of the plane count positive, matching the inherited
 * observation protocol. Open fragments remain open; nonmanifold contacts require separate qualification.
 *
 * @evidence contracts/common.md#principled-implementation Triangle-edge sign changes and canonical edge adjacency yield ordered physical source/plane intersections.
 * @evidence contracts/common.md#clear-and-simple-design One producer owns edge interpolation, open fragments and the documented symbolic on-plane convention.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms O(vertices + triangles) per plane plus O(crossed edges) adjacency and output storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated work is reused only inside this operation where source identity is fixed; no cross-call or identity-dependent result cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Adjacency and seen maps are local; returned source-edge observations have explicit private ownership.
 */
export function cut(
  skin: Pick<Skin, "vertices" | "triangles" | "canon">,
  plane: Plane,
  select?: (triangle: number) => boolean,
): Polyline[] {
  const distances: Float64Array = new Float64Array(skin.vertices.length);
  for (let i: number = 0; i < skin.vertices.length; i++) {
    const value: number = dot(sub(skin.vertices[i], plane.origin), plane.n);
    distances[i] = Math.abs(value) < 1e-9 ? 1e-9 : value;
  }
  const adjacency: Map<string, string[]> = new Map();
  const points: Map<string, CutPoint> = new Map();
  for (let i: number = 0; i < skin.triangles.length; i++) {
    const triangle: [number, number, number] = skin.triangles[i];
    const signs: boolean[] = triangle.map(
      (v: number): boolean => distances[v] > 0,
    );
    if (signs[0] === signs[1] && signs[1] === signs[2]) continue;
    if (select && !select(i)) continue;
    const keys: string[] = [];
    for (let k: number = 0; k < 3; k++) {
      const a: number = triangle[k],
        b: number = triangle[(k + 1) % 3];
      if (distances[a] > 0 === distances[b] > 0) continue;
      const ca: number = skin.canon[a],
        cb: number = skin.canon[b];
      const key: string = ca < cb ? `${ca}_${cb}` : `${cb}_${ca}`;
      if (!points.has(key)) {
        const t: number = distances[a] / (distances[a] - distances[b]);
        // Coordinates and t use this original edge; canonical labels below own connectivity only.
        const p: V3 = lerp(skin.vertices[a], skin.vertices[b], t);
        points.set(
          key,
          ca < cb ? { p, a: ca, b: cb, t } : { p, a: cb, b: ca, t: 1 - t },
        );
      }
      keys.push(key);
    }
    if (keys.length !== 2) continue;
    if (!adjacency.has(keys[0])) adjacency.set(keys[0], []);
    if (!adjacency.has(keys[1])) adjacency.set(keys[1], []);
    adjacency.get(keys[0])!.push(keys[1]);
    adjacency.get(keys[1])!.push(keys[0]);
  }
  const seen: Set<string> = new Set();
  const output: Polyline[] = [];
  const walk = (start: string): Polyline => {
    const keys: string[] = [start];
    seen.add(start);
    let current: string = start;
    for (;;) {
      const next: string | undefined = (adjacency.get(current) ?? []).find(
        (key: string): boolean => !seen.has(key),
      );
      if (next === undefined)
        return {
          closed:
            keys.length > 2 && (adjacency.get(current) ?? []).includes(start),
          pts: keys.map((key: string): CutPoint => points.get(key)!),
        };
      seen.add(next);
      keys.push(next);
      current = next;
    }
  };
  for (const [key, neighbours] of adjacency)
    if (neighbours.length === 1 && !seen.has(key)) output.push(walk(key));
  for (const key of adjacency.keys())
    if (!seen.has(key)) output.push(walk(key));
  return output;
}
