import { IAutoMovieBuiltEnvironment, IAutoMovieBuiltSpace } from "@automovie/interface";

/**
 * Name what is staged in a logical space and its descendants.
 *
 * This is the join that keeps the visible model and the semantic partition from
 * drifting apart: a room can be asked what is visibly inside it without a
 * second traversal that could answer differently.
 *
 * Two spellings come back, in this order, because two things are staged. An
 * element contributes exactly the `node` id {@link lowerBuiltEnvironment} emits
 * for it, `<environment>/<element>`. A population contributes
 * `instance-set:<set>`, the one owner id the render inventory and the semantic
 * mask already address a whole population by, because lowering emits it as one
 * compact set and not as `count` nodes. Naming the population rather than its
 * members is the difference between an answer and an unbounded expansion: one
 * authored field of roof slate is 2,392 members, and a query a reviewer calls
 * in a loop may not hand back 2,392 strings to say "there is slate here".
 * {@link builtEnvironmentSpacePopulations} hands back the sets themselves for a
 * caller that wants the placement law. Regeneration names a procedural member
 * `instance:<set>:slot:<six-digit-index>` and an explicit member
 * `instance:<set>:<transform-id>`, exactly as the production materializer does.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `builtEnvironmentSpaceNodes` names the staged set nodes and populations standing in a logical space and its descendants. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `builtEnvironmentSpaceNodes` collects staged node ids from a logical space and every child space within its building boundary.
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group `builtEnvironmentSpaceNodes` answers for a compact population under the space that owns it, so compression does not remove the population from the question "what stands here".
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-compression-individuality `builtEnvironmentSpaceNodes` keeps a compressed population addressable by one stable owner id without expanding or omitting its members.
 * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality `builtEnvironmentSpaceNodes` addresses a compressed population by its stable owner id rather than dropping it from the staged listing.
 */
export const builtEnvironmentSpaceNodes = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): string[] => {
  requireSpace(environment, spaceId);
  const included = descendantSpaces(environment.spaces, spaceId);
  return [
    ...environment.elements
      .filter(
        (element) =>
          element.model !== null &&
          element.space !== null &&
          included.has(element.space),
      )
      .map((element) => `${environment.id}/${element.id}`),
    ...(environment.populations ?? [])
      .filter((population) => included.has(population.space))
      .map((population) => `instance-set:${population.set.id}`),
  ];
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
