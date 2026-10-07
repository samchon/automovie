import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Current scalp point and source triangle consumed by the gather graph.
 * The graph needs no neutral barycentric weights after attachment resolution.
 *
 * @evidence contracts/common.md#principled-implementation Current metre coordinates and the original triangle ordinal identify the tie read by the graph compiler without adding an author-controlled guide.
 * @evidence contracts/common.md#clear-and-simple-design The resolved anchor extends this graph input with transport weights, which existing graph callers need not supply.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The attachment is actual derived geometry, not a replacement scalp point.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the two-field current graph attachment from the neutral transport weights carried by its resolver.
 * @evidence contracts/modeling.md#spatial-conventions The current tie point is head-frame metres and triangle is the original source triangle ordinal.
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
export interface IHumanFaceHairGatherAttachment {
  /** Current scalp attachment in head-frame metres. */
  point: IAutoMovieVector3;

  /** Original source triangle ordinal. */
  triangle: number;
}
