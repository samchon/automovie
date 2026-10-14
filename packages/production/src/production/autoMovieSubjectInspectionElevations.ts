import { IAutoMovieSubjectBox } from "@automovie/interface";
import { subjectInspectionBoxCenter } from "./subjectInspectionBoxCenter";

/**
 * Raise low camera rings using the box centre and min(0, box minimum Y).
 *
 * @evidence contracts/common.md#principled-implementation An arcsine lower-angle bound limits eye descent at the supplied distance, then exact equal raised angles deduplicate.
 * @evidence contracts/common.md#clear-and-simple-design Grounding stays separate from ring construction and may require the service to rebuild its ordered plan.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The zero/box floor is a framing convention, not a sampled environment floor; nonpositive distance uses zero degrees and invalid finite-box/distance inputs are not independently admitted here.
 * @evidence contracts/common.md#meaningful-documentation Coordinates/distance are metres and outputs degrees, with first occurrence order preserved.
 * @evidence contracts/performance.md#efficient-algorithms E elevations use linear membership in the growing output, so worst-case O(E squared) comparisons; service ring count is bounded by eight.
 * @evidence contracts/performance.md#reuse-equivalent-work One centre/drop/lower bound serves all requested rings without a retained pose cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the new scalar array and input bounds/elevations remain borrowed.
 */
export function autoMovieSubjectInspectionElevations(
  props: {
  /** Box the plan frames, in the subject's own coordinate space. */
  bounds: IAutoMovieSubjectBox;

  /** Elevation rings the caller asked for, in degrees. */
  elevationsDeg: readonly number[];

  /** Distance the plan places the eye at, in metres. */
  distance: number;
}
): number[] {
  const floor: number = Math.min(0, props.bounds.min.y);
  const drop: number = subjectInspectionBoxCenter(props.bounds).y - floor;
  const lowest: number =
    props.distance <= 0
      ? 0
      : -Math.asin(Math.min(1, drop / props.distance)) * (180 / Math.PI);
  const grounded: number[] = [];
  for (const elevationDeg of props.elevationsDeg) {
    const raised: number = Math.max(elevationDeg, lowest);
    if (grounded.includes(raised) === false) grounded.push(raised);
  }
  return grounded;
}
