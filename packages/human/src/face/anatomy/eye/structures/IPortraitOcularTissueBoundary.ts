import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The eye supplies its final refined lid curves and resident ocular support.
 * X increases on both sides; anatomical left has its medial corner at minimum X.
 * Upper and lower curves share endpoints and return millimetre head coordinates.
 *
 * @evidence contracts/common.md#principled-implementation An ordered aperture with the side that decides which canthus is medial, the final upper and lower lid at any X and the support height are everything the tissue builders need to lay a patch between the lids on the drawn globe.
 * @evidence contracts/common.md#clear-and-simple-design A record of two X limits, one side and three callbacks supplied by the eye, so the tissue builders hold no copy of the lids or globe.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type carries no mechanism and no field names a subject or fixture.
 * @evidence contracts/common.md#meaningful-documentation The record states the X ordering per side, that both lids share endpoints and return millimetre head coordinates, and what each callback returns.
 * @evidence contracts/modeling.md#spatial-conventions Every value is head millimetres in one frame, with X increasing on both sides and anatomical left's medial corner at the minimum X, as the record states.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record supplies a boundary to the tissue builders and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no surface; it is the definition the eye hands to the tissue builders so that they follow the drawn lids, and the join is judged where the tissue is built.
 *
 * @author Samchon
 */
export interface IPortraitOcularTissueBoundary {
  /** Anatomical side determining which canthus is medial. */
  side: "left" | "right";

  /** Smaller canthal X in head millimetres. */
  minimumX: number;

  /** Larger canthal X in head millimetres, strictly above minimumX. */
  maximumX: number;

  /**
   * Final upper-lid point at head X, in millimetres.
   *
   * @evidence contracts/common.md#principled-implementation Returning the final refined upper-lid point at a given X lets the tissue builders follow the lid that is actually drawn, so tissue and lid cannot disagree.
   * @evidence contracts/common.md#clear-and-simple-design One function member on the boundary the eye supplies.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A callback member of a record carries no mechanism and names no subject or fixture.
   * @evidence contracts/common.md#meaningful-documentation The comment states the returned point, its unit and its argument.
   * @evidence contracts/modeling.md#spatial-conventions The argument is head X and the result a head-millimetre point, as the comment states.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The callback answers a lid point. It defines no part or group.
   * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no primitive.
   * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no surface.
   * @evidenceExclude contracts/modeling.md#rendered-observation It owns no part and displays nothing.
   * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no anatomical value.
   * @evidenceExclude contracts/anatomy.md#permitted-range It admits or bounds no anatomical value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority It is a query supplied by the eye, not an input through which a caller shapes a face.
   */
  upper: (x: number) => IAutoMovieVector3;

  /**
   * Final lower-lid point at head X, in millimetres.
   *
   * @evidence contracts/common.md#principled-implementation Returning the final refined lower-lid point at a given X lets the tissue builders follow the lid that is actually drawn, so tissue and lid cannot disagree.
   * @evidence contracts/common.md#clear-and-simple-design One function member on the boundary the eye supplies.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A callback member of a record carries no mechanism and names no subject or fixture.
   * @evidence contracts/common.md#meaningful-documentation The comment states the returned point, its unit and its argument.
   * @evidence contracts/modeling.md#spatial-conventions The argument is head X and the result a head-millimetre point, as the comment states.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The callback answers a lid point. It defines no part or group.
   * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no primitive.
   * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no surface.
   * @evidenceExclude contracts/modeling.md#rendered-observation It owns no part and displays nothing.
   * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no anatomical value.
   * @evidenceExclude contracts/anatomy.md#permitted-range It admits or bounds no anatomical value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority It is a query supplied by the eye, not an input through which a caller shapes a face.
   */
  lower: (x: number) => IAutoMovieVector3;

  /**
   * Support height in mm. The eye may include its raised cornea as well as sclera.
   *
   * @evidence contracts/common.md#principled-implementation Returning the support height, including the raised cornea when the eye has one, lets the tissue rest on what is drawn beneath it instead of a smaller globe.
   * @evidence contracts/common.md#clear-and-simple-design One function member on the boundary the eye supplies.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A callback member of a record carries no mechanism and names no subject or fixture.
   * @evidence contracts/common.md#meaningful-documentation The comment states the returned height, its unit and that the cornea may be included.
   * @evidence contracts/modeling.md#spatial-conventions Arguments and result are head millimetres in the head frame (+Z anterior), as the comment states.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The callback answers a support height. It defines no part or group.
   * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no primitive.
   * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no surface.
   * @evidenceExclude contracts/modeling.md#rendered-observation It owns no part and displays nothing.
   * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no anatomical value.
   * @evidenceExclude contracts/anatomy.md#permitted-range It admits or bounds no anatomical value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority It is a query supplied by the eye, not an input through which a caller shapes a face.
   */
  globe: (x: number, y: number) => number;
}
