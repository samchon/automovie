import type { IAutoMovieHumanPersonNormalTransportHalf } from "./IAutoMovieHumanPersonNormalTransportHalf";
import type { IAutoMovieHumanPersonSourcePartitionPlan } from "./IAutoMovieHumanPersonSourcePartitionPlan";

/**
 * What admitting fixed source normal cells reads: the admitted source
 * partition plan and both complementary skin halves.
 *
 * @evidence contracts/common.md#principled-implementation Normal cells are admitted against the already admitted geometric plan and both halves' incidence.
 * @evidence contracts/common.md#clear-and-simple-design Three members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The plan is the partition validator's own result; nothing is recomputed or defaulted.
 * @evidence contracts/common.md#meaningful-documentation States each member.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The carrier defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The carrier emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Lineage records carry no frame or unit.
 * @evidence contracts/modeling.md#shared-boundaries Both halves must share one subdivision tree over one plan.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal source lineage that is not observed directly.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical lineage, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Compiled or derived lineage, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonNormalTransportValidationProps {
  /** The admitted source partition plan. */
  plan: IAutoMovieHumanPersonSourcePartitionPlan;

  /** The face's skin half. */
  face: IAutoMovieHumanPersonNormalTransportHalf;

  /** The body's skin half. */
  body: IAutoMovieHumanPersonNormalTransportHalf;
}
