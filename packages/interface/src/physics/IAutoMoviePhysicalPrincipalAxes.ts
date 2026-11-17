import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Ordered principal moments and frame orientation from symmetric-tensor diagonalization. */
export namespace IAutoMoviePhysicalPrincipalAxes {
  /**
   * Principal moments and a right-handed principal frame for a symmetric inertia tensor.
   *
   * moments are ascending x <= y <= z in the input tensor's units; rotation maps the principal frame into the tensor's frame. physicalPrincipalAxes returns newly allocated values after modifying the supplied tensor rows in place during diagonalization. Callers provide a finite symmetric 3 by 3 tensor; the producer rejects zero scale but does not fully validate dimensions or symmetry. Equal moments do not identify a unique physical axis basis.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Principal moments and a right-handed principal frame for a symmetric inertia tensor.
   * @evidence contracts/development/design.md#principled-representation moments are ascending x <= y <= z in the input tensor's units; rotation maps the principal frame into the tensor's frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface physicalPrincipalAxes returns newly allocated values after modifying the supplied tensor rows in place during diagonalization.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Callers provide a finite symmetric 3 by 3 tensor; the producer rejects zero scale but does not fully validate dimensions or symmetry. Equal moments do not identify a unique physical axis basis.
   */
  export type IResult = {
    
    /** Ascending principal moments in the same unit as the tensor, such as kg m² or m² per unit mass. */
    moments: IAutoMovieVector3;
    
    /** Unit quaternion from the ordered right-handed principal axes into the input tensor frame. */
    rotation: IAutoMovieQuaternion;
  };
}
