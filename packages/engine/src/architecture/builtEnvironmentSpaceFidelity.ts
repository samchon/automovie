import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
} from "@automovie/interface";

import { builtSpaceStatesVolume } from "./builtSpaceStatesVolume";

/**
 * What a logical space's own volume claims to be, folded over its descendants.
 *
 * `"unstated"` is a subtree that bounds nothing at all, `"faceted"` is a
 * subtree where at least one stated volume declares itself an approximation of
 * a curved region, and `"exact"` is everything else. Folding matters because a
 * storey holding one vaulted hall is a storey whose measured volume is a facet
 * count: the approximation does not stop at the space that declared it.
 *
 * This engine has no curved boundary primitive, so a curved region cannot be
 * stated exactly by any spelling here. That limit is reported rather than
 * smoothed over: a caller that wants an exact dome learns it is holding flats.
 *
 * What fills the region never enters this answer. The question is what a space
 * says its own volume is, so an element, a population, or an empty room all
 * leave it alone; the blindness to populations that
 * {@link builtEnvironmentSpaceContentBounds} carried was a blindness about
 * contents, and this fold never looked at contents to begin with.
 *
 * It folds because {@link builtEnvironmentContainsPoint} folds: the caller who
 * asked whether a prop stands in a storey, or whether a fluid lattice stays in
 * a basin, got an answer over that whole subtree and this is how exact that
 * answer was. The drawing schedule reports it for every space, and project
 * source can ask it before a placement. The take-off and the drafter read each
 * space's declaration directly instead, because a gap has to name the spaces
 * that carry it rather than a verdict over a subtree.
 *
 * Throws for an undeclared space id.
 *
 * @evidence contracts/common.md#principled-implementation Folds the subtree's volume-stating spaces: none gives `unstated`, any `faceted` declaration gives `faceted`, otherwise `exact`; only the declared `fidelity` flag is read, never geometry or contents.
 * @evidence contracts/common.md#clear-and-simple-design Defect: private copies of `descendantSpaces` and `requireSpace` again; the closed three-value answer is the whole interface because the only question is whether any stated volume is an approximation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No curved primitive is pretended; a curved region reads `faceted` exactly when its author declared it so, and an undeclared id throws rather than answering `unstated`.
 * @evidence contracts/common.md#meaningful-documentation States the three answers, why the fold spans descendants, that contents never affect it, the missing curved primitive, which consumers read this fold and which read the declaration, and the refusal.
 * @evidence contracts/performance.md#cost-and-resources One `O(S D)` descendant pass and one filter with a constant-time volume test per space; the drawing schedule calls it per space, rebuilding each subtree, and no result is cached.
 * @author Samchon
 */
export const builtEnvironmentSpaceFidelity = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): "exact" | "faceted" | "unstated" => {
  requireSpace(environment, spaceId);
  const included = descendantSpaces(environment.spaces, spaceId);
  const stated = environment.spaces.filter(
    (space) => included.has(space.id) && builtSpaceStatesVolume(space),
  );
  if (stated.length === 0) return "unstated";
  return stated.some((space) => space.fidelity === "faceted")
    ? "faceted"
    : "exact";
};

const requireSpace = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): void => {
  if (!environment.spaces.some((space) => space.id === spaceId))
    throw new Error(
      `built environment "${environment.id}" has no logical space "${spaceId}"`,
    );
};

const descendantSpaces = (
  spaces: readonly IAutoMovieBuiltSpace[],
  root: string,
): Set<string> => {
  const included = new Set([root]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const space of spaces)
      if (
        space.parent !== null &&
        included.has(space.parent) &&
        !included.has(space.id)
      ) {
        included.add(space.id);
        changed = true;
      }
  }
  return included;
};
