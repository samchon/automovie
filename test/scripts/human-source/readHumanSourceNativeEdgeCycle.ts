import type { IHumanSourceNativeEdgeCycleInput } from "./structures/IHumanSourceNativeEdgeCycleInput.ts";

/**
 * Resolve an authored closed station row through actual native mesh edges.
 * Sorted-neighbour breadth-first traversal preserves the existing displacement
 * registration's minimum edge-count convention. Other anchors, interior
 * witnesses and occupied paths cannot become intermediate vertices. This
 * supplies an explicit source convention, not an anatomical measurement or a
 * geometric shortest curve; the caller owns its population and qualification.
 *
 * @author Samchon
 */
export function readHumanSourceNativeEdgeCycle(
  input: IHumanSourceNativeEdgeCycleInput,
): number[] {
  const { topology, stations, forbidden, occupied } = input;
  const cycle = [stations[0]];
  occupied.add(stations[0]);
  for (let segment = 0; segment < stations.length; segment++) {
    const start = stations[segment],
      end = stations[(segment + 1) % stations.length];
    const queue = [start],
      previous = new Map<number, number>([[start, start]]);
    for (let at = 0; at < queue.length && !previous.has(end); at++)
      for (const near of [...topology.vertexNeighbors[queue[at]]].sort(
        (a, b) => a - b,
      )) {
        if (
          previous.has(near) ||
          (near !== end && (forbidden.has(near) || occupied.has(near)))
        )
          continue;
        previous.set(near, queue[at]);
        queue.push(near);
      }
    if (!previous.has(end))
      throw new Error("Source station row has no simple uncrossed native edge path.");
    const path = [end];
    while (path.at(-1) !== start) path.push(previous.get(path.at(-1)!)!);
    path.reverse();
    for (let at = 1; at < path.length; at++)
      if (path[at] !== cycle[0]) {
        cycle.push(path[at]);
        occupied.add(path[at]);
      }
  }
  return cycle;
}
