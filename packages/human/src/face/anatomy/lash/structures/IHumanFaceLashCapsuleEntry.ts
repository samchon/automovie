import type { IAutoMovieSpatialQueryEntry } from "@automovie/engine";

import type { IHumanFaceLashSegment } from "./IHumanFaceLashSegment";

/**
 * Actual capsule bounds paired with the shaft segment they conservatively enclose. The original segment remains the narrow-phase input; the box and ordinal serve finite candidate traversal and reproduce the legacy pair order only.
 *
 * @evidence contracts/common.md#principled-implementation An actual observed shaft segment accompanies its conservative AABB and original traversal ordinal.
 * @evidence contracts/common.md#clear-and-simple-design Broad phase bounds remain distinct from the original segment-distance narrow-phase input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bounds only restrict candidate traversal and reproduce pair order; coordinates and radius are not quantized into biological geometry.
 * @evidence contracts/common.md#meaningful-documentation The segment uses head metres and inherited ordinal records original emitted order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Hierarchy construction and segment distance execute in assertHumanFaceLashContact, not this erased entry.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The source owner shares one entry hierarchy across all shaft segments.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Entry arrays and segment references are held only by the synchronous contact check; this type owns no query handle.
 *
 * @author Samchon
 */
export interface IHumanFaceLashCapsuleEntry extends IAutoMovieSpatialQueryEntry {
  /** Original observed capsule used for the segment-distance admission. */
  segment: IHumanFaceLashSegment;
}
