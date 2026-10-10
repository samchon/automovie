import type { IAutoMovieHumanFaceOpticalSupportGaze } from "./IAutoMovieHumanFaceOpticalSupportGaze";

/**
 * Exact witness of the existing rigid owner configuration of one eye, as the
 * optical source producer saw it.
 *
 * The articulation's centre landmark remains the rotation pivot; this record
 * lets the consumer refuse a support produced against another configuration.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOpticalSupportRigid {
  /** Existing eye centre landmark identity. */
  center: string;

  /** Existing gaze list in composition order, with its authored units unchanged. */
  gaze: IAutoMovieHumanFaceOpticalSupportGaze[];
}
