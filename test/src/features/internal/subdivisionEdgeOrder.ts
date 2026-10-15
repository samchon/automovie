import { type IAutoMovieSubdivisionCage } from "@automovie/engine";

/**
 * Undirected cage edges in order of first appearance walking faces and
 * corners, each as `[a, b]` in the direction of its first corner; the order the
 * subdivider documents for edge points.
 */
export function subdivisionEdgeOrder(
  cage: IAutoMovieSubdivisionCage,
): [number, number][] {
  const seen: Set<string> = new Set<string>();
  const edges: [number, number][] = [];
  for (const face of cage.faces)
    face.forEach((a: number, k: number): void => {
      const b: number = face[(k + 1) % face.length]!;
      const key: string = `${Math.min(a, b)}-${Math.max(a, b)}`;
      if (seen.has(key)) return;
      seen.add(key);
      edges.push([a, b]);
    });
  return edges;
}
