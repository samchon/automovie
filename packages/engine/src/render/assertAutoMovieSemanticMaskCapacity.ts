import { AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES } from "./constants/AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES";

/**
 * Admit the entity-claim count before allocating palette colours or instance
 * slots. The derivation owner supplies an array length after checking duplicate
 * identities, so the count is a nonnegative safe integer by construction.
 * A count at the bound remains valid; a larger count refuses rather than
 * truncating structural evidence. This check does not certify claim identities,
 * drawable coverage or the optional slot population.
 */
export const assertAutoMovieSemanticMaskCapacity = (entities: number): void => {
  if (entities > AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES)
    throw new Error(
      `semantic mask needs ${entities} entries, above the bounded maximum ${AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES}; derive one mask per building unit instead of one for the whole work`,
    );
};
