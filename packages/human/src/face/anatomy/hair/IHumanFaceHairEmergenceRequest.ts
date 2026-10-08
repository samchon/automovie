import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One root's emergence request to `humanFaceHairEmergence`.
 *
 * `normal` is the root's surface normal and `field` the authored growth field
 * there, both in the neutral head frame. `degrees` is the exit elevation above
 * the tangent plane, supplied as an admitted authored target or chosen from
 * the legacy scalp interval; the field's tangential part fixes the azimuth.
 *
 * @evidence contracts/common.md#principled-implementation Supplies exactly the normal, field and elevation the exit direction is built from.
 * @evidence contracts/common.md#clear-and-simple-design Named members replace an anonymous parameter object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no subject switch or modified target; elevation retains authored admission or the legacy scalp interval.
 * @evidence contracts/common.md#meaningful-documentation States frames and where the elevation comes from.
 * @evidence contracts/modeling.md#spatial-conventions Normal and field are neutral head-frame directions; the elevation is degrees.
 * @evidenceExclude contracts/modeling.md#parameter-channels The field is the existing authored hairstyle field.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The legacy range owner states scalp citations; authored targets carry no clinical normal claim.
 * @evidenceExclude contracts/anatomy.md#permitted-range Layer admission or the legacy scalp interval bounds the supplied elevation.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived inputs and the authored field, not a personal control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairEmergenceRequest {
  /** Root surface normal. */
  normal: IAutoMovieVector3;

  /** Authored growth field at the root. */
  field: IAutoMovieVector3;

  /** Exit elevation above the tangent plane, in degrees. */
  degrees: number;
}
