/**
 * A compact ellipsoidal colour envelope in a caller's reference coordinates.
 * Centre and radii use the same length unit. The field changes reflectance,
 * never geometry, illumination or a biological pigment concentration.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-skin-colour Expresses regional colour through position, extent, RGB and strength instead of a painted image.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-skin-colour Supplies a reference-space envelope for deterministic colour transport.
 * @author Samchon
 */
export interface IPortraitColourField {
  /** Unique nonblank region identity; lexical order fixes composition. */
  name: string;
  /** Centre in the caller's immutable reference frame. */
  center: [number, number, number];
  /** Positive support radii in that same coordinate unit. */
  radius: [number, number, number];
  /** Linear RGB multipliers in [0,1]. White is the identity. */
  gain: [number, number, number];
  /** Envelope strength in [0,1]. Zero is the identity. */
  strength: number;
}
