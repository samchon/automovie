/**
 * One control of a narrow connected relief curve. The attachment remains a
 * resident skin vertex, while the offset locates the curve control in the
 * current fitted surface. Adjacent controls are sampled into overlapping
 * fields by the factory; this makes a philtral crest or similar section a
 * continuous authored path rather than a collection of unrelated blobs.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Lets a narrow anatomical crest follow live component attachments.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines one retained skin anchor with a metric offset, support radius and signed displacement along a relief curve.
 */
export interface IPortraitReliefCurvePoint {
  /** Resident skin vertex used to follow component replacement. */
  anchor: number;
  /** XYZ offset from that live attachment, in construction millimetres. */
  offset: [number, number, number];
  /** Positive support radii around this control, in millimetres. */
  radius: [number, number, number];
  /** Signed displacement at this control, in millimetres. */
  displacement: [number, number, number];
}
