import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The transported gather candidate returned by
 * `transportHumanFaceHairGatherStep`.
 *
 * The integrator still admits or rejects the point; this record is a proposal
 * that preserves the requested normal intent along the actual chord.
 *
 * @author Samchon
 */
export interface IHumanFaceHairGatherTransport {
  /** Proposed station, in current head-frame metres. */
  point: IAutoMovieVector3;

  /** Free offset from the skin carried to the next step, in metres. */
  offset: number;

  /** Dot product of the requested direction and the outward normal. */
  normalIntent: number;
}
