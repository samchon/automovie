import { IAutoMovieBuiltEnvironment } from "@automovie/interface";

import { requireBuiltSpace } from "./requireBuiltSpace";

/**
 * Name the building unit that owns a logical space.
 *
 * A work holds several independently placed building units, so "which building is this room in" is a real question rather than a constant. A building owns its root space and every space below it, so the owner is found by walking `parent` links up from the space to the first ancestor, the space itself included, that some building names as its root. Validation requires every building root to have no parent and every space to have exactly one owner, so in a validated record that ancestor is the top of the chain and the answer is unique; an unvalidated record whose building roots nest answers the nearest one, and a parent cycle ends the walk without an owner.
 *
 * Throws for an undeclared space id and for a space no building unit owns, the same refusal validation makes for an unowned space.
 *
 * @evidence contracts/common.md#principled-implementation An ancestor walk over a space id index, stopping at the first space a building names as its root; ownership is subtree membership, and since validation makes building roots parentless and ownership unique, the nearest such ancestor is the one owner, while a visited set ends a cyclic chain.
 * @evidence contracts/common.md#clear-and-simple-design Answers from the space's own ancestor chain instead of expanding every building's subtree, and refuses ids through the shared `requireBuiltSpace`, so this query owns only the ownership rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no building or space; an unowned space is refused rather than defaulted to the first building, and nested or cyclic records, which validation refuses, are documented rather than repaired.
 * @evidence contracts/common.md#meaningful-documentation States what a building owns, how the owner is found, the validation premises that make it unique, the nearest-root reading and cycle effect on an unvalidated record, and both throws.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the space and building counts to build the two id indexes, then linear in the space's depth for the walk, replacing a per-building fixed-point subtree expansion that grew with building count times space count times depth.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answers one space per call over the caller's mutable record and keeps no index between calls; a caller labelling many spaces pays the index build per call.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The id indexes and visited set live for one call and are dropped on return; the caller owns the returned id string.
 */
export const builtEnvironmentBuildingOfSpace: (environment: IAutoMovieBuiltEnvironment, spaceId: string) => string = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): string => {
  requireBuiltSpace(environment, spaceId);
  const roots: Map<string, string> = new Map();
  for (const building of environment.buildings)
    if (!roots.has(building.space)) roots.set(building.space, building.id);
  const parents: Map<string, string | null> = new Map();
  for (const space of environment.spaces)
    if (!parents.has(space.id)) parents.set(space.id, space.parent);
  const visited: Set<string> = new Set();
  let current: string | null | undefined = spaceId;
  while (current !== null && current !== undefined && !visited.has(current)) {
    const owner: string | undefined = roots.get(current);
    if (owner !== undefined) return owner;
    visited.add(current);
    current = parents.get(current);
  }
  throw new Error(
    `built environment "${environment.id}" has no building unit owning logical space "${spaceId}"`,
  );
};
