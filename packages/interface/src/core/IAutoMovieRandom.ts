/**
 * Indexed Philox4x32-10 draws under one 64-bit seed, without a mutable cursor.
 *
 * CreateAutoMovieRandom admits sixteen hexadecimal seed digits and each draw
 * admits a nonnegative safe integer index. Repeating a seed/index repeats its
 * value regardless of call order. These deterministic values are for production
 * variation, not secrets.
 */
export interface IAutoMovieRandom {
  /** Sixteen lowercase hexadecimal digits identifying the stream's 64-bit key. */
  readonly seed: string;

  /**
   * Return a fresh mutable tuple of four unsigned 32-bit words. Index must be
   * an integer in 0..Number.MAX_SAFE_INTEGER or the call throws; no stream
   * state advances.
   */
  block(index: number): [number, number, number, number];

  /**
   * Return the first block word, an integer in 0..4294967295, with the same
   * index admission and stateless semantics as block.
   */
  uint32(index: number): number;

  /**
   * Return a dimensionless double in [0,1), combining 27 bits from the first
   * block word and 26 from the second; invalid indices throw.
   */
  float(index: number): number;

  /**
   * Return a new stream derived by hashing this lowercase seed and ordered
   * UTF-8 ids with separators. Use stable subject/channel ids, outermost first;
   * empty text or an empty argument list is accepted and still hashed. No input
   * array or mutable cursor is retained.
   */
  stream(...ids: string[]): IAutoMovieRandom;
}
