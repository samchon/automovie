import { AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES } from "./constants/AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES";

/**
 * Admit the entity-claim count before allocating palette colours or instance
 * slots. The derivation owner supplies an array length after checking duplicate
 * identities, so the count is a nonnegative safe integer by construction.
 * A count at the bound remains valid; a larger count refuses rather than
 * truncating structural evidence. This check does not certify claim identities,
 * drawable coverage or the optional slot population.
 *
 * @evidence contracts/common.md#principled-implementation Compare the entity count against the fixed palette capacity before allocating colors or slots; deriveAutoMovieSemanticMask supplies a nonnegative safe array length after duplicate-claim admission.
 * @evidence contracts/common.md#clear-and-simple-design This one guard owns capacity refusal while claim identity, drawable coverage and optional slot budgeting stay with derivation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The maximum is the declared RGB palette budget; excess refuses instead of truncating evidence, and malformed arbitrary numeric inputs are outside this narrow caller premise.
 * @evidence contracts/common.md#meaningful-documentation Docs identify inclusive capacity, early refusal and the identities/coverage facts this guard does not certify.
 * @evidence contracts/performance.md#efficient-algorithms One comparison is O(1) with no allocation on success; failure allocates only a diagnostic error.
 * @evidence contracts/performance.md#reuse-equivalent-work All entity claims share this capacity owner; no prior admission is cached across a changed claim population.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The guard retains no palette or task and opens no handle; a caller catching failure owns the error lifetime.
 */
export const assertAutoMovieSemanticMaskCapacity: (entities: number) => void = (entities: number): void => {
  if (entities > AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES)
    throw new Error(
      `semantic mask needs ${entities} entries, above the bounded maximum ${AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES}; derive one mask per building unit instead of one for the whole work`,
    );
};
