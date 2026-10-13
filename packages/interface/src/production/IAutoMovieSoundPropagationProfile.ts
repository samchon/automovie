/**
 * Production-selected bounded direct-path propagation model.
 *
 * AutoMovie supplies the calculation, not atmospheric content. Every physical
 * scalar and the cut-boundary decision are declared by the production.
 *
 * @author Samchon
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

    /** Finite non-negative softening coefficient. */
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
