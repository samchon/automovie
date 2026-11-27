/**
 * Connected slab support relating before and after section observations.
 * before/after contain ordinals in the corresponding query lists; optional
 * probes use the separate probe-list ordinal space. supported and nullable
 * reason report the observer's topology decision.
 */
export interface IAutoMovieRecoverySlabConnectivityGroup {
  /** Local boundary-support indices at the lower cut. */
  before: number[];

  /** Local boundary-support indices at the upper cut. */
  after: number[];

  /** False identifies an open, ambiguous or unsupported source preimage. */
  supported: boolean;

  /** Null for supported continuation; otherwise a local omission reason. */
  reason: string | null;

  /**
   * Private observation-probe ordinals, present only when requested; never
   * curve indices.
   */
  probes?: number[];
}
