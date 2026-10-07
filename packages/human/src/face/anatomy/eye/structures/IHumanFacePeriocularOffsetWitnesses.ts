import type { IHumanFacePeriocularCrossingWitness } from "./IHumanFacePeriocularCrossingWitness";
import type { IHumanFacePeriocularOffsetVertex } from "./IHumanFacePeriocularOffsetVertex";

/**
 * Original instrument witnesses; this adds no measurement or admission rule.
 * The actual requested distances and retained skin frames identify the
 * normal-offset map whose generated triangles the instrument inspected.
 *
 * @evidence contracts/common.md#principled-implementation Retains existing transverse witness populations and their exact construction inputs.
 * @evidence contracts/common.md#clear-and-simple-design One table stores each participating producer vertex once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither distance nor physical acceptance is changed by the report.
 * @evidence contracts/common.md#meaningful-documentation States that these are producer observations, not anatomical qualification.
 * @evidence contracts/modeling.md#spatial-conventions Requested distances and positions use metres in the original head frame.
 * @evidence contracts/modeling.md#shared-boundaries The two sheet populations share the same producer vertex table.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularOffsetWitnesses {
  /** Requested outer-sheet inward distance, metres. */
  outerDistanceMetres: number;
  /** Requested inner-sheet inward distance, metres. */
  innerDistanceMetres: number;
  /** Original outer-versus-outer transverse witnesses. */
  outer: IHumanFacePeriocularCrossingWitness[];
  /** Original inner-versus-inner transverse witnesses. */
  inner: IHumanFacePeriocularCrossingWitness[];
  /** Original outer-versus-inner transverse witnesses. */
  between: IHumanFacePeriocularCrossingWitness[];
  /** Producer frames for the union of all witness corners, once per identity. */
  vertices: IHumanFacePeriocularOffsetVertex[];
}
