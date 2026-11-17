/**
 * One exact normalized dyadic boundary coordinate and its binary64 numeric view.
 *
 * AutoMovieCanonicalBoundary64.phase constructs the exact affine combination of admitted finite binary64 endpoints. The key is d:<odd hexadecimal numerator>p<binary exponent>, with d:0p0 for zero. local, compare and inverse admit the key and require its rounded value to agree with value. Authority identity is deliberately separate and must be supplied by the caller. Two distinct exact phases may have the same numeric view and must remain distinct.
 *
 * @evidence contracts/development/design.md#principled-representation Exact dyadic identity survives one nearest-even conversion to the numeric view used for evaluation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Phase generation, inversion, ordering and bicubic edge registries share this pair instead of duplicating operation-specific records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Rounded coordinate equality cannot weld exact phases or establish shared boundary authority.
 * @evidence contracts/development/common.md#meaningful-documentation States encoding, normalized units, validation ownership, signed-zero endpoint behavior and the distinction between exact identity and rounded view.
 */
export type IAutoMovieCanonicalBoundaryPhase64 = {
  /** Finite normalized coordinate in [0,1], rounded once to nearest with ties to even; exact endpoints retain their original signed zero. */
  value: number;
  /** Canonical exact dyadic encoding admitted by the boundary arithmetic; preserve it across restrictions instead of reconstructing it from value. */
  key: string;
};
