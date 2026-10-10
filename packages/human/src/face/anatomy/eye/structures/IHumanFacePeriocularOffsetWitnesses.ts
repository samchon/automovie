import type { IHumanFacePeriocularCrossingWitness } from "./IHumanFacePeriocularCrossingWitness";
import type { IHumanFacePeriocularOffsetVertex } from "./IHumanFacePeriocularOffsetVertex";

/**
 * Original instrument witnesses; this adds no measurement or admission rule.
 * The actual requested distances and retained skin frames identify the
 * normal-offset map whose generated triangles the instrument inspected.
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
