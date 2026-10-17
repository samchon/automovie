import { Skin } from "../geometry/Skin.ts";
import { V3 } from "../geometry/V3.ts";
import { dot } from "../geometry/dot.ts";
import { norm } from "../geometry/norm.ts";
import { CriticalVertex } from "./CriticalVertex.ts";

/**
 * Classifies generic PL height vertices by connected lower and upper links.
 * Equal heights use a private symbolic address order without perturbing physical coordinates.
 * Bremer et al. 2004, sections II.C and III.A: https://web.cs.ucdavis.edu/~hamann/BremerEdelsbrunnerHamannPascucci2004TVCG.pdf
 * A manifold link must be one cycle; nonmanifold links remain explicit unresolved source observations.
 *
 * @evidence contracts/common.md#principled-implementation Lower and upper link connectivity classify PL-height critical vertices under the cited generic-height method; equal values use private symbolic ties.
 * @evidence contracts/common.md#clear-and-simple-design Physical geometry is never perturbed and nonmanifold links remain explicit unresolved observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms O(triangles) link construction plus local-link traversals; degenerate high-valence links can cost quadratic local scans.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated work is reused only inside this operation where source identity is fixed; no cross-call or identity-dependent result cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Link graphs are released after returning private transient events; callers must discard source addresses before serialization.
 */
export function critical(skin: Skin, axis: V3 = [0, 1, 0]): CriticalVertex[] {
  const direction: V3 = norm(axis);
  if (dot(direction, direction) === 0)
    throw new Error("Critical height axis is zero");
  const heights: number[] = skin.vertices.map((point: V3): number =>
    dot(point, direction),
  );
  const links: Map<number, Map<number, Set<number>>> = new Map();
  const edge = (vertex: number, a: number, b: number): void => {
    if (!links.has(vertex)) links.set(vertex, new Map());
    const link: Map<number, Set<number>> = links.get(vertex)!;
    if (!link.has(a)) link.set(a, new Set());
    if (!link.has(b)) link.set(b, new Set());
    link.get(a)!.add(b);
    link.get(b)!.add(a);
  };
  for (const triangle of skin.triangles) {
    const t: number[] = triangle.map((i: number): number => skin.canon[i]);
    if (new Set(t).size !== 3) continue;
    for (let k: number = 0; k < 3; k++)
      edge(t[k], t[(k + 1) % 3], t[(k + 2) % 3]);
  }
  const events: CriticalVertex[] = [];
  for (const [vertex, link] of links) {
    const level: number = heights[vertex];
    const below = (other: number): boolean =>
      heights[other] < level || (heights[other] === level && other < vertex);
    const components = (lower: boolean): number => {
      const seen: Set<number> = new Set();
      let count: number = 0;
      for (const start of link.keys()) {
        if (seen.has(start) || below(start) !== lower) continue;
        count++;
        seen.add(start);
        const queue: number[] = [start];
        for (let k: number = 0; k < queue.length; k++)
          for (const other of link.get(queue[k])!)
            if (!seen.has(other) && below(other) === lower) {
              seen.add(other);
              queue.push(other);
            }
      }
      return count;
    };
    const lower: number = components(true),
      upper: number = components(false);
    const first: number = link.keys().next().value!;
    const connected: Set<number> = new Set([first]);
    const queue: number[] = [first];
    for (let k: number = 0; k < queue.length; k++)
      for (const other of link.get(queue[k])!)
        if (!connected.has(other)) {
          connected.add(other);
          queue.push(other);
        }
    const manifold: boolean =
      connected.size === link.size &&
      [...link.values()].every(
        (neighbours: Set<number>): boolean => neighbours.size === 2,
      );
    if (lower !== 1 || upper !== 1 || !manifold)
      events.push({
        vertex,
        level,
        p: skin.vertices[vertex],
        lower,
        upper,
        flat: [...link.keys()].some(
          (other: number): boolean => heights[other] === level,
        ),
        manifold,
      });
  }
  return events.sort(
    (a: CriticalVertex, b: CriticalVertex): number =>
      a.level - b.level || a.vertex - b.vertex,
  );
}
