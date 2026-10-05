import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Where one vertical line of the head frame crosses one eyebrow, on the
 * build's final surface: the lowest and highest crossing points of the brow
 * card's triangles with the plane of constant head-frame X.
 *
 * The brow is one alpha card, so these are the card's borders, standing for
 * the inferior and superior hair margins of the brow envelope.
 *
 * @evidence contracts/common.md#principled-implementation Two named points of one section; the reader that fills it owns the rule.
 * @evidence contracts/common.md#clear-and-simple-design Two fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries measured points only.
 * @evidence contracts/common.md#meaningful-documentation States what the points are and that the card stands for the hair envelope.
 * @evidence contracts/modeling.md#spatial-conventions Points are metres in the basis head frame.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The brow parameter type cites the margin definitions.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The periocular registration names the parts; the reader names none.
 * @evidenceExclude contracts/modeling.md#parameter-channels The reader is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The reader emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The reader builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Measurements report what it reads.
 * @evidenceExclude contracts/anatomy.md#permitted-range The reader bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The reader is not an input.
 *
 * @author Samchon
 */
export interface IHumanFaceBrowSection {
  /** Lowest crossing: the inferior border of the brow card on the vertical. */
  inferior: IAutoMovieVector3;

  /** Highest crossing: the superior border of the brow card on the vertical. */
  superior: IAutoMovieVector3;
}
