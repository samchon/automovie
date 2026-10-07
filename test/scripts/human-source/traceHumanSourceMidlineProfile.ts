/**
 * Trace the outer midline profile between two midline vertices: the shortest
 * path (by neutral edge length) over base-mesh edges that join two midline
 * vertices. The outer surface is the direct way along the midline; interior
 * midline vertices (nasal or oral cavity) are reached only by a detour, so they
 * do not lie on the path. The result runs from `from` to `to` inclusive; no
 * path refuses.
 */
export function traceHumanSourceMidlineProfile(
  positions: readonly number[],
  faces: readonly number[][],
  midline: readonly number[],
  from: number,
  to: number,
): number[] {
  const on = new Set(midline);
  const next = new Map<number, Set<number>>();
  for (const face of faces)
    for (let i = 0; i < face.length; i++) {
      const a = face[i];
      const b = face[(i + 1) % face.length];
      if (!on.has(a) || !on.has(b)) continue;
      if (!next.has(a)) next.set(a, new Set());
      if (!next.has(b)) next.set(b, new Set());
      next.get(a)!.add(b);
      next.get(b)!.add(a);
    }
  const length = (a: number, b: number): number =>
    Math.hypot(
      positions[3 * a] - positions[3 * b],
      positions[3 * a + 1] - positions[3 * b + 1],
      positions[3 * a + 2] - positions[3 * b + 2],
    );
  const distance = new Map<number, number>([[from, 0]]);
  const previous = new Map<number, number>();
  const open = new Set<number>([from]);
  while (open.size > 0) {
    let current = -1;
    for (const v of open)
      if (
        current < 0 ||
        distance.get(v)! < distance.get(current)! ||
        (distance.get(v) === distance.get(current) && v < current)
      )
        current = v;
    open.delete(current);
    if (current === to) break;
    for (const n of next.get(current) ?? []) {
      const d = distance.get(current)! + length(current, n);
      if (d < (distance.get(n) ?? Infinity)) {
        distance.set(n, d);
        previous.set(n, current);
        open.add(n);
      }
    }
  }
  if (!distance.has(to))
    throw new Error(`No midline profile joins vertices ${from} and ${to}.`);
  const path = [to];
  while (path[path.length - 1] !== from)
    path.push(previous.get(path[path.length - 1])!);
  return path.reverse();
}
