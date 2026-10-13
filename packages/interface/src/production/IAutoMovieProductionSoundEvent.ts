import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieProductionAcousticResponse } from "./IAutoMovieProductionAcousticResponse";
import { IAutoMovieShotEventContract } from "./IAutoMovieShotEventContract";

/**
 * One semantic event lowered from the compiled film edit into audible space.
 */
export interface IAutoMovieProductionSoundEvent {
  /** Stable occurrence id, including the owning film segment. */
  id: string;

  /** Compiled shot that owns the event. */
  shot: string;

  /** Authoritative event-contract id. */
  event: string;

  /** Procedural sound family selected by the event contract. */
  kind: IAutoMovieShotEventContract["kind"];

  /** Exact film-global event frame. */
  frame: number;

  /** Exact frame-derived film time. */
  timeSeconds: number;

  /** Sampled world-space source point. */
  emitter: IAutoMovieVector3;

  /** Sampled world-space camera point. */
  listener: IAutoMovieVector3;

  /** Euclidean distance in meters from the listener to `emitter`. */
  distanceMeters: number;

  /**
   * How many individual sources the event's subjects contain: one for a scene
   * node, the member count for a formation or an instance set, summed over
   * every subject the event names.
   *
   * This is what makes a mass sound like a mass. A group used to contribute
   * exactly one emitter no matter how many stood in it, so three people and a
   * hundred thousand were acoustically identical.
   */
  memberCount: number;

  /**
   * Root-mean-square distance in meters from `emitter` to those members: the
   * source's own size.
   *
   * Zero for a single node. A crowd has a radius, and a source with a radius is
   * not a point: it cannot be all in one place in the stereo field, and the
   * listener is not the same distance from all of it.
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
   */
  attenuation: number;

  /**
   * Direct-path propagation result when the production selected a profile.
   * Omitted only on the legacy dry path.
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
   */
  acousticResponse?: IAutoMovieProductionAcousticResponse;

  /** Stable unsigned 32-bit procedural seed. */
  seed: number;
}
