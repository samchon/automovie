import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * How many neighbours the local density is read from. The k-nearest-neighbour
 * construction of Loftsgaarden & Quesenberry (1964, NASA-CR-59360) reads a
 * neighbourhood out to its k-th observation. Here a local homogeneous planar
 * Poisson approximation derives the intensity estimate (k - 1) / (pi D_k^2),
 * whose variance is intensity squared / (k - 2). Three is the smallest finite
 * variance choice; four is a fixed estimation convention that halves that
 * variance while widening the sampled neighbourhood. It is not an anatomical
 * value or a style control, and low-discrepancy scalp roots only approximate
 * this stochastic model.
 */
const NEIGHBOURS = 4;

/**
 * The scalp each generated root stands for, as the ribbon width that covers it.
 *
 * A rendered ribbon is not one fibre. It is the whole population of one root's
 * neighbourhood, so the width that covers the head without gaps and without
 * overlap is the side of the scalp area that root is responsible for. That area
 * is the reciprocal of the local root density, which the population measures on
 * itself: with `d` the distance to a root's k-th neighbour, the density is
 * (k - 1) / (pi d^2) and the side of its area is `d sqrt(pi / (k - 1))`. Roots
 * thinned by a hairline or a root region therefore widen their ribbons exactly
 * as far as their thinning, with no separate coverage number to tune.
 *
 * A population too small to have k neighbours has no local density; it falls
 * back to the growth domain's own measured area over the population, which is
 * the same quantity read globally. The estimate is local, so the ribbon of a
 * root at a thinning boundary is wider than one in the middle of the crown.
 * Distances are the current shape's, so a larger head widens its ribbons.
 *
 * Search is the direct pairwise one within the admitted thousand-root layer.
 * This states coverage, not the fibre's own diameter, and nothing here keeps a
 * ribbon outside the skin; `buildHumanFaceHairMesh` owns that.
 *
 * @evidence contracts/common.md#principled-implementation For roots that are a
 *   spatial point process of intensity l per unit area, pi * D_k^2 * l is gamma
 *   distributed with shape k, so (k - 1) / (pi * D_k^2) is an unbiased estimate
 *   of l when k > 1 and has finite variance when k > 2; the area a root stands
 *   for is the reciprocal, pi * D_k^2 / (k - 1), and its side is D_k * sqrt(pi /
 *   (k - 1)) as computed. Its intensity variance is l^2 / (k - 2), so four
 *   neighbours halve the variance of the smallest finite choice, three. The
 *   premises are approximate here: the roots are a low-discrepancy sample on a
 *   curved surface, the distance is the Euclidean chord and not the geodesic,
 *   and a root at a thinning boundary has neighbours on one side only, so its
 *   width is larger, as the comment states. A population of four or fewer roots
 *   falls back to the growth area over the count.
 * @evidence contracts/common.md#clear-and-simple-design One pairwise scan per
 *   root with a fixed neighbour count that is the estimator's own parameter, and
 *   no spatial index, since the layer is admitted at a thousand roots.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special
 *   case for a subject or style; width follows only the roots' own spacing and
 *   the domain area.
 * @evidence contracts/common.md#meaningful-documentation The comment states
 *   the estimator, its degrees of freedom, the fallback, the boundary bias and
 *   that it states coverage and not fibre diameter.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The
 *   function computes a value and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function
 *   defines no channel and reads the hairstyle document's fields without varying
 *   a form; the document type owns their meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function returns
 *   one width per root and emits no primitive; the mesher owns the emitted rows.
 * @evidence contracts/modeling.md#spatial-conventions Roots are the current
 *   shape's positions in metres and the area is square metres; the result is a
 *   width in metres. Nothing is converted.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds
 *   no surface and joins no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function
 *   owns no part, group or joint and displays nothing; the builder that owns the
 *   assembled hair is where the result is observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The width is derived
 *   from the population's own spacing and carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits,
 *   bounds or combines no anatomical quantity; assertHumanFaceHair owns
 *   admission of the hairstyle document.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input
 *   shapes a human form through this function; it reads quantities the hairstyle
 *   document already names and admits.
 */
export function humanFaceHairDensity(props: {
  roots: readonly IAutoMovieVector3[];
  area: number;
}): number[] {
  if (!Number.isFinite(props.area) || props.area <= 0)
    throw new Error("A hair population needs a finite positive growth area.");
  if (props.roots.length === 0) return [];
  if (props.roots.length <= NEIGHBOURS)
    return props.roots.map(() => Math.sqrt(props.area / props.roots.length));
  const widths = props.roots.map((root) => {
    const nearest: number[] = [];
    for (const other of props.roots) {
      if (other === root) continue;
      const distance = Vector3.length(Vector3.subtract(other, root));
      if (nearest.length < NEIGHBOURS) {
        nearest.push(distance);
        nearest.sort((a, b) => a - b);
      } else if (distance < nearest[NEIGHBOURS - 1]) {
        nearest[NEIGHBOURS - 1] = distance;
        nearest.sort((a, b) => a - b);
      }
    }
    return nearest[NEIGHBOURS - 1] * Math.sqrt(Math.PI / (NEIGHBOURS - 1));
  });
  if (!widths.every((width) => Number.isFinite(width) && width > 0))
    throw new Error(
      "Hair roots must be distinct enough to measure their own density.",
    );
  return widths;
}
