import type { IHumanSourcePlaneSectionPoint } from "./structures/IHumanSourcePlaneSectionPoint.ts";

/**
 * Cut actual source triangles by one declared plane and retain every loop.
 * As in the normal human section instrument, an exact on-plane vertex is
 * assigned to the positive side. Canonical edge direction gives one crossing
 * shared by both incident triangles without coordinate or epsilon welding.
 * Every crossing retains a host triangle/barycentric material identity.
 * Open contours and branching source incidence refuse; a source boundary
 * cannot be silently represented as a closed attachment cycle.
 */
export function readHumanSourcePlaneSections(
  positions: readonly number[],
  indices: readonly number[],
  origin: readonly number[],
  normal: readonly number[],
): IHumanSourcePlaneSectionPoint[][] {
  const point = (vertex: number): number[] =>
    positions.slice(3 * vertex, 3 * vertex + 3);
  const distance = (vertex: number): number =>
    point(vertex).reduce(
      (sum, value, axis) => sum + (value - origin[axis]) * normal[axis],
      0,
    );
  const nodes = new Map<string, IHumanSourcePlaneSectionPoint>(),
    neighbors = new Map<string, Set<string>>();
  for (let triangle = 0; triangle < indices.length / 3; triangle++) {
    const corners = indices.slice(3 * triangle, 3 * triangle + 3),
      hits: string[] = [];
    for (let corner = 0; corner < 3; corner++) {
      const next = (corner + 1) % 3,
        a = Math.min(corners[corner], corners[next]),
        b = Math.max(corners[corner], corners[next]);
      const da = distance(a),
        db = distance(b);
      if (da >= 0 === db >= 0) continue;
      const key = `${a}:${b}`;
      hits.push(key);
      if (nodes.has(key)) continue;
      const t = da / (da - db),
        weights = corners.map((vertex) =>
          vertex === a ? 1 - t : vertex === b ? t : 0,
        );
      const pa = point(a),
        pb = point(b);
      nodes.set(key, {
        edge: [a, b],
        t,
        point: pa.map((value, axis) => value + t * (pb[axis] - value)),
        seat: { triangle, weights },
      });
      neighbors.set(key, new Set());
    }
    if (hits.length === 0) continue;
    if (hits.length !== 2)
      throw new Error("Source plane section has ambiguous triangle incidence.");
    neighbors.get(hits[0])!.add(hits[1]);
    neighbors.get(hits[1])!.add(hits[0]);
  }
  if ([...neighbors.values()].some((row) => row.size !== 2))
    throw new Error("Source plane section is open or branching.");
  const visited = new Set<string>(),
    loops: IHumanSourcePlaneSectionPoint[][] = [];
  for (const first of nodes.keys()) {
    if (visited.has(first)) continue;
    const loop: IHumanSourcePlaneSectionPoint[] = [];
    let current = first,
      previous: string | undefined;
    do {
      if (visited.has(current))
        throw new Error(
          "Source plane section contours cross in native incidence.",
        );
      visited.add(current);
      loop.push(nodes.get(current)!);
      const next = [...neighbors.get(current)!].find((id) => id !== previous)!;
      previous = current;
      current = next;
    } while (current !== first);
    if (loop.length < 3)
      throw new Error("Source plane section has no closed polygonal area.");
    loops.push(loop);
  }
  return loops;
}
