import type { IAutoMovieQuaternion } from "@automovie/interface";

/**
 * One rigid transform as a unit dual quaternion `real + ε dual`, the blend
 * element of `skinHumanBodySurface`.
 *
 * @author Samchon
 */
export interface IHumanBodyDualQuaternion {
  /** The rotation. */
  real: IAutoMovieQuaternion;

  /** Half the translation times the rotation, as a pure-quaternion product. */
  dual: IAutoMovieQuaternion;
}
