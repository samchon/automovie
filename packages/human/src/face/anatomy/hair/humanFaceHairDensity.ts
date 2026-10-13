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
const NEIGHBOURS: number = 4;

/**
 * Estimate nominal ribbon coverage from the current roots' four-neighbour planar density. This is a local homogeneous Poisson approximation applied to low-discrepancy scalp roots and Euclidean distances, not a proof that the resulting ribbons tile the scalp without gaps or overlap. A population with at most four roots uses domain area divided by count. Inputs are head-frame metres and square metres; positive finite widths are returned in metres, and the mesh owner separately fits actual geometry to contact.
 *
 * @evidence contracts/common.md#principled-implementation Four-neighbour distances estimate local planar density and therefore a nominal coverage ribbon width.
 * @evidence contracts/common.md#clear-and-simple-design Small populations instead use domain-area-per-root as the explicit global fallback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The Poisson neighbourhood estimate and Euclidean scalp distances do not prove seamless/nonoverlapping surface tiling or anatomical density.
 * @evidence contracts/common.md#meaningful-documentation Current root metres and square-metre area produce nominal metre widths; degenerate/nonfinite widths refuse.
 * @evidence contracts/performance.md#efficient-algorithms Pairwise root search is O(n squared), with four retained distances and constant-size sorting per comparison.
 * @evidence contracts/performance.md#reuse-equivalent-work Each root's four nearest distances are maintained incrementally instead of sorting all pair distances.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned widths scale with roots, nearest buffers are per-root temporaries and no cross-pose density cache persists.
 */
export function humanFaceHairDensity(props: {
  roots: readonly IAutoMovieVector3[];
  area: number;
}): number[] {
  if (!Number.isFinite(props.area) || props.area <= 0)
    throw new Error("A hair population needs a finite positive growth area.");
  if (props.roots.length === 0) return [];
  if (props.roots.length <= NEIGHBOURS)
    return props.roots.map((): number => Math.sqrt(props.area / props.roots.length));
  const widths: number[] = props.roots.map((root: IAutoMovieVector3): number => {
    const nearest: number[] = [];
    for (const other of props.roots) {
      if (other === root) continue;
      const distance: number = Vector3.length(Vector3.subtract(other, root));
      if (nearest.length < NEIGHBOURS) {
        nearest.push(distance);
        nearest.sort((a: number, b: number): number => a - b);
      } else if (distance < nearest[NEIGHBOURS - 1]) {
        nearest[NEIGHBOURS - 1] = distance;
        nearest.sort((a: number, b: number): number => a - b);
      }
    }
    return nearest[NEIGHBOURS - 1] * Math.sqrt(Math.PI / (NEIGHBOURS - 1));
  });
  if (!widths.every((width: number): boolean => Number.isFinite(width) && width > 0))
    throw new Error(
      "Hair roots must be distinct enough to measure their own density.",
    );
  return widths;
}
