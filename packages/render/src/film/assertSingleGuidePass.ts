import type { AutoMovieGuidePass } from "@automovie/interface";

import { isGuidePass } from "../guidePasses";

/**
 * Return the one structural pass a guide-pass deliverable declares, or throw.
 *
 * Every entry must be a known guide pass other than `beauty`, and after
 * folding repeats exactly one distinct pass must remain, so one deliverable's
 * failure can never hide inside another's output. `normalizeGuidePasses` is
 * the different, wider rule of the sequence planners, which keeps any number
 * of passes and admits `beauty`.
 *
 * @evidence contracts/common.md#principled-implementation Membership is decided by `isGuidePass` over the runtime list that mirrors the `AutoMovieGuidePass` union, minus `beauty`, and repeats fold into a list of distinct passes whose length must be one.
 * @evidence contracts/common.md#clear-and-simple-design The function returns the single pass the planner keys a chunk by instead of a one-element list, and it reuses the shared pass list rather than restating it; it stays apart from `normalizeGuidePasses` because the two admission rules differ.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No pass or deliverable is special-cased; the runtime membership check covers values that reached the typed parameter from untyped JSON, and each refusal throws rather than picking a pass.
 * @evidence contracts/common.md#meaningful-documentation The doc states what is returned, both refusals, the reason a deliverable owns one pass, and how this rule differs from `normalizeGuidePasses`.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the P entries with two scans of at most six known passes each, O(P) time, and a distinct list of at most five entries; every entry must be read to prove there is one distinct pass.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The planner calls it once for the legacy default and once per declared guide deliverable on one-element lists, so there is no repeated work worth sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The distinct list of at most five passes is local and dropped on return, leaving only the returned pass literal; no handle or task is involved.
 */
export const assertSingleGuidePass: (
  passes: readonly Exclude<AutoMovieGuidePass, "beauty">[],
) => Exclude<AutoMovieGuidePass, "beauty"> = (
  passes: readonly Exclude<AutoMovieGuidePass, "beauty">[],
): Exclude<AutoMovieGuidePass, "beauty"> => {
  const distinct: Exclude<AutoMovieGuidePass, "beauty">[] = [];
  for (const pass of passes) {
    if (isGuidePass(pass) === false || (pass as string) === "beauty")
      throw new Error(`Guide-pass render cannot use "${pass}".`);
    if (distinct.includes(pass) === false) distinct.push(pass);
  }
  if (distinct.length !== 1)
    throw new Error(
      `A guide-pass deliverable requires exactly one declared pass, but received ${distinct.length}. Declare separate deliverables when the production contract gains per-pass ownership.`,
    );
  return distinct[0]!;
};
