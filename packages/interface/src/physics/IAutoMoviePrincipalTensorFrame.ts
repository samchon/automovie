import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Principal moments and a right-handed principal frame for a symmetric inertia
 * tensor.
 *
 * Moments are ascending x <= y <= z in the input tensor's units; rotation maps
 * the principal frame into the tensor's frame. physicalPrincipalAxes returns
 * newly allocated values after modifying the supplied tensor rows in place
 * during diagonalization. Callers provide a finite symmetric 3 by 3 tensor; the
 * producer rejects zero scale but does not fully validate dimensions or
 * symmetry. Equal moments do not identify a unique physical axis basis.
 */
export type IAutoMoviePrincipalTensorFrame = {
  /**
   * Ascending principal moments in the same unit as the tensor, such as kg m²
   * or m² per unit mass.
   */
  moments: IAutoMovieVector3;

  /**
   * Unit quaternion from the ordered right-handed principal axes into the input
   * tensor frame.
   */
  rotation: IAutoMovieQuaternion;
};
