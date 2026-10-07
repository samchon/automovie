import type { IHumanFaceHairGatherAttachment } from "./IHumanFaceHairGatherAttachment";

/**
 * Derived scalp attachment selected by the neutral angular ray and carried to the current face.
 * Point is current head-frame metres; triangle is the original source triangle ordinal.
 * Barycentric weights retain the neutral hit for current transport, not a personal authoring coordinate.
 *
 * @evidence contracts/common.md#principled-implementation Point, source ordinal and barycentric weights distinguish the current attachment from the neutral ray input.
 * @evidence contracts/common.md#clear-and-simple-design The ray resolver returns current attachment plus neutral barycentric transport weights in one result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries actual source geometry and derived state without a subject-specific replacement.
 * @evidence contracts/common.md#meaningful-documentation Explains the current point, original ordinal and neutral weights without exposing an authored strand coordinate.
 * @evidence contracts/modeling.md#spatial-conventions Current point uses head-frame metres, triangle retains the source ordinal, and weights are dimensionless in original corner order.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries geometry for an existing scalp and hair population without assigning a new part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Internal compiler state preserves the hairstyle document's controls and defines no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The resolver, graph or closure producer owns derived geometry; this record carries its inputs or result.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Source admission and hair-contact construction own topology; this record changes neither.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns the displayed assembly; this numerical carrier supplies no observed result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The basis owns source qualification; this carrier introduces no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Hairstyle admission retains numerical controls and bounds; this record adds no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal source and derived geometry are not personal authoring fields.
 * @author Samchon
 */
export interface IHumanFaceHairGatherAnchor extends IHumanFaceHairGatherAttachment {
  /** Neutral barycentric weights in source-corner order. */
  weights: [number, number, number];
}
