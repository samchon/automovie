import { IAutoMovieBuiltEnvironment, IAutoMovieBuiltSpace } from "@automovie/interface";
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
 * answer was. **Nothing inside the engine asks it yet.** The take-off and the
 * drafter read the declaration directly instead, because a gap has to name the
 * spaces that carry it rather than a verdict over a subtree, so the folded form
 * is here for the authoring surface — where the same question is asked before a
 * placement rather than after a measurement — and it needs an entry on the
 * sandbox's engine export list before a source module can reach it.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `builtEnvironmentSpaceFidelity` returns what a logical space's own volume claims to be, folded over its descendants. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `builtEnvironmentSpaceFidelity` performs space-fidelity fold when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
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
