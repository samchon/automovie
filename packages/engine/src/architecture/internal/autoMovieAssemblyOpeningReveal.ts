import type {
  IAutoMovieAssemblyOpeningReveal,
  IAutoMovieAssemblyReveal,
  IAutoMovieResolvedLayer,
} from "@automovie/interface";

import { positive } from "../../geometry/positive";

/**
 * Report what a build-up finishes an opening at.
 *
 * An opening is cut at a structural size and used at a finished one. Every
 * layer that continues around the jamb lines both sides of the opening, so the
 * clear width loses twice the wrapping thickness and the clear height the same;
 * the depth each lining reaches is the run of wrapping layers measured inward
 * from that face, and whatever the two linings do not reach is bare jamb.
 *
 * A lining that consumes the opening is refused rather than reported as a
 * negative clear dimension. Testing "not above zero" also refuses a computed
 * `NaN`. The resolved assembly is assumed to carry finite nonnegative
 * thicknesses, including zero-thickness membranes; arbitrary forged
 * negative-infinite layers are outside that premise.
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
 */
export function autoMovieAssemblyOpeningReveal(
  props: IAutoMovieAssemblyOpeningReveal.IProps,
): IAutoMovieAssemblyReveal {
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
}
