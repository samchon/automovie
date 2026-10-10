import type { IAutoMovieHumanFaceAttachmentPoint } from "./IAutoMovieHumanFaceAttachmentPoint";

/**
 * Source-authored support beyond one coarse outer station. Each point lies
 * on existing host incidence; no personal sculpt curve or new mesh is stored.
 * Reference arcs are preparation observations, not fixed runtime distances.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceAttachmentContinuation {
  /** Original source cage column, not the index in a resampled tissue band. */
  column: number;

  /** Connected actual meridian-plane intersection from the outer station. */
  points: IAutoMovieHumanFaceAttachmentPoint[];

  /** Actual reference ocular meridian arc at each point, in metres. */
  referenceArcsMetres: number[];

  /** Posterior reference arc plus the unchanged registered tarsal extent. */
  referenceTargetMetres: number;
}
