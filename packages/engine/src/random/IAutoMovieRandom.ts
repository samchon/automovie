/** A pure counter-based random stream; made by `createAutoMovieRandom`. */
export interface IAutoMovieRandom {
  /** The stream's seed, lowercase. */
  readonly seed: string;

  /**
   * The four unsigned 32-bit words of one index's block.
   *
   * @param index A nonnegative safe integer.
   */
  block(index: number): [number, number, number, number];

  /**
   * One unsigned 32-bit integer per index: the block's first word.
   *
   * @param index A nonnegative safe integer.
   */
  uint32(index: number): number;

  /**
   * One uniform double in [0, 1) per index, with 53 random bits.
   *
   * @param index A nonnegative safe integer.
   */
  float(index: number): number;

  /**
   * An independent stream keyed by this seed and stable ids, such as a
   * subject's or a channel's name; never an ordinal.
   *
   * @param ids Stable ids, outermost first.
   */
  stream(...ids: string[]): IAutoMovieRandom;
}
