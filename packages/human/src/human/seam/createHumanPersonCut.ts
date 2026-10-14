import type { IAutoMovieHumanPersonSeam } from "../structures/IAutoMovieHumanPersonSeam";
import { clipHumanPersonTriangles } from "./clipHumanPersonTriangles";

/**
 * Capture one strict crossing per undirected source edge of finite metre margins. Positive samples are removed and zero retained; original source numbering survives and intersections append in traversal order. Indices must be complete admitted triangles addressing this margin population. The shared cutter owns retained topology. Returned arrays are owned but mutable, so subsequent region consumers require their contents to remain unchanged.
 *
 * The crossing fraction uses a/2 divided by (a/2-b/2) to avoid opposite-sign subtraction overflow. Nonfinite fractions, underflow or fractions rounded to an endpoint refuse instead of creating an indistinguishable inserted vertex. This sampled affine boundary is neither an analytic angular contour nor new registered physical lineage.
 *
 * @evidence contracts/common.md#principled-implementation Actual sampled signs and undirected source edges define a single shared strict intersection with finite interior fraction.
 * @evidence contracts/common.md#clear-and-simple-design This constructor owns copied margins and crossing arithmetic while one shared cutter determines retained triangle topology for every region consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact zero retains the source endpoint, unsafe crossing arithmetic refuses, and captured mutable arrays do not claim runtime freeze, analytic contour or invented physical identity.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre margins, admitted index premises, half-scaled fraction arithmetic and unchanged captured-array lifetime.
 * @evidence contracts/performance.md#efficient-algorithms Margin admission/copy and triangle edge traversal are linear; an edge set shares crossings and the cutter adds linear retained-topology traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work One captured cut supplies the same intersection fractions/identities to later region attribute gathers rather than recomputing boundary topology per region.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result owns margin/crossing/index arrays bounded by source rows/edges; temporary edge state is local with no evaluator, asset or render resource retained.
 */
export function createHumanPersonCut(
  indices: readonly number[],
  margins: readonly number[],
): NonNullable<IAutoMovieHumanPersonSeam["cut"]> {
  if (margins.some((value: number): boolean => !Number.isFinite(value)))
    throw new Error("Person clipping needs finite scalar samples.");
  const cut: NonNullable<IAutoMovieHumanPersonSeam["cut"]> = {
    margins: [...margins],
    intersections: [],
    indices: [],
  };
  const edges: Set<string> = new Set<string>();
  for (let offset: number = 0; offset < indices.length; offset += 3)
    for (let corner: number = 0; corner < 3; corner++) {
      const a: number = Math.min(
        indices[offset + corner],
        indices[offset + ((corner + 1) % 3)],
      );
      const b: number = Math.max(
        indices[offset + corner],
        indices[offset + ((corner + 1) % 3)],
      );
      if (
        margins[a] <= 0 === margins[b] <= 0 ||
        margins[a] === 0 ||
        margins[b] === 0
      )
        continue;
      const key: string = `${a}/${b}`;
      if (edges.has(key)) continue;
      edges.add(key);
      const t: number = margins[a] / 2 / (margins[a] / 2 - margins[b] / 2);
      if (!Number.isFinite(t) || !(t > 0 && t < 1))
        throw new Error("Person clipping exceeded finite edge arithmetic.");
      cut.intersections.push({ a, b, t });
    }
  cut.indices = clipHumanPersonTriangles(indices, cut).map(
    (one: ReturnType<typeof clipHumanPersonTriangles>[number]): number =>
      one.vertex,
  );
  return cut;
}
