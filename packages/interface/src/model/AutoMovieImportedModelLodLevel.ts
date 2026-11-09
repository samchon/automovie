/**
 * Manifest-owned imported model detail level, ordered hero, near, far.
 *
 * @evidence contracts/development/design.md#principled-representation Closed levels identify the existing manifest detail slots.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One choice names levels independently of file identity.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The level does not infer geometry or a distance threshold.
 * @evidence contracts/development/common.md#meaningful-documentation States manifest ownership and ordering.
 */
export type AutoMovieImportedModelLodLevel = "hero" | "near" | "far";
