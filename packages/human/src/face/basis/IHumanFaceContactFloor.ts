/**
 * One original unit-gradient affine contact floor in basis metres.
 * The local solver must retain the existing budget and actual-query verification.
 *
 * @author Samchon
 */
export interface IHumanFaceContactFloor {
  /** Unit signed-distance gradient at the original performed point. */
  normal: readonly number[];
  /** Required local displacement along this gradient, metres. */
  minimum: number;
}
