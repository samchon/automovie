import type { IAutoMovieHumanPersonNormalTransportPlan } from "./IAutoMovieHumanPersonNormalTransportPlan";
import type { IAutoMovieHumanPersonReferenceNormalField } from "./IAutoMovieHumanPersonReferenceNormalField";
import type { IAutoMovieHumanPersonSourceCellEvaluationProps } from "./IAutoMovieHumanPersonSourceCellEvaluationProps";

/**
 * What building fixed source-cell normal transport reads: the performed-cell
 * evaluation context without its input, the admitted transport plan, the
 * ancestral field builder over reference parent areas, and a sample's
 * weighted-key identity under a parent.
 *
 * @evidence contracts/common.md#principled-implementation Transport consumes the admitted plan and the source-normal owner's own field and identity rather than recomputing them.
 * @evidence contracts/common.md#clear-and-simple-design Four members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every member is an admitted owner's value; nothing neutral or personal substitutes.
 * @evidence contracts/common.md#meaningful-documentation States each member and its owner.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The carrier defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The carrier emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The carrier adds no coordinate; fields and skins state their own frames.
 * @evidence contracts/modeling.md#shared-boundaries Both halves consume the same fixed cells and identities.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal construction input that is not observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical geometry, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Evaluated geometry or compiled lineage, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonNormalTransportProps {
  /** Performed-cell evaluation context, without the per-call input. */
  evaluation: Omit<IAutoMovieHumanPersonSourceCellEvaluationProps, "input">;

  /** The admitted fixed normal transport. */
  transport: IAutoMovieHumanPersonNormalTransportPlan;

  /**
   * Build the ancestral field from reference parent area vectors.
   *
   * @evidence contracts/common.md#principled-implementation Transport reuses the source-normal owner's own field builder over reference parent areas instead of rebuilding it.
   * @evidence contracts/common.md#clear-and-simple-design One function from parent areas to a field.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts IAutoMovieHumanPersonNormalTransportProps.referenceField is a signature; it carries no behaviour, special case or compensating path.
   * @evidence contracts/common.md#meaningful-documentation States its input and what it builds.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IAutoMovieHumanPersonNormalTransportProps.referenceField is a declaration and defines no part or group of parts.
   * @evidenceExclude contracts/modeling.md#parameter-channels IAutoMovieHumanPersonNormalTransportProps.referenceField carries no parameter channel of a form.
   * @evidenceExclude contracts/modeling.md#emitted-geometry IAutoMovieHumanPersonNormalTransportProps.referenceField decides no primitive population; it only describes data.
   * @evidence contracts/modeling.md#spatial-conventions Parent areas are square metres and returned normals unit vectors in the shared Y-up, +Z-forward frame.
   * @evidenceExclude contracts/modeling.md#shared-boundaries IAutoMovieHumanPersonNormalTransportProps.referenceField constructs no surface; it describes data only.
   * @evidenceExclude contracts/modeling.md#rendered-observation IAutoMovieHumanPersonNormalTransportProps.referenceField is a declaration and displays nothing itself.
   * @evidenceExclude contracts/anatomy.md#anatomical-source IAutoMovieHumanPersonNormalTransportProps.referenceField carries no anatomical value, range, proportion, landmark or tissue behaviour.
   * @evidenceExclude contracts/anatomy.md#permitted-range IAutoMovieHumanPersonNormalTransportProps.referenceField admits, bounds and combines no anatomical value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority IAutoMovieHumanPersonNormalTransportProps.referenceField defines no input through which a caller shapes a human form.
   */
  referenceField: (
    parentAreas: readonly number[],
  ) => IAutoMovieHumanPersonReferenceNormalField;

  /**
   * Weighted-key identity of a sample under a parent.
   *
   * @evidence contracts/common.md#principled-implementation Star keys reuse the source-normal owner's weighted-key identity, so transport and the ancestral field agree.
   * @evidence contracts/common.md#clear-and-simple-design One function of a sample and a parent.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts IAutoMovieHumanPersonNormalTransportProps.identity is a signature; it carries no behaviour, special case or compensating path.
   * @evidence contracts/common.md#meaningful-documentation States what identity it returns.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IAutoMovieHumanPersonNormalTransportProps.identity is a declaration and defines no part or group of parts.
   * @evidenceExclude contracts/modeling.md#parameter-channels IAutoMovieHumanPersonNormalTransportProps.identity carries no parameter channel of a form.
   * @evidenceExclude contracts/modeling.md#emitted-geometry IAutoMovieHumanPersonNormalTransportProps.identity decides no primitive population; it only describes data.
   * @evidenceExclude contracts/modeling.md#spatial-conventions An identity string carries no frame or unit.
   * @evidenceExclude contracts/modeling.md#shared-boundaries IAutoMovieHumanPersonNormalTransportProps.identity constructs no surface; it describes data only.
   * @evidenceExclude contracts/modeling.md#rendered-observation IAutoMovieHumanPersonNormalTransportProps.identity is a declaration and displays nothing itself.
   * @evidenceExclude contracts/anatomy.md#anatomical-source IAutoMovieHumanPersonNormalTransportProps.identity carries no anatomical value, range, proportion, landmark or tissue behaviour.
   * @evidenceExclude contracts/anatomy.md#permitted-range IAutoMovieHumanPersonNormalTransportProps.identity admits, bounds and combines no anatomical value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority IAutoMovieHumanPersonNormalTransportProps.identity defines no input through which a caller shapes a human form.
   */
  identity: (sample: number, parent: number) => string;
}
