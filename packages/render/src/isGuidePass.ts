import type { AutoMovieGuidePass } from "@automovie/interface";

import { AUTOMOVIE_GUIDE_PASSES } from "./AUTOMOVIE_GUIDE_PASSES";

/**
 * Whether a string names a guide pass, narrowing it to `AutoMovieGuidePass`.
 *
 * The comparison is exact and case-sensitive against `AUTOMOVIE_GUIDE_PASSES`.
 *
 * @evidence contracts/common.md#principled-implementation Membership in the runtime list that mirrors the closed union is the definition of a valid pass name, and a TypeScript type predicate carries that proof to the caller's type.
 * @evidence contracts/common.md#clear-and-simple-design One predicate over the one runtime list serves every pass check in render, including `normalizeGuidePasses` and the production planner's `assertSingleGuidePass`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No name is special-cased or case-folded; the widening cast to `readonly string[]` only lets `includes` accept an unnarrowed string.
 * @evidence contracts/common.md#meaningful-documentation The doc states the narrowing, the list compared against, and that matching is exact and case-sensitive.
 * @evidence contracts/performance.md#efficient-algorithms Membership scans at most the registry's six entries and allocates no lookup structure per request; the fixed supported population bounds the comparisons.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure membership test on one string coordinates no phases, so there is no work to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The six-name list is a module constant shared by all calls, and the membership test allocates nothing per call, so retention is fixed at that list.
 */
export const isGuidePass: (value: string) => value is AutoMovieGuidePass = (
  value: string,
): value is AutoMovieGuidePass =>
  (AUTOMOVIE_GUIDE_PASSES as readonly string[]).includes(value);
