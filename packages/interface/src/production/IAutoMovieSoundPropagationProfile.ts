/**
 * Production-selected bounded direct-path propagation model.
 *
 * AutoMovie supplies the calculation, not atmospheric content. Every physical
 * scalar and the cut-boundary decision are declared by the production.
 *
 * @evidence requirements/sound/spatialization-and-propagation.md#sound-direct-path Makes sound speed, distance gain, and spectral absorption one declared model.
 * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#spatial-direct-path-and-output-mapping Defines the deterministic direct-path inputs without inferring climate or provider state.
 * @author Samchon
 */
export interface IAutoMovieSoundPropagationProfile {
  /**
   * Stable profile identity within the production.
   *
   * @evidence requirements/sound/spatialization-and-propagation.md#sound-direct-path Binds events to one declared propagation model.
   * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#spatial-direct-path-and-output-mapping Identifies the exact calculation inputs.
   */
  id: string;
  /**
   * Finite strictly positive propagation speed in meters per second.
   *
   * @evidence requirements/sound/spatialization-and-propagation.md#sound-direct-path Makes propagation delay production-owned.
   * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#spatial-direct-path-and-output-mapping Supplies arrival-time calculation speed.
   */
  speedOfSoundMetersPerSecond: number;
  /**
   * Declared distance-gain law.
   *
   * @evidence requirements/sound/spatialization-and-propagation.md#sound-direct-path Prevents hidden attenuation defaults.
   * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#spatial-direct-path-and-output-mapping Selects the bounded gain calculation.
   */
  distanceGain: {
    /** Current bounded law, `1 / (1 + coefficient * distance^2)`. */
    kind: "softened-inverse-square-v1";
    /** Finite non-negative softening coefficient. */
    coefficient: number;
  };
  /**
   * Declared spectral treatment; `none` never masquerades as absorption.
   *
   * @evidence requirements/sound/spatialization-and-propagation.md#sound-direct-path Separates omitted spectral physics from modeled attenuation.
   * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#spatial-direct-path-and-output-mapping Makes spectral output conditional on a declared model.
   */
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
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-arrival-time Leaves carry-versus-trim to the production.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-sample-boundary-and-arrival Makes cut-boundary handling deterministic.
   */
  segmentBoundary: "carry-across-cut" | "trim-at-segment";
  /**
   * Non-empty statements of the physical assumptions this profile adopts.
   *
   * @evidence requirements/sound/spatialization-and-propagation.md#sound-direct-path Exposes the bounded model's claim assumptions.
   * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#spatial-direct-path-and-output-mapping Keeps physical interpretation explicit.
   */
  assumptions: string[];
}
