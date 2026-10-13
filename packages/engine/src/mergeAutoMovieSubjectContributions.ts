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
