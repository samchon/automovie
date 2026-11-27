import type {
  IAutoMovieAffordance,
  IAutoMovieAffordanceTravelRange,
} from "@automovie/interface";

/**
 * The travel range of an articulation affordance, in its kind's unit: degrees
 * for a `hinge`, `knob`, `crank` and `wheel`, metres for a `slider`, `button`,
 * `pedal` and `trigger`.
 *
 * A `wheel` turns `travel` to either side, a `crank` without `travel` has no
 * limit, a `hinge`, `knob` or `slider` runs from minus its `reverse` to
 * `travel`, and every other kind runs from 0 to `travel`, as
 * `IAutoMovieAffordance.travel` and `reverse` state; without `reverse` the
 * least travel is 0, the one-way articulation. An articulation without `travel`
 * other than a crank does not move forward, so its greatest travel is 0. The
 * kind is not checked: the caller passes an articulation.
 *
 * @param affordance The articulation.
 * @returns The least and greatest travel; null for an end without a limit.
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

/** The kinds that may move the other way from rest by their `reverse`. */
const REVERSIBLE: ReadonlySet<IAutoMovieAffordance["kind"]> = new Set([
  "hinge",
  "knob",
  "slider",
]);
