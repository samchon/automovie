import type { IAutoMovieHumanFaceSkinRelief } from "../../structures/IAutoMovieHumanFaceSkinRelief";

/**
 * Retain persistent skin traits while omitting independent performed folds.
 * Nasolabial smile performance remains driven by the caller's neutral source
 * weights. The input is never changed and an already neutral regional record
 * is reused, without turning raw clinical grades into geometry.
 * @author Samchon
 */
export function humanFaceSkinReliefIdentity(
  relief: IAutoMovieHumanFaceSkinRelief | undefined,
): IAutoMovieHumanFaceSkinRelief | undefined {
  if (
    relief === undefined ||
    !Object.values(relief.regions ?? {}).some(
      (settings) => settings?.performance !== undefined,
    )
  )
    return relief;
  const identity = structuredClone(relief);
  for (const settings of Object.values(identity.regions ?? {}))
    if (settings !== undefined) delete settings.performance;
  return identity;
}
