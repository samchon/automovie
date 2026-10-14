import type { IAutoMovieLibraryContribution } from "@automovie/interface";

const SUPPORTED_LIBRARY_RESULTS: Readonly<{
  maps: "contexts";
  models: "models";
  spaces: "environments";
}> = { maps: "contexts", models: "models", spaces: "environments" };
const LIBRARY_BRANCHES: readonly string[] = [
  "maps", "models", "spaces", "materials", "instances", "motions", "systems",
];

/**
 * Check one schema-validated contribution's branch ownership and nonempty carrier.
 *
 * collectLibrarySourceRegistrations applies this after contribution schema
 * validation. Maps publish contexts, models publish models and spaces publish
 * environments. Other recognized branches lack a standalone result carrier.
 *
 * @evidence contracts/common.md#principled-implementation Checks recognized owner branches, refuses unsupported carriers and requires a nonempty own carrier with all foreign carriers empty; domain validity is admitted by later library validators.
 * @evidence contracts/common.md#clear-and-simple-design Keeps branch-to-carrier policy separate from source evaluation and model/environment validation. It returns diagnostic messages for the collector to attribute to the selected source or artifact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Three semantic carrier mappings are the shipped contribution protocol, not consumer-specific exceptions; unsupported branches refuse explicitly and omitted contexts mean an empty optional carrier.
 * @evidence contracts/common.md#meaningful-documentation Names the schema-validated premise, caller, supported branches, nonempty requirement and separate domain validators; malformed arbitrary objects are not this typed function's ingress contract.
 * @evidence contracts/performance.md#efficient-algorithms Scans seven branch names and three carrier lengths, with constant-size messages and temporary containers; it does not traverse or copy carrier populations, so cost is independent of their element counts.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Only constant-size protocol and length checks are performed; cross-call memoization would require tracking mutable carrier lengths and add state without avoiding substantial work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary carrier references last for this synchronous call, and the caller owns returned messages; no contribution, handle or background task is retained.
 */
export function autoMovieLibraryContributionDiagnostics(
  branch: string,
  contribution: IAutoMovieLibraryContribution,
): string[] {
  const recognized: string | undefined = LIBRARY_BRANCHES.find(
    (candidate: string): boolean => candidate === branch,
  );
  if (recognized === undefined)
    return [`Library source branch "${branch}" is not a recognized design owner.`];
  const expected: "contexts" | "models" | "environments" | undefined =
    recognized === "maps" ? SUPPORTED_LIBRARY_RESULTS.maps
      : recognized === "models" ? SUPPORTED_LIBRARY_RESULTS.models
      : recognized === "spaces" ? SUPPORTED_LIBRARY_RESULTS.spaces : undefined;
  if (expected === undefined)
    return [`Library source branch "${branch}" has no supported standalone result carrier. Keep its completed source in authoring until the builder exposes that semantic result instead of nesting it inside another owner's environment or model.`];
  const populations: {
    contexts: NonNullable<IAutoMovieLibraryContribution["contexts"]>;
    environments: IAutoMovieLibraryContribution["environments"];
    models: IAutoMovieLibraryContribution["models"];
  } = {
    contexts: contribution.contexts ?? [],
    environments: contribution.environments,
    models: contribution.models,
  };
  const diagnostics: string[] = [];
  if (populations[expected].length === 0)
    diagnostics.push(`Library source branch "${branch}" returned no ${expected}. A completed owner must publish at least one result in its branch carrier.`);
  for (const [name, population] of Object.entries(populations))
    if (name !== expected && population.length !== 0)
      diagnostics.push(`Library source branch "${branch}" returned ${population.length} ${name}, but that payload belongs to the ${name === "contexts" ? "maps" : name === "environments" ? "spaces" : "models"} branch rather than this owner.`);
  return diagnostics;
}
