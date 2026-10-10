import type { IAutoMovieSpatialQueryEntry } from "@automovie/engine";

import type { IHumanFaceLashSegment } from "./IHumanFaceLashSegment";

/**
 * Actual capsule bounds paired with the shaft segment they conservatively enclose.
 * The original segment remains the narrow-phase input; the box and ordinal
 * serve finite candidate traversal and reproduce the legacy pair order only.
 *
 * @author Samchon
 */
export interface IHumanFaceLashCapsuleEntry extends IAutoMovieSpatialQueryEntry {
  /** Original observed capsule used for the segment-distance admission. */
  segment: IHumanFaceLashSegment;
}
