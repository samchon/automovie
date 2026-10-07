import type { IAutoMovieHumanPersonSourcePartitionPlan } from "./IAutoMovieHumanPersonSourcePartitionPlan";
import type { IAutoMovieHumanPersonSourceStarBinding } from "./IAutoMovieHumanPersonSourceStarBinding";

/**
 * Inputs of `createHumanPersonReferenceField`: the admitted partition plan,
 * each used vertex's star binding per side, the binding of any sample under
 * any parent, and the performed parent area vectors.
 *
 * @evidence contracts/common.md#principled-implementation The field reads the source-normal owner's own bindings rather than re-deriving them.
 * @evidence contracts/common.md#clear-and-simple-design Four fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unused vertices carry no binding, so they cannot read a stale star.
 * @evidence contracts/common.md#meaningful-documentation States what each field is.
 * @evidence contracts/modeling.md#spatial-conventions Parent areas are square-metre vectors of the performed frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The props define no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The props carry no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The props emit no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The bindings own the shared-sample agreement.
 * @evidenceExclude contracts/modeling.md#rendered-observation The props are not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The props carry no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The props admit nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The props convert no input.
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
   *
   * @evidence contracts/common.md#principled-implementation The field asks the source-normal owner for a binding instead of rebuilding its chart.
   * @evidence contracts/common.md#clear-and-simple-design One sample and parent in, one binding out.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The member is a signature; it carries no behaviour.
   * @evidence contracts/common.md#meaningful-documentation States what it returns.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The member defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels The member carries no channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The member emits no geometry.
   * @evidenceExclude contracts/modeling.md#spatial-conventions The member carries no value with a unit or frame.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The binding owns the agreement.
   * @evidenceExclude contracts/modeling.md#rendered-observation The member displays nothing.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The member carries no anatomical value.
   * @evidenceExclude contracts/anatomy.md#permitted-range The member admits nothing.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The member converts no input.
   */
  bindingAt: (
    sample: number,
    parent: number,
  ) => IAutoMovieHumanPersonSourceStarBinding;

  /** Each parent's performed area vector, three numbers per parent corner slot. */
  parentAreas: readonly number[];
}
