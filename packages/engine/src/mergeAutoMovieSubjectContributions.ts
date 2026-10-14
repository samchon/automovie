import { IAutoMovieSubjectContribution } from "./IAutoMovieSubjectContribution";

/**
 * Every contribution field, typed as a complete record so the compiler refuses
 * a field of {@link IAutoMovieSubjectContribution} that the merge would leave
 * out, and one it does not declare.
 */
const CONTRIBUTION_FIELDS: Record<keyof IAutoMovieSubjectContribution, true> = {
  models: true,
  set: true,
  spaces: true,
  builtEnvironments: true,
  designReferences: true,
  designEvidence: true,
  designLineages: true,
  fluidDomains: true,
  softBodyDomains: true,
  softFurnishings: true,
  plantingDomains: true,
  plantingClusters: true,
  plantingInstallations: true,
  serviceNetworks: true,
  waterFeatures: true,
  props: true,
  actors: true,
  clips: true,
  formationMotions: true,
  formationSlotMotions: true,
  effectCues: true,
  landmarks: true,
  surfaces: true,
  routes: true,
  effectRecipes: true,
  effectZones: true,
  instanceSets: true,
};

/** The fields of {@link CONTRIBUTION_FIELDS}, in the order they are merged. */
const CONTRIBUTION_KEYS: readonly (keyof IAutoMovieSubjectContribution)[] =
  Object.keys(CONTRIBUTION_FIELDS) as (keyof IAutoMovieSubjectContribution)[];

/**
 * Merge what several subjects contribute into one contribution.
 *
 * Order is the order given, so a group that lists its members in a stable order
 * merges to the same bytes every run. Nothing is deduplicated: two subjects
 * claiming the same id is a defect for the builder's own uniqueness checks to
 * report, and silently collapsing it here would hide the collision from the
 * gate that owns it.
 *
 * Arrays are freshly allocated; their entries retain the input objects by
 * reference. Absent or empty fields remain absent, including an empty input
 * list. The caller must validate duplicate identities after this merge.
 *
 * @param contributions Ordered contributions from authored subjects.
 * @returns One concatenated contribution with fresh nonempty field arrays.
 *
 * @evidence contracts/common.md#principled-implementation Concatenates each declared contribution field in subject order, preserving duplicate entries for the builder's admission checks. A complete keyof record makes additions to the contribution schema require a merge key, and the local indexed push cast represents that same-key element invariant.
 * @evidence contracts/common.md#clear-and-simple-design One field-complete loop replaces per-field concatenations while retaining the contribution record consumed by subject groups and source construction; it adds no deduplication policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject identity is treated specially; duplicate claims survive to their owning validator and no empty field is populated with invented content.
 * @evidence contracts/common.md#meaningful-documentation States order, duplicate preservation, fresh-array and borrowed-entry ownership, omitted empty fields and post-merge validation duty.
 * @evidence contracts/performance.md#efficient-algorithms Visits the fixed field set once per contribution and appends each present entry once, O(C*F+N) time and O(N) output references for C contributions, F schema fields and N entries; no intermediate flattened copies are built.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This merge consumes one ordered list and does not coordinate requests; borrowing entry references preserves identity without caching a mutable contribution's result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only the returned field arrays retain input entries, bounded by their total count; the caller owns those arrays and this function retains no state or handle.
 */
export const mergeAutoMovieSubjectContributions: (
  contributions: readonly IAutoMovieSubjectContribution[],
) => IAutoMovieSubjectContribution = (
  contributions: readonly IAutoMovieSubjectContribution[],
): IAutoMovieSubjectContribution => {
  const merged: {
    -readonly [K in keyof IAutoMovieSubjectContribution]: Array<
      NonNullable<IAutoMovieSubjectContribution[K]>[number]
    >;
  } = {};
  for (const contribution of contributions)
    for (const key of CONTRIBUTION_KEYS) {
      const values: IAutoMovieSubjectContribution[keyof IAutoMovieSubjectContribution] =
        contribution[key];
      if (values === undefined || values.length === 0) continue;
      const bucket: (typeof merged)[keyof typeof merged] = (merged[key] ??= []);
      for (const value of values) bucket.push(value as never);
    }
  return merged;
};
