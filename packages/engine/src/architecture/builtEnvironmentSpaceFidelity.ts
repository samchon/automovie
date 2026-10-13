import { IAutoMovieBuiltEnvironment } from "@automovie/interface";

import { builtSpaceStatesVolume } from "./builtSpaceStatesVolume";
import { builtSpaceSubtree } from "./builtSpaceSubtree";
import { requireBuiltSpace } from "./requireBuiltSpace";

/**
 * What a logical space's own volume claims to be, folded over its descendants.
 *
 * `"unstated"` is a subtree in which no space states a volume, `"faceted"` is a
 * subtree where at least one stated volume declares itself an approximation of
 * a curved region, and `"exact"` is everything else. Folding matters because a
 * storey holding one vaulted hall is a storey whose measured volume is a facet
 * count: the approximation does not stop at the space that declared it. A
 * space that states no volume does not count toward `"faceted"` even when it
 * sets `fidelity`.
 *
 * This engine has no curved boundary primitive, so a curved region cannot be
 * stated exactly by any spelling here. That limit is reported rather than
 * smoothed over: a caller that wants an exact dome learns it is holding flats.
 *
 * What fills the region never enters this answer, so an element, a population,
 * or an empty room all leave it alone. It folds because
 * {@link builtEnvironmentContainsPoint} folds: a caller who asked whether a prop
 * stands in a storey got an answer over that whole subtree, and this is how
 * exact that answer was. Throws for an undeclared space id.
 *
 * @evidence contracts/common.md#principled-implementation A three-valued fold over the subtree's spaces that state a volume, taking `"faceted"` as absorbing, so the answer is the least exact claim any contributing volume makes.
 * @evidence contracts/common.md#clear-and-simple-design Reads the subtree from the same walk the containment query uses and volume presence from `builtSpaceStatesVolume`, so the fidelity reported is the fidelity of exactly the volumes containment tests.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no space or production; the absence of a curved primitive is reported as `"faceted"` rather than approximated as exact.
 * @evidence contracts/common.md#meaningful-documentation States the three answers, that only volume-stating spaces count, why the answer folds over descendants, the curved-region limit, that contents never enter, and the throw.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the space count for the walk and the scan, with the scan stopping at the first faceted volume.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The fold is recomputed from the subtree on every call, since a space's stated volume or fidelity may change in the caller's record and no cached verdict could detect that.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The subtree set is dropped on return; the answer is a string literal.
 * @author Samchon
 */
export const builtEnvironmentSpaceFidelity = (
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
