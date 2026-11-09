/**
 * Domain family owning a soft-body solve or deterministic planting derivation.
 *
 * @evidence contracts/development/design.md#principled-representation The analysis discriminator distinguishes time-integrated deformable state from static seeded plant growth, each with its own validator and measured result.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two supported families share outcome reporting without flattening their unrelated solver and branching representations.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Planting derivation is not a dynamics solve, and selecting a family does not make an unsupported request produce a state.
 * @evidence contracts/development/common.md#meaningful-documentation Defines soft-body versus planting analysis ownership and computational distinction.
 */
export type AutoMovieSoftAnalysisKind = "soft-body" | "planting";
