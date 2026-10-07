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
 *
 * @evidence contracts/common.md#principled-implementation A crossing solves (1-t)ma+t mb=0; halved samples avoid overflow in their difference, and strict finite interior admission rejects unrepresentable crossings.
 * @evidence contracts/common.md#clear-and-simple-design Edge registration is separate from the shared polygon walk and has one owner for fraction arithmetic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tolerance replaces an unrepresentable crossing with a fitted endpoint.
 * @evidence contracts/common.md#meaningful-documentation States scalar sign, source identity, ownership and numerical refusal.
 * @evidence contracts/modeling.md#emitted-geometry One intersection exists per crossing source edge, independent of material chart count.
 * @evidence contracts/modeling.md#shared-boundaries Each incident triangle consumes the same undirected-edge crossing and fraction.
 * @evidence contracts/modeling.md#spatial-conventions Margins share the caller's metre unit; fractions are dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no authored channel.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembled seam owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Defines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits no anatomical input.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no user input.
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
