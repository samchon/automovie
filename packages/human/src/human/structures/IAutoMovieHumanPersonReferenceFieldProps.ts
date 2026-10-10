import type { IAutoMovieHumanPersonSourcePartitionPlan } from "./IAutoMovieHumanPersonSourcePartitionPlan";
import type { IAutoMovieHumanPersonSourceStarBinding } from "./IAutoMovieHumanPersonSourceStarBinding";

/**
 * Inputs of `createHumanPersonReferenceField`: the admitted partition plan,
 * each used vertex's star binding per side, the binding of any sample under
 * any parent, and the performed parent area vectors.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonReferenceFieldProps {
  /** The admitted partition plan. */
  plan: IAutoMovieHumanPersonSourcePartitionPlan;

  /** Per side (head, body), each vertex's binding, undefined for an unused vertex. */
  bindings: readonly (readonly (
    | IAutoMovieHumanPersonSourceStarBinding
    | undefined
  )[])[];

  /**
   * The binding of a sample under a parent.
   */
  bindingAt: (
    sample: number,
    parent: number,
  ) => IAutoMovieHumanPersonSourceStarBinding;

  /** Each parent's performed area vector, three numbers per parent corner slot. */
  parentAreas: readonly number[];
}
