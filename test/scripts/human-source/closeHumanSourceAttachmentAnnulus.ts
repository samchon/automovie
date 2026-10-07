import type { IHumanSourceAttachmentTopology } from "./structures/IHumanSourceAttachmentTopology.ts";

/**
 * Complete a dual-distance support neighborhood on its actual host topology.
 * At a pinched vertex, fill the remaining allowed exterior fan so the selected
 * faces have one connected vertex link. Fill complement components separated
 * from every actual host boundary. Additions are monotone and bounded by the
 * finite allowed source population; no triangle is invented or discarded.
 * The original annulus's inner side is excluded from allowed additions.
 */
export function closeHumanSourceAttachmentAnnulus(
  topology: IHumanSourceAttachmentTopology,
  initial: ReadonlySet<number>,
  allowed: ReadonlySet<number>,
): Set<number> {
  const population = new Set(initial);
  let changed = true;
  while (changed) {
    changed = false;
    for (const star of topology.vertexFaces) {
      const selected = [...star].filter((triangle) => population.has(triangle));
      if (selected.length < 2 || selected.length === star.size) continue;
      const visited = new Set<number>([selected[0]]),
        queue = [selected[0]];
      for (let at = 0; at < queue.length; at++)
        for (const neighbor of topology.faceNeighbors[queue[at]])
          if (
            star.has(neighbor) &&
            population.has(neighbor) &&
            !visited.has(neighbor)
          ) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
      if (visited.size === selected.length) continue;
      for (const triangle of star)
        if (allowed.has(triangle) && !population.has(triangle)) {
          population.add(triangle);
          changed = true;
        }
    }
  }
  const hostBoundary = new Set<number>(
    [...topology.edges.values()].filter((faces) => faces.length === 1).flat(),
  );
  const visited = new Set<number>();
  for (const seed of allowed) {
    if (population.has(seed) || visited.has(seed)) continue;
    const queue = [seed];
    visited.add(seed);
    let boundary = hostBoundary.has(seed);
    for (let at = 0; at < queue.length; at++)
      for (const neighbor of topology.faceNeighbors[queue[at]]) {
        if (
          !allowed.has(neighbor) ||
          population.has(neighbor) ||
          visited.has(neighbor)
        )
          continue;
        visited.add(neighbor);
        queue.push(neighbor);
        boundary ||= hostBoundary.has(neighbor);
      }
    if (!boundary) queue.forEach((triangle) => population.add(triangle));
  }
  return population;
}
