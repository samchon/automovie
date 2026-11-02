import { AutoMovieHumanSkeletonMath as M } from "./AutoMovieHumanSkeletonMath";

/** Carry the scapula's own motion while preserving the requested humeral frame. */
export namespace AutoMovieHumanShoulderTransfer {
  /** Local scapular rotation and the counter-rotation assigned to its child. */
  export interface ITransfer {
    /** New scapular local rotation, including automatic upward rotation. */
    scapula: M.Quaternion;
    /** Pre-multiply the humeral local rotation by this counter-rotation. */
    humerus: M.Quaternion;
  }

  /**
   * Move compensation from the blade to GH. If the raised clavicle is R and
   * the original clavicle O, back is R^-1 O. With the old scapular rotation S
   * and automatic rotation A, Snew = back A S and C = Snew^-1 back S.
   * Consequently R Snew C U = O S U for every humeral rotation U, while the
   * blade itself carries O A S. All inputs remain immutable.
   */
  export function apply(back: M.Quaternion, own: M.Quaternion, axis: M.Vector, degrees: number): ITransfer {
    const scapula: M.Quaternion = M.multiply(back, M.multiply(M.fromAxisAngle(axis, degrees), own));
    const inverse: M.Quaternion = [-scapula[0], -scapula[1], -scapula[2], scapula[3]];
    return { scapula, humerus: M.multiply(inverse, M.multiply(back, own)) };
  }
}
