import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieShotEventContract } from "./IAutoMovieShotEventContract";
import { IAutoMovieProductionAcousticResponse } from "./IAutoMovieProductionAcousticResponse";

/**
 * One semantic event lowered from the compiled film edit into audible space.
 *
 * @evidence requirements/sound/event-cues-and-timing.md#sound-event-derived-timing Exposes `IAutoMovieProductionSoundEvent` as the portable data boundary for the sound event derived timing requirement.
 * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-kind-and-event-timing Types `IAutoMovieProductionSoundEvent` for the sound cue kind and event timing system contract.
 */
export interface IAutoMovieProductionSoundEvent {
  /**
   * Stable occurrence id, including the owning film segment.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-event-derived-timing Exposes `id` as the portable data boundary for the sound event derived timing requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-kind-and-event-timing Types `id` for the sound cue kind and event timing system contract.
   */
  id: string;
  /**
   * Compiled shot that owns the event.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-event-derived-timing Exposes `shot` as the portable data boundary for the sound event derived timing requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-kind-and-event-timing Types `shot` for the sound cue kind and event timing system contract.
   */
  shot: string;
  /**
   * Authoritative event-contract id.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-event-derived-timing Exposes `event` as the portable data boundary for the sound event derived timing requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-kind-and-event-timing Types `event` for the sound cue kind and event timing system contract.
   */
  event: string;
  /**
   * Procedural sound family selected by the event contract.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-event-derived-timing Exposes `kind` as the portable data boundary for the sound event derived timing requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-kind-and-event-timing Types `kind` for the sound cue kind and event timing system contract.
   */
  kind: IAutoMovieShotEventContract["kind"];
  /**
   * Exact film-global event frame.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-event-derived-timing Exposes `frame` as the portable data boundary for the sound event derived timing requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-kind-and-event-timing Types `frame` for the sound cue kind and event timing system contract.
   */
  frame: number;
  /**
   * Exact frame-derived film time.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-event-derived-timing Exposes `timeSeconds` as the portable data boundary for the sound event derived timing requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-kind-and-event-timing Types `timeSeconds` for the sound cue kind and event timing system contract.
   */
  timeSeconds: number;
  /**
   * Sampled world-space source point.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-event-derived-timing Exposes `emitter` as the portable data boundary for the sound event derived timing requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-kind-and-event-timing Types `emitter` for the sound cue kind and event timing system contract.
   */
  emitter: IAutoMovieVector3;
  /**
   * Sampled world-space camera point.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-event-derived-timing Exposes `listener` as the portable data boundary for the sound event derived timing requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-kind-and-event-timing Types `listener` for the sound cue kind and event timing system contract.
   */
  listener: IAutoMovieVector3;
  /**
   * Euclidean distance in meters from the listener to `emitter`.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-event-derived-timing Exposes `distanceMeters` as the portable data boundary for the sound event derived timing requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-kind-and-event-timing Types `distanceMeters` for the sound cue kind and event timing system contract.
   */
  distanceMeters: number;
  /**
   * How many individual sources the event's subjects contain: one for a scene
   * node, the member count for a formation or an instance set, summed over
   * every subject the event names.
   *
   * This is what makes a mass sound like a mass. A group used to contribute
   * exactly one emitter no matter how many stood in it, so three people and a
   * hundred thousand were acoustically identical.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-event-derived-timing Exposes `memberCount` as the portable data boundary for the sound event derived timing requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-kind-and-event-timing Types `memberCount` for the sound cue kind and event timing system contract.
   */
  memberCount: number;
  /**
   * Root-mean-square distance in meters from `emitter` to those members: the
   * source's own size.
   *
   * Zero for a single node. A crowd has a radius, and a source with a radius is
   * not a point: it cannot be all in one place in the stereo field, and the
   * listener is not the same distance from all of it.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-event-derived-timing Exposes `spreadRadiusMeters` as the portable data boundary for the sound event derived timing requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-kind-and-event-timing Types `spreadRadiusMeters` for the sound cue kind and event timing system contract.
   */
  spreadRadiusMeters: number;
  /**
   * Level factor for `memberCount` mutually uncorrelated sources,
   * `sqrt(memberCount)`.
   *
   * Independent sources add in POWER, not in amplitude, because their cross
   * terms average to zero over time: `p_total^2 = N * p_single^2`, so the
   * amplitude gain is `sqrt(N)` and the level rises `10*log10(N)` dB per the
   * standard incoherent-summation result (coherent, perfectly in-phase sources
   * would instead give `N` and `20*log10(N)` dB, which no crowd is). Ten voices
   * are 10 dB over one, a hundred are 20 dB over one.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-event-derived-timing Exposes `densityGain` as the portable data boundary for the sound event derived timing requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-kind-and-event-timing Types `densityGain` for the sound cue kind and event timing system contract.
   */
  densityGain: number;
  /**
   * Camera-relative stereo position from -1 (left) through 1 (right), narrowed
   * by the source's own angular width: `local.x / hypot(distanceMeters,
   * spreadRadiusMeters)`.
   *
   * A wide crowd close to the listener occupies a span of the stereo field
   * rather than a point in it, and its energy-weighted image sits nearer the
   * center than its centroid's direction alone would put it; a distant one has
   * no width left to speak of and pans exactly as a point source does.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-event-derived-timing Exposes `pan` as the portable data boundary for the sound event derived timing requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-kind-and-event-timing Types `pan` for the sound cue kind and event timing system contract.
   */
  pan: number;
  /**
   * Distance-derived dry gain from zero through one, taken at the
   * root-mean-square source/listener distance `hypot(distanceMeters,
   * spreadRadiusMeters)` rather than at the centroid alone.
   *
   * That substitution is an identity, not a fudge: for members distributed with
   * RMS radius `a` about a centroid at distance `d`, the mean squared
   * listener-to-member distance is exactly `d^2 + a^2`. It is what keeps a
   * sprawling crowd underfoot from attenuating as though every member stood at
   * one point in its middle.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-event-derived-timing Exposes `attenuation` as the portable data boundary for the sound event derived timing requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-kind-and-event-timing Types `attenuation` for the sound cue kind and event timing system contract.
   */
  attenuation: number;
  /**
   * Direct-path propagation result when the production selected a profile.
   * Omitted only on the legacy dry path.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-arrival-time Keeps emission and listener arrival as distinct film times.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-sample-boundary-and-arrival Carries deterministic arrival rounding and the selected cut-boundary outcome.
   */
  propagation?: {
    /** Selected production propagation profile id. */
    profile: string;
    /** Exact film-global listener-arrival frame. */
    arrivalFrame: number;
    /** Exact frame-derived listener-arrival time. */
    arrivalTimeSeconds: number;
    /** Distance gain derived by the declared law. */
    distanceGain: number;
    /** High-frequency linear gain, or null when no spectral model was claimed. */
    highFrequencyGain: number | null;
    /** Applied shot-boundary decision. */
    boundary: "inside-segment" | "carried-across-cut" | "trimmed-at-segment";
  };
  /**
   * Room-path result when the production selected an acoustic profile. Omitted
   * only on the legacy dry path.
   *
   * @evidence requirements/sound/interior-acoustics.md#sound-acoustic-mix-consumption Carries the exact room result selected for this event's mix path.
   * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#acoustic-mix-consumption-and-claim-boundary Distinguishes outdoor, same-room, different-room, unsupported, and not-run outcomes.
   */
  acousticResponse?: IAutoMovieProductionAcousticResponse;
  /**
   * Stable unsigned 32-bit procedural seed.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-event-derived-timing Exposes `seed` as the portable data boundary for the sound event derived timing requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-kind-and-event-timing Types `seed` for the sound cue kind and event timing system contract.
   */
  seed: number;
}
