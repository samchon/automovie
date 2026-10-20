/**
 * Domain family owning a soft-body solve or deterministic planting derivation.
 *
 * @evidence contracts/common.md#principled-implementation The analysis discriminator distinguishes time-integrated deformable state from static seeded plant growth, each with its own validator and measured result.
 * @evidence contracts/common.md#clear-and-simple-design Two supported families share outcome reporting without flattening their unrelated solver and branching representations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Planting derivation is not a dynamics solve, and selecting a family does not make an unsupported request produce a state.
 * @evidence contracts/common.md#meaningful-documentation Defines soft-body versus planting analysis ownership and computational distinction.
 */
export type AutoMovieSoftAnalysisKind = "soft-body" | "planting";
