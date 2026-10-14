import type { IAutoMovieDesignLineage } from "@automovie/interface";
import { renovationLineage } from "./renovationLineage";

/**
 * Apply the caller's mutation once to a fresh renovation lineage.
 *
 * Each call constructs its own fixture before invoking the edit. Consumers may change one field, coordinate several fields for a positive control, or permute several arrays; this helper neither limits the edit nor validates its result.
 *
 * @param edit Mutation invoked once with the new fixture.
 * @returns The edited fixture, without cloning it again or validating it.
 *
 * @evidence contracts/testing.md#behavioral-verification Applies the supplied mutation to renovationLineage and returns that same edited record. Lineage consumers use it for targeted defects, coordinated positive edits, selection and digest permutations; this helper makes no admission or digest assertion itself.
 * @evidence contracts/testing.md#independent-expectations The supplied edit is applied once to a fresh hand-authored renovation lineage; expected refusal paths remain literal data at each consumer rather than being produced by this helper.
 * @evidence contracts/testing.md#distinguishing-cases Consumer edits isolate missing identities, malformed references, cycles, conflicting change keys and stale artifact metadata without mutating the next case's fixture.
 * @evidence contracts/testing.md#execution-ownership This portable internal leaf is reached through lineageFixtures and the existing unit consumers; it registers no case and loads no provider, external asset, process, browser or GPU.
 */
export const brokenLineage: (edit: (draft: IAutoMovieDesignLineage) => void) => IAutoMovieDesignLineage = (
  edit: (draft: IAutoMovieDesignLineage) => void,
): IAutoMovieDesignLineage => {
  const lineage: IAutoMovieDesignLineage = renovationLineage();
  edit(lineage);
  return lineage;
};
