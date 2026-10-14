/**
 * A compact ellipsoidal colour envelope in a caller's reference coordinates.
 * Centre and radii use the same length unit. The field changes reflectance,
 * never geometry, illumination or a biological pigment concentration.
 *
 * @evidence contracts/common.md#principled-implementation A compact ellipsoid defines a reference-coordinate reflectance multiplier; createPortraitColourField admits finite centres, positive radii, nonnegative linear gains and unit strength before composing fields.
 * @evidence contracts/common.md#clear-and-simple-design One record separates identity, support and optical amount; the field producer owns sorting and sampling while its caller supplies the immutable coordinate frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Radii and gains remain declared inputs rather than vertex masks or inferred pigment concentrations; gains above one require the downstream albedo consumer's admission.
 * @evidence contracts/common.md#meaningful-documentation Members state coordinate units, positive support, lexical identity ordering, linear RGB meaning and the zero-strength identity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record implements no sampling; createPortraitColourField owns ellipsoid evaluation and composition costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type schedules no requests; its producer owns the cloned, sorted field population reused by the sampler.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no resource; the sampler owner retains its field snapshot until that sampler is released.
 *
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
