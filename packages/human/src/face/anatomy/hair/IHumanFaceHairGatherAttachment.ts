import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Current scalp point and source triangle consumed by the gather graph.
 * The graph needs no neutral barycentric weights after attachment resolution.
 *
 * @author Samchon
 */
export interface IHumanFaceHairGatherAttachment {
  /** Current scalp attachment in head-frame metres. */
  point: IAutoMovieVector3;

  /** Original source triangle ordinal. */
  triangle: number;
}
