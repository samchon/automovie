import { IAutoMovieSubjectContribution } from "./IAutoMovieSubjectContribution";

/**
 * Merge what several subjects contribute into one contribution.
 *
 * Order is the order given, so a group that lists its members in a stable order
 * merges to the same bytes every run. Nothing is deduplicated: two subjects
 * claiming the same id is a defect for the builder's own uniqueness checks to
 * report, and silently collapsing it here would hide the collision from the
 * gate that owns it.
 *
 * @evidence requirements/product/capability-and-content.md#product-project-owned-content Preserves every project-owned subject artifact in authored order without deduplicating identities or choosing replacement content.
 * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Combines only explicitly present contribution arrays and leaves collision decisions visible to the builder that owns validation.
 */
export const mergeAutoMovieSubjectContributions = (
  contributions: readonly IAutoMovieSubjectContribution[],
): IAutoMovieSubjectContribution => {
  const merged: {
    -readonly [K in keyof IAutoMovieSubjectContribution]: Array<
      NonNullable<IAutoMovieSubjectContribution[K]>[number]
    >;
  } = {};
  for (const contribution of contributions)
    for (const key of CONTRIBUTION_KEYS) {
      const values = contribution[key];
      if (values === undefined || values.length === 0) continue;
      const bucket = (merged[key] ??= []);
      for (const value of values) bucket.push(value as never);
    }
  return merged;
};
