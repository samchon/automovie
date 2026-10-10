import type { IAutoMovieHumanPersonSeam } from "../structures/IAutoMovieHumanPersonSeam";
import { clipHumanPersonTriangles } from "./clipHumanPersonTriangles";

/**
 * Freeze one crossing per undirected edge of a vertex-sampled scalar cut.
 * The seam supplies finite metre samples; positive is removed, zero retained.
 * Original source numbering survives, intersections append in source edge
 * traversal order, and clipHumanPersonTriangles owns the retained topology.
 * This constructor owns finite arithmetic admission and copies the samples.
 * Underflow or a fraction rounding to an endpoint refuses rather than creating
 * an indistinguishable vertex. Region consumers reuse this frozen result.
 */
export function createHumanPersonCut(
  indices: readonly number[],
  margins: readonly number[],
): NonNullable<IAutoMovieHumanPersonSeam["cut"]> {
  if (margins.some((value) => !Number.isFinite(value)))
    throw new Error("Person clipping needs finite scalar samples.");
  const cut: NonNullable<IAutoMovieHumanPersonSeam["cut"]> = {
    margins: [...margins],
    intersections: [],
    indices: [],
  };
  const edges = new Set<string>();
  for (let offset = 0; offset < indices.length; offset += 3)
    for (let corner = 0; corner < 3; corner++) {
      const a = Math.min(
        indices[offset + corner],
        indices[offset + ((corner + 1) % 3)],
      );
      const b = Math.max(
        indices[offset + corner],
        indices[offset + ((corner + 1) % 3)],
      );
      if (
        margins[a] <= 0 === margins[b] <= 0 ||
        margins[a] === 0 ||
        margins[b] === 0
      )
        continue;
      const key = `${a}/${b}`;
      if (edges.has(key)) continue;
      edges.add(key);
      const t = margins[a] / 2 / (margins[a] / 2 - margins[b] / 2);
      if (!Number.isFinite(t) || !(t > 0 && t < 1))
        throw new Error("Person clipping exceeded finite edge arithmetic.");
      cut.intersections.push({ a, b, t });
    }
  cut.indices = clipHumanPersonTriangles(indices, cut).map((one) => one.vertex);
  return cut;
}
