import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The rigid motion that carries a face part from the neutral frame onto the
 * posed head of a shaped body: `point(p) = R (p + shift) + t`.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadTransform {
  /** The change of orientation the posed bone makes from its rest, `posed * rest⁻¹`. */
  rotation: IAutoMovieQuaternion;

  /** The rest-frame translation alone: the anchor's shaped minus neutral position. */
  shift: IAutoMovieVector3;

  /**
   * Carry a neutral-frame point onto the posed head.
   */
  point(p: IAutoMovieVector3): IAutoMovieVector3;

  /**
   * Rotate a direction by the posed change of orientation.
   */
  direction(n: IAutoMovieVector3): IAutoMovieVector3;
}
