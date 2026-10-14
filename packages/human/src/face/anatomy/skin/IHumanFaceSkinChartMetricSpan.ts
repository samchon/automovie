import type { IHumanFaceProjectedSkinSpan } from "./IHumanFaceProjectedSkinSpan";
import type { IHumanFaceSkinChartSpan } from "./IHumanFaceSkinChartSpan";

/**
 * A native chart interval and its physical arc station. The same head-frame endpoints determine length, Euclidean distance and barycentric frame lookup; chart coefficient distance is not substituted.
 *
 * @evidence contracts/common.md#principled-implementation One native chart interval combines material frame acquisition with physical endpoint arc length.
 * @evidence contracts/common.md#clear-and-simple-design Extending the native and projected span records keeps the same endpoints for frame and nearest-course readers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Material coefficient length is not a physical skin distance and host callbacks must keep their immutable acquisition premise.
 * @evidence contracts/common.md#meaningful-documentation lengthMetres and precedingLengthMetres use Euclidean endpoint arc length in head metres.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Exact native walking, endpoint norms and frame evaluation execute in chart course construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Physical metrics and exact material frames reuse the same emitted interval.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owned endpoint arrays and retained frame closures live with the course; this erased schema owns no host geometry.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinChartMetricSpan
  extends IHumanFaceSkinChartSpan, IHumanFaceProjectedSkinSpan {}
