import { IAutoMovieBuiltEnvironment } from "@automovie/interface";

import { builtSpaceStatesVolume } from "./builtSpaceStatesVolume";
import { builtSpaceSubtree } from "./builtSpaceSubtree";
import { requireBuiltSpace } from "./requireBuiltSpace";

/*
 * What a logical space's own volume claims to be, folded over its descendants.
 *
 * `"unstated"` is a subtree in which no space states a volume, `"faceted"` is a
 * subtree where at least one stated volume declares itself an approximation of
 * a curved region, and `"exact"` is everything else. Folding matters because a
 * storey holding one vaulted hall is a storey whose measured volume is a facet
 * count: the approximation does not stop at the space that declared it. A space
 * that states no volume does not count toward `"faceted"` even when it sets
 * `fidelity`.
 *
 * The result folds authored metadata; it neither detects curvature nor
 * certifies geometric or numerical accuracy. An omitted fidelity defaults to
 * the exact claim, even if the author used facets to approximate a curve.
 * Authors must declare that approximation as `"faceted"`.
 *
 * Contents do not enter the fold. The subtree matches
 * builtEnvironmentContainsPoint, so callers can read the contributing
 * volumes' authored fidelity beside containment without treating it as a
 * numerical error bound. Throws for an undeclared space id.
 */
export function builtEnvironmentSpaceFidelity(
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): "exact" | "faceted" | "unstated" {
  requireBuiltSpace(environment, spaceId);
  const included: Set<string> = builtSpaceSubtree(environment.spaces, spaceId);
  let stated: boolean = false;
  for (const space of environment.spaces) {
    if (!included.has(space.id) || !builtSpaceStatesVolume(space)) continue;
    if (space.fidelity === "faceted") return "faceted";
    stated = true;
  }
  return stated ? "exact" : "unstated";
}
