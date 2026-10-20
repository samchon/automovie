/**
 * Manifest-owned imported model detail level, ordered hero, near, far.
 *
 * @evidence contracts/common.md#principled-implementation Closed levels identify the existing manifest detail slots.
 * @evidence contracts/common.md#clear-and-simple-design One choice names levels independently of file identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The level does not infer geometry or a distance threshold.
 * @evidence contracts/common.md#meaningful-documentation States manifest ownership and ordering.
 */
export type AutoMovieImportedModelLodLevel = "hero" | "near" | "far";
