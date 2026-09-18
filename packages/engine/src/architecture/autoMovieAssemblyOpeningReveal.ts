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
 * @evidence requirements/interior/surface-assemblies.md#interior-hidden-layers-cut-faces `autoMovieAssemblyOpeningReveal` reports what a build-up finishes an opening at. This ensures opening and section cuts expose the actual hidden build-up.
 * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `autoMovieAssemblyOpeningReveal` resolves which material layer and depth finish each side of an assembly opening.
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
