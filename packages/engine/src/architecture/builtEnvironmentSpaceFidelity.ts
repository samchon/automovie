import { IAutoMovieBuiltEnvironment } from "@automovie/interface";

import { builtSpaceStatesVolume } from "./builtSpaceStatesVolume";
import { builtSpaceSubtree } from "./builtSpaceSubtree";
import { requireBuiltSpace } from "./requireBuiltSpace";

/**
 * What a logical space's own volume claims to be, folded over its descendants.
 *
 * `"unstated"` is a subtree in which no space states a volume, `"faceted"` is a subtree where at least one stated volume declares itself an approximation of a curved region, and `"exact"` is everything else. Folding matters because a storey holding one vaulted hall is a storey whose measured volume is a facet count: the approximation does not stop at the space that declared it. A space that states no volume does not count toward `"faceted"` even when it sets `fidelity`.
 *
 * The result folds authored metadata; it neither detects curvature nor certifies geometric or numerical accuracy. An omitted fidelity defaults to the exact claim, even if the author used facets to approximate a curve. Authors must declare that approximation as `"faceted"`.
 *
 * Contents do not enter the fold. The subtree matches {@link builtEnvironmentContainsPoint}, so callers can read the contributing volumes' authored fidelity beside containment without treating it as a numerical error bound. Throws for an undeclared space id.
 *
 * @evidence contracts/common.md#principled-implementation A three-valued fold over the subtree's spaces that state a volume, taking `"faceted"` as absorbing, so the answer is the least exact claim any contributing volume makes.
 * @evidence contracts/common.md#clear-and-simple-design Reads the subtree from the same walk the containment query uses and volume presence from `builtSpaceStatesVolume`, so the fidelity reported is the fidelity of exactly the volumes containment tests.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no space or production and invents no curvature detector; it reports declared fidelity with the documented exact default, rather than silently certifying the represented region.
 * @evidence contracts/common.md#meaningful-documentation States the three answers, that only volume-stating spaces count, why the answer folds over descendants, the curved-region limit, that contents never enter, and the throw.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the space count for the walk and the scan, with the scan stopping at the first faceted volume.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The fold is recomputed from the subtree on every call, since a space's stated volume or fidelity may change in the caller's record and no cached verdict could detect that.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The subtree set is dropped on return; the answer is a string literal.
 */
export const builtEnvironmentSpaceFidelity: (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
) => "exact" | "faceted" | "unstated" = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): "exact" | "faceted" | "unstated" => {
  requireBuiltSpace(environment, spaceId);
  const included: Set<string> = builtSpaceSubtree(environment.spaces, spaceId);
  let stated: boolean = false;
  for (const space of environment.spaces) {
    if (!included.has(space.id) || !builtSpaceStatesVolume(space)) continue;
    if (space.fidelity === "faceted") return "faceted";
    stated = true;
  }
  return stated ? "exact" : "unstated";
};
