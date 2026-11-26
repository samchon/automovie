import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSurface,
} from "@automovie/interface";

import { builtSpaceSubtree } from "./builtSpaceSubtree";
import { requireBuiltSpace } from "./requireBuiltSpace";

/**
 * Report the support patches usable in a logical space and its descendants.
 *
 * Support and walkability are separate facts: a roof deck may carry a prop
 * without being somewhere a performer may walk. Both are answered by the stable
 * surface id the lowered stage space also cites, so a caller never has to match
 * geometry to learn which patch it is holding.
 *
 * Each entry names the space that owns the patch, which may be a descendant of
 * the asked space, the patch's surface id, and whether the record lists that id
 * as walkable; entries come back in the record's surface order. Throws an
 * `Error` for an undeclared space id.
 *
 * @param environment Building record to read.
 * @param spaceId Logical space whose support patches are reported.
 * @returns One entry per patch the space or a descendant owns.
 */
export function builtEnvironmentSpaceSurfaces(
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): Array<{ space: string; surface: string; walkable: boolean }> {
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
}
