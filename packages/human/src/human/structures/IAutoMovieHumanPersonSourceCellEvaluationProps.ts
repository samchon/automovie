import type { IAutoMovieHumanPersonPerformedSkin } from "./IAutoMovieHumanPersonPerformedSkin";
import type { IAutoMovieHumanPersonSourcePartitionPlan } from "./IAutoMovieHumanPersonSourcePartitionPlan";

/**
 * What admitting one performed pair of complementary source skins reads: the
 * admitted partition plan, the face and body triangle indices it was compiled
 * for, and the performed skin to evaluate.
 *
 * @evidence contracts/common.md#principled-implementation Performed cells are admitted against the compiled plan and its own emitted incidence.
 * @evidence contracts/common.md#clear-and-simple-design Four members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The input is the actual performed skin; population changes refuse rather than being reconciled.
 * @evidence contracts/common.md#meaningful-documentation States each member.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The carrier defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The carrier emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The carrier adds no coordinate; the performed skin states its frame.
 * @evidence contracts/modeling.md#shared-boundaries Both halves are admitted together against one shared plan.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal admission input that is not observed directly.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical geometry, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Evaluated geometry, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceCellEvaluationProps {
  /** The admitted source partition plan. */
  plan: IAutoMovieHumanPersonSourcePartitionPlan;

  /** Face skin triangle vertex index triples. */
  faceIndices: readonly number[];

  /** Body skin triangle vertex index triples retained by the cut. */
  bodyIndices: readonly number[];

  /** The performed skin to evaluate. */
  input: IAutoMovieHumanPersonPerformedSkin;
}
