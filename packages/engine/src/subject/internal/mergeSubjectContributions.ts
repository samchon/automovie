import type { IAutoMovieSubjectContribution } from "@automovie/interface";

/*
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
 * Parameter contributions: Ordered contributions from authored subjects.
 * Returns: One concatenated contribution with fresh nonempty field arrays.
 */
export function mergeSubjectContributions(
  contributions: readonly IAutoMovieSubjectContribution[],
): IAutoMovieSubjectContribution {
  const merged: IMerged = {};
  for (const contribution of contributions)
    for (const key of CONTRIBUTION_KEYS) {
      const values: IAutoMovieSubjectContribution[keyof IAutoMovieSubjectContribution] =
        contribution[key];
      if (values === undefined || values.length === 0) continue;
      append(merged, key, values);
    }
  return merged;
}

/*
 * Every contribution field, typed as a complete record so the compiler refuses
 * a field of IAutoMovieSubjectContribution that the merge would leave
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

/*
 * The fields of CONTRIBUTION_FIELDS, in the order they are merged.
 */
const CONTRIBUTION_KEYS: readonly (keyof IAutoMovieSubjectContribution)[] =
  Object.keys(CONTRIBUTION_FIELDS) as (keyof IAutoMovieSubjectContribution)[];

/*
 * The merged contribution under construction, each field a fresh array.
 */
type IMerged = {
  [K in keyof IAutoMovieSubjectContribution]?: NonNullable<
    IAutoMovieSubjectContribution[K]
  >[number][];
};

/*
 * Append one contribution field's entries to the merged field of the same key,
 * creating that field's array on its first entries.
 */
function append<K extends keyof IAutoMovieSubjectContribution>(
  merged: IMerged,
  key: K,
  values: readonly NonNullable<IAutoMovieSubjectContribution[K]>[number][],
): void {
  const bucket: NonNullable<IMerged[K]> = (merged[key] ??= []);
  bucket.push(...values);
}
