import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSurface,
} from "@automovie/interface";

import { builtSpaceSubtree } from "./builtSpaceSubtree";
import { requireBuiltSpace } from "./requireBuiltSpace";

/**
 * Report the support patches usable in a logical space and its descendants.
 *
 * Support and walkability are separate facts: a roof deck may carry a prop without being somewhere a performer may walk. Both are answered by the stable surface id the lowered stage space also cites, so a caller never has to match geometry to learn which patch it is holding.
 *
 * Each entry names the space that owns the patch, which may be a descendant of the asked space, the patch's surface id, and whether the record lists that id as walkable; entries come back in the record's surface order. Throws an `Error` for an undeclared space id.
 *
 * @param environment Building record to read.
 * @param spaceId Logical space whose support patches are reported.
 * @returns One entry per patch the space or a descendant owns.
 *
 * @evidence contracts/common.md#principled-implementation A filter over each patch's owning `space` against the subtree `builtSpaceSubtree` folds, with walkability read from the record's own `walkable` id list, so support and walkability stay two authored facts.
 * @evidence contracts/common.md#clear-and-simple-design The id lookup and the subtree fold are the shared `requireBuiltSpace` and `builtSpaceSubtree`, so this query owns only the patch filter and the walkable flag.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no space or surface and infers nothing from geometry; a patch is walkable only when the record lists its id.
 * @evidence contracts/common.md#meaningful-documentation States why support and walkability are separate, what each entry field means including a descendant owner, the order, and the thrown refusal.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the space, surface and walkable counts: one subtree walk, one set built from the walkable ids, and one filtered pass over the patches.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A synchronous read of one record per call; the walkable set is rebuilt from the record each time because the record may have changed between calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds the subtree and walkable sets only for the call; the caller owns the returned entries.
 */
export const builtEnvironmentSpaceSurfaces: (environment: IAutoMovieBuiltEnvironment, spaceId: string) => Array<{ space: string; surface: string; walkable: boolean; }> = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): Array<{ space: string; surface: string; walkable: boolean }> => {
  requireBuiltSpace(environment, spaceId);
  const included: Set<string> = builtSpaceSubtree(environment.spaces, spaceId);
  const walkable: Set<string> = new Set(environment.walkable);
  return environment.surfaces
    .filter((entry: IAutoMovieBuiltSurface): boolean =>
      included.has(entry.space),
    )
    .map(
      (
        entry: IAutoMovieBuiltSurface,
      ): { space: string; surface: string; walkable: boolean } => ({
        space: entry.space,
        surface: entry.surface.id,
        walkable: walkable.has(entry.surface.id),
      }),
    );
};
