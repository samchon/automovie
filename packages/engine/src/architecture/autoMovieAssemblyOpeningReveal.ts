import { IAutoMovieAssemblyReveal } from "./IAutoMovieAssemblyReveal";
import { IAutoMovieResolvedAssembly } from "./IAutoMovieResolvedAssembly";
import { IAutoMovieResolvedLayer } from "./IAutoMovieResolvedLayer";

/**
 * Report what a build-up finishes an opening at.
 *
 * An opening is cut at a structural size and used at a finished one. Every
 * layer that continues around the jamb lines both sides of the opening, so the
 * clear width loses twice the wrapping thickness and the clear height the same;
 * the depth each lining reaches is the run of wrapping layers measured inward
 * from that face, and whatever the two linings do not reach is bare jamb.
 *
 * A lining that would consume the opening is refused rather than reported as a
 * negative dimension: a door 0.6 m wide lined by 0.4 m on each side is not a
 * narrow door, it is a wall. The refusal is written as "not above zero" rather
 * than "at or below zero", so a build-up carrying a non-finite thickness is
 * refused here too instead of returning a `NaN` width that every later
 * comparison would read as acceptable.
 *
 * Only wrapping layers reachable from a face line the jamb. A layer that claims
 * to wrap from behind one that stops there cannot turn the corner, which is why
 * validation refuses it; measuring the runs rather than the flags means it also
 * cannot narrow an opening here if one ever reaches this function unvalidated.
 * When every layer wraps, the whole build-up is the first face's run and the
 * last face's run is empty.
 *
 * Throws when either structural dimension is not a finite number above zero,
 * and when the lining leaves no positive clear width or height.
 *
 * @evidence contracts/common.md#principled-implementation Measures the maximal runs of wrapping layers from each face, because only a contiguous run from a face can turn the jamb corner, and subtracts twice their summed thickness from each structural dimension; the trailing run is capped so a fully wrapping build-up is not counted twice.
 * @evidence contracts/common.md#clear-and-simple-design One pass from each end of the resolved layer list and a single subtraction, with the result shape owned by `IAutoMovieAssemblyReveal`; layer resolution stays with `resolveAutoMovieMaterialAssembly`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no assembly or material; an unreachable wrapping flag is ignored by measuring runs rather than special-cased, and a consumed or non-finite opening is refused rather than clamped to zero.
 * @evidence contracts/common.md#meaningful-documentation States the structural-versus-finished reading, the doubling of the inset, how each lining depth is measured, the bare jamb, the refusal and why it catches `NaN`, the unvalidated-flag case, the fully wrapping case, the metre units, and every throw.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the layer count: one scan from each end, each run summed in layer order, and one list of lining ids.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure computation over one resolved assembly and one opening that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned reveal, whose layer list is bounded by the assembly's layer count.
 */
export const autoMovieAssemblyOpeningReveal = (props: {
  resolved: IAutoMovieResolvedAssembly;
  /** Structural opening width in metres before lining, strictly above zero. */
  width: number;
  /** Structural opening height in metres before lining, strictly above zero. */
  height: number;
}): IAutoMovieAssemblyReveal => {
  positive(props.width, "opening width");
  positive(props.height, "opening height");
  const layers: readonly IAutoMovieResolvedLayer[] = props.resolved.layers;
  let lead: number = 0;
  let first: number = 0;
  while (lead < layers.length && layers[lead]!.wrapsOpening) {
    first += layers[lead]!.thickness;
    lead += 1;
  }
  let tail: number = 0;
  while (
    tail < layers.length - lead &&
    layers[layers.length - 1 - tail]!.wrapsOpening
  )
    tail += 1;
  let last: number = 0;
  for (let index: number = layers.length - tail; index < layers.length; ++index)
    last += layers[index]!.thickness;
  const inset: number = first + last;
  const width: number = props.width - 2 * inset;
  const height: number = props.height - 2 * inset;
  if (!(width > 0) || !(height > 0))
    throw new Error(
      `material assembly "${props.resolved.id}" lines ${inset} m on each side, which leaves no usable opening in ${props.width} x ${props.height} m`,
    );
  return {
    width,
    height,
    inset,
    first,
    last,
    bare: props.resolved.total - first - last,
    layers: [
      ...layers.slice(0, lead),
      ...layers.slice(layers.length - tail),
    ].map((layer: IAutoMovieResolvedLayer): string => layer.id),
  };
};

/** Refuse a dimension that is not a finite number above zero. */
const positive = (value: number, label: string): void => {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`${label} must be a finite number > 0`);
};
