/**
 * An existing transverse crossing tied to the emitted and host incidence.
 * Ordinals retain the instrument's first witness per first triangle; they
 * are not a complete-pair count or a clinical interpretation.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularCrossingWitness {
  /** First emitted sheet triangle ordinal. */
  triangle: number;
  /** Second emitted sheet triangle ordinal. */
  other: number;
  /** Actual source-host triangle of the first emitted triangle. */
  sourceTriangle: number;
  /** Actual source-host triangle of the second emitted triangle. */
  otherSourceTriangle: number;
  /** First emitted triangle's vertex identities. */
  corners: number[];
  /** Second emitted triangle's vertex identities. */
  otherCorners: number[];
}
