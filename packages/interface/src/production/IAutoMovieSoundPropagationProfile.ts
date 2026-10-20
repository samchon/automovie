/**
 * Production-selected bounded direct-path propagation model.
 *
 * The production selects every physical scalar and the cut-boundary decision; the engine applies the declared bounded calculation.
 *
 * @evidence contracts/common.md#principled-implementation Propagation divides effective source/listener distance by declared positive speed, rounds delay once to film frames, applies the softened inverse-square gain and optional decibel-per-meter high-frequency amplitude loss, then honors the selected cut-boundary policy.
 * @evidence contracts/common.md#clear-and-simple-design One production-owned profile groups speed, distance and spectral laws, segment-boundary choice and explicit assumptions while event receipts carry the calculated arrival and gains.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Spectral none returns null rather than claiming zero measured absorption, and arrivals outside the finished film refuse; no atmospheric speed or cut policy is inferred when a profile is absent.
 * @evidence contracts/common.md#meaningful-documentation Defines speed units, exact gain law, non-negative coefficient, optional spectral model units, cut carry/trim behavior and authored physical assumptions.
 */
export interface IAutoMovieSoundPropagationProfile {
  /** Stable profile identity within the production. */
  id: string;

  /** Finite strictly positive propagation speed in meters per second. */
  speedOfSoundMetersPerSecond: number;

  /** Declared distance-gain law. */
  distanceGain: {
    /** Current bounded law, `1 / (1 + coefficient * distance^2)`. */
    kind: "softened-inverse-square-v1";

    /** Finite non-negative softening coefficient in inverse square metres. */
    coefficient: number;
  };

  /** Declared spectral treatment; `none` never masquerades as absorption. */
  spectral:
    | {
        /** No spectral propagation is claimed. */
        kind: "none";
      }
    | {
        /** One bounded broadband high-frequency attenuation stage. */
        kind: "broadband-high-frequency-v1";

        /** Finite non-negative high-frequency loss in dB per meter. */
        absorptionDbPerMeter: number;
      };

  /**
   * Authored edit decision when arrival lies beyond the source shot segment.
   */
  segmentBoundary: "carry-across-cut" | "trim-at-segment";

  /** Non-empty statements of the physical assumptions this profile adopts. */
  assumptions: string[];
}
