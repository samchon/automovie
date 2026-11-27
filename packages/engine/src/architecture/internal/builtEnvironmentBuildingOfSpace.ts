import { IAutoMovieBuiltEnvironment } from "@automovie/interface";

import { requireBuiltSpace } from "./requireBuiltSpace";

/*
 * Name the building unit that owns a logical space.
 *
 * A work holds several independently placed building units, so "which building
 * is this room in" is a real question rather than a constant. A building owns
 * its root space and every space below it, so the owner is found by walking
 * `parent` links up from the space to the first ancestor, the space itself
 * included, that some building names as its root. Validation requires every
 * building root to have no parent and every space to have exactly one owner, so
 * in a validated record that ancestor is the top of the chain and the answer is
 * unique; an unvalidated record whose building roots nest answers the nearest
 * one, and a parent cycle ends the walk without an owner.
 *
 * Throws for an undeclared space id and for a space no building unit owns, the
 * same refusal validation makes for an unowned space.
 */
export function builtEnvironmentBuildingOfSpace(
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): string {
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
}
