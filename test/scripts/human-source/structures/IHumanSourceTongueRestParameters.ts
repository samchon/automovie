/** Offline source authoring variables, not personal sculpt or clinical ranges. */
export interface IHumanSourceTongueRestParameters {
  /** Positive source transverse scale; one preserves the original width. */
  widthScale: number;
  /** Posterior displacement of the free tip, fading to the fixed root, metres. */
  tipRetractionMetres: number;
  /** Additional mid-dorsal height above the immutable source, metres. */
  dorsumRiseMetres: number;
}
