/**
 * Registered millimetre observations and deterministic section-fitting policy.
 * Borrowed arrays must remain stable until the operation returns. Oriented
 * source triangles authorize observations only and never enter saved
 * reconstruction input.
 */
export interface IAutoMovieRecoveryInput {
  /** Source positions already converted once to millimetres. */
  verticesMm: [number, number, number][];

  /**
   * Oriented source faces for observation only, discarded before
   * reconstruction.
   */
  triangles: [number, number, number][];

  /**
   * Sweep direction normalized once; coordinates use its unit projection in
   * millimetres.
   */
  axis: [number, number, number];

  /**
   * Nonparallel frame reference used by the existing right-handed plane-frame
   * operator.
   */
  reference: [number, number, number];

  /**
   * Positive nominal station spacing, millimetres; every resolvable critical
   * bracket is added.
   */
  stepMm: number;

  /** Positive complete-polyline fitting tolerance, millimetres. */
  toleranceMm: number;

  /**
   * Positive cubic tessellation chord tolerance, millimetres; not a surface
   * bound.
   */
  chordToleranceMm: number;

  /** Maximum station population; exhaustion rejects rather than drops cuts. */
  maxSections: number;

  /** Maximum fitted spans per observed curve. */
  maxSpans: number;

  /** Exact equal-position aliases establish incidence without moving positions. */
  exactCoordinateAliases: boolean;

  /**
   * Registered face material-side sign; mixed shells are not repaired by global
   * volume.
   */
  sourceOrientationSign: 1 | -1;

  /** Operational turn angle for automatic C0 corners, degrees in (0,180). */
  cornerDegrees: number;

  /**
   * Explicit PL critical classifier; omission preserves the legacy closed-link
   * policy.
   */
  criticalPolicy?: "legacy-link-cycle-v1" | "boundary-regular-path-v1";
}
