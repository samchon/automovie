/**
 * What a build-up does to an opening cut through its host.
 *
 * Produced by `autoMovieAssemblyOpeningReveal`. `first` and `last` sum the
 * unbroken runs of `wrapsOpening` layers from each face, so a wrapping layer
 * behind a non-wrapping one is not lining. `inset` is `first + last` and is
 * taken off each side of both the width and the height, so both face linings
 * are deducted on every jamb. `width` and `height` are always above zero,
 * because a lining that would consume the opening throws instead.
 *
 * @author Samchon
 */
export interface IAutoMovieAssemblyReveal {
  /** Finished clear width in metres once the lining runs reach the jamb. */
  width: number;

  /** Finished clear height in metres. */
  height: number;

  /**
   * Lining thickness `first + last` taken off each side of the opening, in
   * metres.
   */
  inset: number;

  /** Lining depth measured inward from the first face, in metres. */
  first: number;

  /** Lining depth measured inward from the last face, in metres. */
  last: number;

  /** Jamb depth left bare between the two linings, in metres. */
  bare: number;

  /** Ids of the layers that line the jamb, in stack order. */
  layers: string[];
}
