import type { IAutoMovieHumanFaceSkinRelief } from "../../structures/IAutoMovieHumanFaceSkinRelief";

/**
 * Retain persistent skin traits while omitting independent performed folds.
 * Nasolabial smile performance remains driven by the caller's neutral source
 * weights. The input is never changed and an already neutral regional record
 * is reused, without turning raw clinical grades into geometry.
 * @evidence contracts/common.md#principled-implementation The explicit performed fraction is the only regional field removed; signed resting offsets and all support dimensions remain identical.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No zeroed identity trait or clinical-grade conversion substitutes for a neutral performed state.
 * @author Samchon
 */
export function humanFaceSkinReliefIdentity(relief: IAutoMovieHumanFaceSkinRelief | undefined): IAutoMovieHumanFaceSkinRelief | undefined {
  if (relief === undefined || !Object.values(relief.regions ?? {}).some(settings => settings?.performance !== undefined)) return relief;
  const identity = structuredClone(relief);
  for (const settings of Object.values(identity.regions ?? {})) if (settings !== undefined) delete settings.performance;
  return identity;
}
