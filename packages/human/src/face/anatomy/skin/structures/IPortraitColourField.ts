/**
 * A compact ellipsoidal colour envelope in a caller's reference coordinates.
 * Centre and radii use the same length unit. The field changes reflectance,
 * never geometry, illumination or a biological pigment concentration.
 *
 * @evidence contracts/common.md#principled-implementation A field is a unique name, an ellipsoid centre and radii, linear RGB gains and a strength, which is all the compact kernel needs; it changes reflectance only, never geometry or illumination.
 * @evidence contracts/common.md#clear-and-simple-design Four fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitColourField carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States the units, the identity value of gain and strength, and that it is not a biological pigment concentration.
 * @evidence contracts/modeling.md#spatial-conventions Centre and radii share the caller's coordinate unit and the gains are linear RGB multipliers, stated on the members.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitColourField is a declaration and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitColourField carries no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitColourField decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitColourField constructs no surface; it describes data only.
 * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitColourField is a declaration and displays nothing itself; the parts built from it are observed by their owners.
 * @evidenceExclude contracts/anatomy.md#parametric-authority IPortraitColourField defines no input through which a caller shapes a human form.
 * @author Samchon
 */
export interface IPortraitColourField {
  /** Unique nonblank region identity; lexical order fixes composition. */
  name: string;
  /** Centre in the caller's immutable reference frame. */
  center: [number, number, number];
  /** Positive support radii in that same coordinate unit. */
  radius: [number, number, number];
  /**
   * Finite nonnegative linear RGB multipliers; white is the identity.
   * Values above one lighten, subject to the consumer's albedo admission.
   */
  gain: [number, number, number];
  /** Envelope strength in [0,1]. Zero is the identity. */
  strength: number;
}
