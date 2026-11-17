import type {
  IAutoMovieAffordance,
  IAutoMovieAffordanceTravelRange,
} from "@automovie/interface";

/** The kinds that may move the other way from rest by their `reverse`. */
const REVERSIBLE: ReadonlySet<IAutoMovieAffordance["kind"]> = new Set([
  "hinge",
  "knob",
  "slider",
]);

/**
 * The travel range of an articulation affordance, in its kind's unit: degrees for a `hinge`, `knob`, `crank` and `wheel`, metres for a `slider`, `button`, `pedal` and `trigger`.
 *
 * A `wheel` turns `travel` to either side, a `crank` without `travel` has no limit, a `hinge`, `knob` or `slider` runs from minus its `reverse` to `travel`, and every other kind runs from 0 to `travel`, as `IAutoMovieAffordance.travel` and `reverse` state; without `reverse` the least travel is 0, the one-way articulation. An articulation without `travel` other than a crank does not move forward, so its greatest travel is 0. The kind is not checked: the caller passes an articulation.
 *
 * @param affordance The articulation.
 * @returns The least and greatest travel; null for an end without a limit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each kind's range, the units, the other way's travel and the meaning of null.
 * @evidence contracts/development/implementation.md#principled-implementation The ranges `IAutoMovieAffordance.travel` and `reverse` state for each kind.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per rule: the endless crank, the two-sided wheel, then the rest from the other way's travel to the forward one; owned here so engine admission of `follows` and the archetypes' pose read one rule.
 * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case beyond the kinds' stated rules.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function affordanceTravelRange(
  affordance: IAutoMovieAffordance,
): IAutoMovieAffordanceTravelRange.IResult {
  const travel: number | null = affordance.travel ?? null;
  if (affordance.kind === "crank" && travel === null)
    return { minimum: null, maximum: null };
  if (affordance.kind === "wheel" && travel !== null)
    return { minimum: -travel, maximum: travel };
  return {
    minimum:
      REVERSIBLE.has(affordance.kind) && affordance.reverse !== undefined
        ? -affordance.reverse
        : 0,
    maximum: travel ?? 0,
  };
}
