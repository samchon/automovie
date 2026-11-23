import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Copy a live requested-name set into this immutable rig's parent-first output
 * indices. An omitted set selects every indexed node; unreachable names are
 * absent. The returned list is private prepared input, kept unchanged by its
 * caller, and contains no FK result or pose dependency.
 */
export function preparePoseBoneDemand(
  indices: ReadonlyMap<AutoMovieHumanoidBone, number>,
  count: number,
  requested?: ReadonlySet<AutoMovieHumanoidBone>,
): readonly number[] {
  const demanded: number[] = [];
  if (requested === undefined)
    for (let index: number = 0; index < count; ++index) demanded.push(index);
  else {
    for (const name of requested) {
      const index: number | undefined = indices.get(name);
      if (index !== undefined) demanded.push(index);
    }
    if (demanded.length > 1)
      demanded.sort((left: number, right: number): number => left - right);
  }
  return demanded;
}
