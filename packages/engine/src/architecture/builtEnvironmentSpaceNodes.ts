import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
} from "@automovie/interface";

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
 * Transform-only elements are left out because they draw nothing. Throws for an
 * undeclared space id.
 *
 * @evidence contracts/common.md#principled-implementation Lists `<environment>/<element>` for every drawn element assigned to the subtree, then `instance-set:<set>` for every subtree population, the same spellings lowering and the render inventory emit.
 * @evidence contracts/common.md#clear-and-simple-design Defect: private `descendantSpaces` and `requireSpace` copies; elements and populations are listed in a fixed order from one subtree set rather than two traversals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A population is named once by its set id instead of being expanded to members, and a transform-only element is omitted because it draws nothing; no element or set id is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the two id spellings and their order, why a population is named rather than expanded with the measured slate example, how a member id is regenerated, the omitted elements, and the refusal.
 * @evidence contracts/performance.md#cost-and-resources An `O(S D)` subtree pass, then linear filters over elements and populations; output size is drawn elements plus populations, never population members, and no list is cached between the drawing schedule's per-space calls.
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
