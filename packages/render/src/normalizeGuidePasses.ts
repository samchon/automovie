import type { AutoMovieGuidePass } from "@automovie/interface";

import { isGuidePass } from "./isGuidePass";

/**
 * Validate a requested pass list and fold repeats, keeping each pass at its first position.
 *
 * Throws `unknown guide pass "<name>"` for a name outside `AUTOMOVIE_GUIDE_PASSES`. `planGuidePassOutputs` and the chunked sequence planner both normalize through it, so a request means the same pass order everywhere. The production planner's `assertSingleGuidePass` is a narrower rule and does not use it.
 *
 * @evidence contracts/development/implementation.md#principled-implementation A seen-set with first-occurrence wins is order-preserving deduplication, and membership is `isGuidePass`, so the result is the request's distinct valid passes in request order.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop does validation and folding together, and the function is the single normalization the sequence planners share so their pass orders cannot drift.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pass is special-cased or silently dropped; an unknown name throws instead of being skipped.
 * @evidence contracts/development/common.md#meaningful-documentation The doc states the folding rule, the exact refusal message, which callers depend on it, and how it differs from the production planner's rule.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pass over the P requested names with constant-time set and list membership, O(P) time and at most six retained passes.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call validates its supplied request independently and returns first-occurrence order; the shared constant registry carries the only invariant data between calls.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The seen-set is local and released on return; the returned list, owned by the caller, holds at most six passes.
 */
export const normalizeGuidePasses: (
  passes: readonly string[],
) => AutoMovieGuidePass[] = (
  passes: readonly string[],
): AutoMovieGuidePass[] => {
  const seen: Set<AutoMovieGuidePass> = new Set();
  const normalized: AutoMovieGuidePass[] = [];
  for (const pass of passes) {
    if (isGuidePass(pass) === false)
      throw new Error(`unknown guide pass "${pass}"`);
    if (seen.has(pass)) continue;
    seen.add(pass);
    normalized.push(pass);
  }
  return normalized;
};
