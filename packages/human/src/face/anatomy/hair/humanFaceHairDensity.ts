import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * How many neighbours the local density is read from. The k-nearest-neighbour
 * estimator of Loftsgaarden & Quesenberry (1965) reads the density at a sample
 * from the disc that reaches its k-th neighbour; its unbiased form divides by
 * k - 1, which needs k >= 3 for a finite variance, and every further neighbour
 * widens the disc a root's own neighbourhood is read from. Four is that
 * smallest stable choice, not a style control: it is the estimator's own
 * numerical parameter, like an iteration budget.
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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Derives generated ribbon coverage from the population instead of an authored width.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Reads the local root density and returns the scalp side each root covers.
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
