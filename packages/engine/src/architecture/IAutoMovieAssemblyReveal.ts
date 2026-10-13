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
 * @evidence contracts/common.md#principled-implementation Linings are the leading and trailing runs of consecutive wrapping layers; clear width and height subtract twice `inset`, and `bare` is the total build-up minus both linings.
 * @evidence contracts/common.md#clear-and-simple-design Carries the per-face lining depths and the lining layer ids beside the clear size, so a caller can draw each lining's return without recomputing the runs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `inset = first + last` deducts both face linings from every jamb although they are reported as separate depths from opposite faces; the record carries that producer model as is and has no per-face clear width.
 * @evidence contracts/common.md#meaningful-documentation States the producer, which layers count as lining, how `inset` is derived and applied, the positivity guarantee, and the unit of every field.
 * @evidenceExclude contracts/performance.md#cost-and-resources Six numbers and an id list derived from two linear runs over the layers; no reveal is cached per wall, and it holds no reference to the resolved assembly.
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
