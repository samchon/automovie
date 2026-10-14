import type { IAutoMovieHumanFaceSkinRelief } from "../../structures/IAutoMovieHumanFaceSkinRelief";
import type { IAutoMovieHumanFaceRegionalRelief } from "../../structures/IAutoMovieHumanFaceRegionalRelief";

/**
 * Retain persistent skin traits while omitting independent performed folds.
 * Nasolabial smile performance remains driven by the caller's neutral source
 * weights. The input is never changed and an already neutral regional record
 * is reused, without turning raw clinical grades into geometry.
 *
 * @evidence contracts/common.md#principled-implementation Omit only regional performance fields from an owned clone when present, preserving persistent offsets/fold parameters and nasolabial settings; neutral source weights separately suppress smile performance at the reference caller.
 * @evidence contracts/common.md#clear-and-simple-design One identity adapter prepares the regional input for prepareHumanFaceReference without duplicating course geometry or the performed relief owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Undefined and already neutral records retain their identity; no clinical grade, guessed fold or changed caller value supplies the reference state.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes persistent traits, regional performance omission, nasolabial neutral-weight ownership and input reuse.
 * @evidence contracts/performance.md#efficient-algorithms The scan covers the bounded regional population and clones the relief record only when performance exists; it allocates no mesh or chart.
 * @evidence contracts/performance.md#reuse-equivalent-work An already neutral input returns unchanged by reference; performed inputs need their own independent clone and no cross-request cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local region arrays and the optional clone scale with the input record; only the result escapes, with no retained basis, host or task.
 *
 * @author Samchon
 */
export function humanFaceSkinReliefIdentity(
  relief: IAutoMovieHumanFaceSkinRelief | undefined,
): IAutoMovieHumanFaceSkinRelief | undefined {
  if (relief === undefined) return relief;
  const regions: (IAutoMovieHumanFaceRegionalRelief | undefined)[] = Object.values(relief.regions ?? {});
  if (
    !regions.some(
      (settings: IAutoMovieHumanFaceRegionalRelief | undefined): boolean  => settings?.performance !== undefined,
    )
  )
    return relief;
  const identity: IAutoMovieHumanFaceSkinRelief = structuredClone(relief);
  const identityRegions: (IAutoMovieHumanFaceRegionalRelief | undefined)[] = Object.values(identity.regions ?? {});
  for (const settings of identityRegions)
    if (settings !== undefined) delete settings.performance;
  return identity;
}
