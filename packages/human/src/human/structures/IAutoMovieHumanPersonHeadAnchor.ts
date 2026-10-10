import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The point that carries the face from the neutral frame into a shaped body:
 * where it is in the neutral the face was built in, and where the body's
 * shape put it.
 *
 * The face basis is defined in an eye-centred frame (its endpoint rows are
 * the upstream state minus that frame's shift), so the anchor is the midpoint
 * of the body's two eye joints; carrying by another point leaves a uniform
 * offset between the face's neck and the body's at the cut.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadAnchor {
  /** The anchor in the neutral frame the face was built in. */
  neutral: IAutoMovieVector3;

  /** The anchor in the shaped body's rest. */
  shaped: IAutoMovieVector3;
}
