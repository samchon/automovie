/**
 * Indexed Philox4x32-10 draws under one 64-bit seed, without a mutable cursor.
 *
 * createAutoMovieRandom admits sixteen hexadecimal seed digits and each draw admits a nonnegative safe integer index. Repeating a seed/index repeats its value regardless of call order. These deterministic values are for production variation, not secrets.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines seed encoding, random-access indices, output ranges and child-stream identity.
 * @evidence contracts/development/design.md#principled-representation The seed is hexadecimal text; indices are dimensionless integers and block words are unsigned 32-bit numbers. Construction and draw admission enforce ranges that number/string cannot express.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns the stream implemented by createAutoMovieRandom and consumed by seeded placement and procedural producers; block, integer and double access share one counter convention.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Child streams use stable text ids rather than population order; reproducibility does not imply collision-free hashing or cryptographic independence.
 */
export interface IAutoMovieRandom {
  /** Sixteen lowercase hexadecimal digits identifying the stream's 64-bit key. */
  readonly seed: string;

  /**
   * Return a fresh mutable tuple of four unsigned 32-bit words. Index must be an integer in 0..Number.MAX_SAFE_INTEGER or the call throws; no stream state advances.
   */
  block(index: number): [number, number, number, number];

  /**
   * Return the first block word, an integer in 0..4294967295, with the same index admission and stateless semantics as block.
   */
  uint32(index: number): number;

  /**
   * Return a dimensionless double in [0,1), combining 27 bits from the first block word and 26 from the second; invalid indices throw.
   */
  float(index: number): number;

  /**
   * Return a new stream derived by hashing this lowercase seed and ordered UTF-8 ids with separators. Use stable subject/channel ids, outermost first; empty text or an empty argument list is accepted and still hashed. No input array or mutable cursor is retained.
   */
  stream(...ids: string[]): IAutoMovieRandom;
}
