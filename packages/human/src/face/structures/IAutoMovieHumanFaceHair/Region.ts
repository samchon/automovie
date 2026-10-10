/**
 * Axis-aligned Gaussian envelope in the neutral head's metre coordinates.
 * Root sampling and parting use the same arithmetic but independent inputs.
 * It stores six field coefficients, never a root list or curve samples.
 *
 * @author Samchon
 */
export interface Region {
  /** Finite centre coordinates in neutral head metres. */
  center: [number, number, number];

  /** Positive metre-space standard deviations, not a hard clipping radius. */
  spread: [number, number, number];
}
