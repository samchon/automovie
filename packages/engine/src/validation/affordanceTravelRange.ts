import type { IAutoMovieAffordance } from "@automovie/interface";

/**
 * The travel range of an articulation affordance, in its kind's unit: degrees for a `hinge`, `knob`, `crank` and `wheel`, metres for a `slider`, `button`, `pedal` and `trigger`.
 *
 * A `wheel` turns `travel` to either side, a `crank` without `travel` has no limit, and every other kind runs from 0 to `travel`, as `IAutoMovieAffordance.travel` states. An articulation without `travel` other than a crank states none and stays at rest, so both ends are 0. The kind is not checked: the caller passes an articulation.
 *
 * @param affordance The articulation.
 * @returns The least and greatest travel; null for an end without a limit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each kind's range, the units and the meaning of null.
 * @evidence contracts/development/implementation.md#principled-implementation The ranges `IAutoMovieAffordance.travel` states for each kind.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per rule: the endless crank, the articulation that states no travel, the two-sided wheel, then the rest; owned here so engine admission of `follows` and the archetypes' pose read one rule.
 * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case beyond the kinds' stated rules.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function affordanceTravelRange(affordance: IAutoMovieAffordance): {
  minimum: number | null;
  maximum: number | null;
} {
  const travel: number | null = affordance.travel ?? null;
  if (affordance.kind === "crank" && travel === null)
    return { minimum: null, maximum: null };
  if (travel === null) return { minimum: 0, maximum: 0 };
  if (affordance.kind === "wheel") return { minimum: -travel, maximum: travel };
  return { minimum: 0, maximum: travel };
}
