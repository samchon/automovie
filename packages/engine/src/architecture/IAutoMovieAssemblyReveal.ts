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
 * @evidence contracts/common.md#principled-implementation Measures each lining as the unbroken run of `wrapsOpening` layers from one face, so only layers that can physically turn the jamb count, and deducts `first + last` from each side of both structural dimensions, refusing a result that is not above zero.
 * @evidence contracts/common.md#clear-and-simple-design Returns the finished size with the depths it was derived from and the lining layer ids, so a caller can dimension the opening, draw the lining returns and report the bare jamb from one call.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Deducting both face linings on every jamb is the producer's pinned rule and is conservative where the two linings sit at different depths; it is stated rather than adjusted per fixture, and a consuming lining throws instead of returning a clamped size.
 * @evidence contracts/common.md#meaningful-documentation States the producer, that `first` and `last` sum unbroken wrapping runs from each face, that `inset` is their sum taken off each side of width and height, that `width` and `height` stay above zero because consumption throws, and the metre unit of every length.
 * @evidenceExclude contracts/performance.md#efficient-algorithms No code; finding both runs and summing them is linear in the layer count inside `autoMovieAssemblyOpeningReveal`, which answers that cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each reveal answers one structural opening size per call, and nothing shares a reveal between openings cut through the same build-up, since the size is part of the input.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds six numbers and a new array of layer id strings that the caller owns once the producer returns.
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
