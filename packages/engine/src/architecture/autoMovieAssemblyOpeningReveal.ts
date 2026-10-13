import { IAutoMovieAssemblyReveal } from "./IAutoMovieAssemblyReveal";
import { IAutoMovieResolvedAssembly } from "./IAutoMovieResolvedAssembly";

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
 *
 * Throws when either structural dimension is not a finite number above zero,
 * and when the lining leaves no positive clear width or height.
 *
 * @evidence contracts/common.md#principled-implementation Counts the maximal leading and trailing runs of `wrapsOpening` layers, clamps the trailing run so an all-wrapping build-up is not counted twice, and takes twice their summed thickness off both dimensions; the model assumes every wrapping layer's full thickness stands on both jambs.
 * @evidence contracts/common.md#clear-and-simple-design Two private run counters and one positivity guard serve this single function; layer resolution stays in `resolveAutoMovieMaterialAssembly`, and the reveal comes back as a plain record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The `!(width > 0)` form is deliberate so a non-finite thickness is refused instead of returning `NaN`, and measuring runs rather than flags keeps an unvalidated wrap behind a stopping layer from narrowing the opening.
 * @evidence contracts/common.md#meaningful-documentation States the structural-versus-finished distinction, the twice-inset rule, how lining depth and bare jamb are derived, the refusal of a consumed opening and its `NaN` reasoning, and the metre unit and positivity of both inputs.
 * @evidence contracts/performance.md#cost-and-resources Linear in the build-up's layer count: one forward run, one backward run and two slices summed, with no sort, search or cache, and only the two slices and the returned record allocated.
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
  const layers = props.resolved.layers;
  const lead = leadingRun(layers, (layer) => layer.wrapsOpening);
  const tail = Math.min(
    trailingRun(layers, (layer) => layer.wrapsOpening),
    layers.length - lead,
  );
  const lining = [
    ...layers.slice(0, lead),
    ...layers.slice(layers.length - tail),
  ];
  const first = layers
    .slice(0, lead)
    .reduce((sum, layer) => sum + layer.thickness, 0);
  const last = layers
    .slice(layers.length - tail)
    .reduce((sum, layer) => sum + layer.thickness, 0);
  const inset = first + last;
  const width = props.width - 2 * inset;
  const height = props.height - 2 * inset;
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
    layers: lining.map((layer) => layer.id),
  };
};

const leadingRun = <T>(
  items: readonly T[],
  match: (item: T) => boolean,
): number => {
  let count = 0;
  while (count < items.length && match(items[count]!)) count += 1;
  return count;
};

const trailingRun = <T>(
  items: readonly T[],
  match: (item: T) => boolean,
): number => {
  let count = 0;
  while (count < items.length && match(items[items.length - 1 - count]!))
    count += 1;
  return count;
};

const positive = (value: number, label: string): void => {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`${label} must be a finite number > 0`);
};
