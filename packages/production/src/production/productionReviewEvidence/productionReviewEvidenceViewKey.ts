import { AutoMovieGuidePass } from "@automovie/interface";

/**
 * Encode one already-resolved integer frame index and exact render pass as a membership key; clock validity and pass admission belong to the caller.
 *
 * @evidence contracts/common.md#principled-implementation A numeric frame spelling, colon delimiter and closed pass union make distinct admitted index/pass pairs distinguishable in the held-view Set.
 * @evidence contracts/common.md#clear-and-simple-design One key constructor is shared by held and owed pair checks so the two sides do not disagree about sampling identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No authored seconds, alternate pass or tolerated offset is substituted into the key; unsupported numeric inputs are not independently validated here.
 * @evidence contracts/common.md#meaningful-documentation Documents frame-index rather than seconds input and the required admitted clock/pass premise.
 * @evidence contracts/performance.md#efficient-algorithms Formats one numeric scalar and bounded pass name into one short string; no frame list or media payload is traversed.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This scalar mapping coordinates no requests or phases and keeps no cache; the caller's Set provides membership reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only the returned key string transfers to the caller; no handle, task or retained internal state is acquired.
 */
export const productionReviewEvidenceViewKey: (index: number, pass: AutoMovieGuidePass) => string = (index: number, pass: AutoMovieGuidePass): string => `${index}:${pass}`;
