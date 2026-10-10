import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Canonical unit directions of the source-defined oral measurement frame.
 * Normalization changes no authored jaw axis or source admission tolerance.
 * These are a model convention, not a registered clinical acquisition frame.
 *
 * @author Samchon
 */
export interface IHumanFaceApertureDirections {
  /** Unit direction of the source mandibular axis; incisal readers call this left. */
  axis: IAutoMovieVector3;
  /** Unit direction nearest basis Y-up and perpendicular to the canonical axis. */
  up: IAutoMovieVector3;
  /** Unit anterior direction, canonical axis crossed with up. */
  forward: IAutoMovieVector3;
}
