/**
 * Linear-RGB pigment endpoints for one iris, independent of aperture geometry.
 * Base is the limbal/dark-band albedo. Variation is a signed RGB increment at
 * the other end of the eight-band palette; zero gives uniform pigmentation.
 * Both endpoints must stay in [0,1]. This is an authored optical approximation,
 * not recovered reflectance or a photograph projected onto the eye.
 *
 * @evidence contracts/common.md#principled-implementation Two RGB triples, a base and a signed increment, define eight bands by linear interpolation, and because both endpoints are constrained to [0,1] every band is, so the record is closed under its own palette law.
 * @evidence contracts/common.md#clear-and-simple-design A two-field record whose palette and validation live in `createPortraitIrisMaterials`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type carries no mechanism and no field names a subject or fixture.
 * @evidence contracts/common.md#meaningful-documentation Each field states its length, interval and role, and the record says it is an authored optical approximation and not recovered reflectance.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record colours an iris and defines no part or group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The values are dimensionless linear-RGB reflectances and carry no length, angle or frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record owns no part and displays nothing; the iris it colours is observed under the pigment rule and the eye builder.
 *
 * @author Samchon
 */
export interface IPortraitIrisPigment {
  /** Exactly three linear RGB reflectances at progress zero, each in [0,1]. */
  base: readonly number[];

  /** Exactly three signed increments; base+variation must also stay in [0,1]. */
  variation: readonly number[];
}
