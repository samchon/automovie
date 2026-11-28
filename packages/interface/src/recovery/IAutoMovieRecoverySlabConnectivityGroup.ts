/**
 * Boundary loops and probes associated with one clipped source component or
 * unresolved support.
 */
export interface IAutoMovieRecoverySlabConnectivityGroup {
  /** Indices in the lower cut's supplied boundary support array. */
  before: number[];

  /** Indices in the upper cut's supplied boundary support array. */
  after: number[];

  /**
   * Whether the group has usable unique source incidence and no observed
   * disqualifying defect.
   */
  supported: boolean;

  /**
   * Diagnostic for unsupported source connectivity, or null for a supported
   * group.
   */
  reason: string | null;

  /**
   * Optional original positions of private query probes associated with this
   * group.
   */
  probes?: number[];
}
