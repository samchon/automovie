import type { IHumanSourceMaterialBoundary } from "./structures/IHumanSourceMaterialBoundary.ts";

/**
 * Register an ordered anatomical guide through actual edges of the source.
 * Guide anchors keep their original identities and order. Each consecutive
 * pair is joined by the minimum-edge path in the remaining source graph, excluding
 * other registered anchors and previously occupied boundary vertices. This
 * source-authoring convention supplies a simple native contour instead of
 * assuming straight projected chords represent a curved material boundary.
 *
 * The upper/lower consecutive pair owns the lower-to-upper plica path.
 * A failed greedy route states an unsupported registration, not proof that
 * no source route exists. Nothing sorts anchors, moves a source point, welds
 * coordinate coincidences or relaxes the downstream simple-loop predicate.
 */
export function traceHumanSourceMaterialBoundary(
  indices: readonly number[],
  count: number,
  anchors: readonly number[],
  upper: number,
  lower: number,
): IHumanSourceMaterialBoundary {
  if (anchors.length < 3 || new Set(anchors).size !== anchors.length)
    throw new Error("Native material boundary needs distinct ordered anchors.");
  const adjacency = new Map(Array.from({ length: count }, (_, vertex) => [vertex, new Set<number>()]));
  for (let at = 0; at < indices.length; at += 3)
    for (let corner = 0; corner < 3; corner++) {
      const a = indices[at + corner];
      const b = indices[at + (corner + 1) % 3];
      adjacency.get(a)!.add(b);
      adjacency.get(b)!.add(a);
    }
  if (anchors.some((vertex) => !adjacency.has(vertex)))
    throw new Error("Native material boundary leaves its registered source.");
  const registered = new Set(anchors);
  const loop = [anchors[0]];
  const occupied = new Set(loop);
  let connector: number[] | undefined;
  for (let segment = 0; segment < anchors.length; segment++) {
    const start = anchors[segment];
    const end = anchors[(segment + 1) % anchors.length];
    const queue = [start];
    const parents = new Map<number, number>([[start, start]]);
    for (let at = 0; at < queue.length && !parents.has(end); at++)
      for (const neighbor of adjacency.get(queue[at])!) {
        if (parents.has(neighbor) || (neighbor !== end &&
          (registered.has(neighbor) || occupied.has(neighbor)))) continue;
        parents.set(neighbor, queue[at]);
        queue.push(neighbor);
      }
    if (!parents.has(end))
      throw new Error("Ordered material anchors have no unoccupied native edge route in this registration.");
    const path = [end];
    while (path.at(-1) !== start) path.push(parents.get(path.at(-1)!)!);
    path.reverse();
    if (start === upper && end === lower) connector = [...path].reverse();
    else if (start === lower && end === upper) connector = [...path];
    for (const vertex of path.slice(1))
      if (vertex !== loop[0]) {
        loop.push(vertex);
        occupied.add(vertex);
      }
  }
  if (connector === undefined)
    throw new Error("Material boundary has no registered consecutive upper/lower connector.");
  return { loop, connector };
}
