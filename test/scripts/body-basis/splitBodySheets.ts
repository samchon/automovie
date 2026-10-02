import { measureAutoMovieMeshCrossings } from "@automovie/engine";

import { meshOfSegment } from "./bodyContactGeometry";

/**
 * The two sheets of a skin segment that passes through itself.
 *
 * A fold (a flank roll lying on the skin below it, toes lying against each
 * other, the soft tissue of an armpit) is one segment meeting itself, which
 * the two-segment contact solver cannot take as a pair. The crossing triangles
 * of one segment are the patches of each sheet that entered the other. Two
 * triangles that cross lie on opposite sheets of the fold, so the crossing
 * relation is two-coloured: a breadth-first walk over it gives each connected
 * tangle its two sides, even when the sides are joined through the crease
 * itself (the inside of a bent elbow), where grouping by shared corners would
 * see one patch and nothing to part. Each side is grown by `rings` rings of
 * the segment's triangles, never into the other side, so the push has tissue
 * around it to spread into; the second side grows around what the first took,
 * so no triangle belongs to both sides of one contact.
 *
 * Every tangle has at least two triangles, one per side, so both sides are
 * nonempty. `segment` lists corner indices, three per triangle; the result
 * lists corner indices in the same form, one pair per tangle.
 */
export function splitBodySheets(
  positions: number[],
  segment: number[],
  rings = 2,
): { a: number[]; b: number[] }[] {
  const mesh = meshOfSegment(positions, segment);
  const crossings = measureAutoMovieMeshCrossings(mesh, mesh);
  const triangles = segment.length / 3;
  const cornersOf = (t: number): number[] => segment.slice(t * 3, t * 3 + 3);
  const byVertex = new Map<number, number[]>();
  for (let t = 0; t < triangles; t++)
    for (const v of cornersOf(t)) {
      const list = byVertex.get(v);
      if (list === undefined) byVertex.set(v, [t]);
      else list.push(t);
    }
  const links = new Map<number, number[]>();
  const link = (a: number, b: number): void => {
    const list = links.get(a);
    if (list === undefined) links.set(a, [b]);
    else list.push(b);
  };
  for (const { triangle, other } of crossings) {
    if (triangle === other) continue;
    link(triangle, other);
    link(other, triangle);
  }
  const colour = new Map<number, 0 | 1>();
  const component = new Map<number, number>();
  let next = 0;
  for (const start of links.keys()) {
    if (colour.has(start)) continue;
    colour.set(start, 0);
    component.set(start, next);
    const queue = [start];
    while (queue.length > 0) {
      const t = queue.shift()!;
      for (const u of links.get(t)!)
        if (!colour.has(u)) {
          colour.set(u, colour.get(t) === 0 ? 1 : 0);
          component.set(u, next);
          queue.push(u);
        }
    }
    next++;
  }
  const side = (c: number, k: 0 | 1): Set<number> =>
    new Set(
      [...component]
        .filter(([t, n]) => n === c && colour.get(t) === k)
        .map(([t]) => t),
    );
  const grow = (seed: Set<number>, blocked: Set<number>): Set<number> => {
    const inside = new Set(seed);
    let frontier = [...inside];
    for (let ring = 0; ring < rings; ring++) {
      const added: number[] = [];
      for (const t of frontier)
        for (const v of cornersOf(t))
          for (const u of byVertex.get(v)!)
            if (!inside.has(u) && !blocked.has(u)) {
              inside.add(u);
              added.push(u);
            }
      frontier = added;
    }
    return inside;
  };
  const pairs: { a: number[]; b: number[] }[] = [];
  for (let c = 0; c < next; c++) {
    const a = side(c, 0);
    const b = side(c, 1);
    const first = grow(a, b);
    const second = grow(b, first);
    pairs.push({
      a: [...first].flatMap(cornersOf),
      b: [...second].flatMap(cornersOf),
    });
  }
  return pairs;
}
