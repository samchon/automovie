import { IAutoMovieSubjectBox } from "@automovie/interface";
import { subjectInspectionDEGENERATE_RADIUS } from "./subjectInspectionDEGENERATE_RADIUS";

/**
 * Read half the box diagonal with a conventional minimum radius of 0.5 metres.
 *
 * @evidence contracts/common.md#principled-implementation A Euclidean diagonal norm divided by two is floored at the existing conventional radius.
 * @evidence contracts/common.md#clear-and-simple-design Fit distance and clip planes share this exact radius operation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The floor applies to every smaller nondegenerate box too, not only zero-sized subjects; it is framing context rather than a measured bound.
 * @evidence contracts/common.md#meaningful-documentation Returns metres and relies on finite ordered input bounds.
 * @evidence contracts/performance.md#efficient-algorithms Three differences, one norm and one maximum use fixed work.
 * @evidence contracts/performance.md#reuse-equivalent-work The same floored radius convention is reused by fitting and pose owners, with no geometry cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a scalar escapes and the input box is not retained.
 */
export function subjectInspectionBoxRadius(
  bounds: IAutoMovieSubjectBox
): number { return Math.max(
    Math.hypot(
      bounds.max.x - bounds.min.x,
      bounds.max.y - bounds.min.y,
      bounds.max.z - bounds.min.z,
    ) / 2,
    subjectInspectionDEGENERATE_RADIUS,
  ); }
