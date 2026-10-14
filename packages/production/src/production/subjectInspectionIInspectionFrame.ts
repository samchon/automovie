import { IAutoMovieSubjectBox } from "@automovie/interface";

/**
 * Pair borrowed selected subject bounds with their explicit model/world basis.
 *
 * @evidence contracts/common.md#principled-implementation Measured content or declared fallback bounds retain their description's coordinate-space discriminator.
 * @evidence contracts/common.md#clear-and-simple-design Frame selection stays separate from numerical camera planning.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type neither measures an envelope nor authorizes a currently unsupported formation frame.
 * @evidence contracts/common.md#meaningful-documentation Bounds use metres and remain borrowed from the resolved description.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Selection and box/lens work execute in frame and pose owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same selected bounds feed fitting, grounding and every plan pose.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The wrapper is caller-owned but its box is borrowed; no geometry snapshot or cache is acquired by this schema.
 *
 * @author Samchon
 */
export interface subjectInspectionIInspectionFrame {
  /** Selected content or declared bounds borrowed from the compiled description. */
  bounds: IAutoMovieSubjectBox;

  /** Coordinate basis retained with those bounds for camera placement. */
  coordinateSpace: "model" | "world";
}
