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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents index refusal, unsigned words, fresh tuple ownership and absence of a cursor.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation The signature specifies indexed block output; createAutoMovieRandom owns Philox computation.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Block generation has no body in this interface; engine owns its decomposition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This signature executes no seed or index branches; engine owns their admission.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The contract chooses no implementation algorithm; the Philox owner accounts for draw cost.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The method declaration cannot cache blocks; stateless repeated-index semantics are specified above.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature allocates nothing; the contract requires an owned tuple and no cursor.
   */
  block(index: number): [number, number, number, number];

  /**
   * Return the first block word, an integer in 0..4294967295, with the same index admission and stateless semantics as block.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents first-word selection, unsigned range and shared index admission.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation The declaration fixes the integer view of a block; engine owns its calculation.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The interface has no method body to decompose.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No fallback or special-case value executes in a signature.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The producer, not this declaration, chooses how to compute the requested block word.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The interface owns no cache; repeated-index equivalence follows the stream contract.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature owns no runtime allocation or task; the result is a scalar.
   */
  uint32(index: number): number;

  /**
   * Return a dimensionless double in [0,1), combining 27 bits from the first block word and 26 from the second; invalid indices throw.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the double range, 53-bit composition and invalid-index behavior.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation The signature specifies double semantics; createAutoMovieRandom owns the bit arithmetic.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure No implementation body or helper decomposition is present here.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The declaration executes no rounding, clamping or input branches.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Sampling cost belongs to the concrete stream implementation, not the method declaration.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work No retained draw exists in the interface; identical seed/index determines the result.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A scalar result is specified, with no resource acquisition in this declaration.
   */
  float(index: number): number;

  /**
   * Return a new stream derived by hashing this lowercase seed and ordered UTF-8 ids with separators. Use stable subject/channel ids, outermost first; empty text or an empty argument list is accepted and still hashed. No input array or mutable cursor is retained.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents child seed derivation, id ordering, accepted empty inputs and ownership.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation The method contract names derivation semantics; deriveAutoMovieSeed owns the hash algorithm.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The declaration has no implementation layers; engine owns factory and hash composition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No seed fallback or id-specific branch executes in this signature.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The implementation accounts for UTF-8/hash work and allocation by input text length.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration owns no child-stream cache; identity is derived from the ordered ids.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The result is a new stream by contract, while this signature itself owns no runtime state.
   */
  stream(...ids: string[]): IAutoMovieRandom;
}
