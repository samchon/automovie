import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieProductionAcousticResponse } from "./IAutoMovieProductionAcousticResponse";
import { IAutoMovieShotEventContract } from "./IAutoMovieShotEventContract";

/**
 * One semantic event lowered from the compiled film edit into audible space.
 *
 * @evidence contracts/common.md#principled-implementation Sound planning maps current shot event samples into film occurrences, samples camera placement and models population variance from uniform axis-aligned boxes before sqrt(memberCount) gain and optional propagation. It copies acousticProfile without deriving event responses; a consumer supplies those separately.
 * @evidence contracts/common.md#clear-and-simple-design One event carries authoritative timing, spatial mass and bounded acoustic results so the pure mixer needs no scene traversal or policy selection while rendering PCM.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Population spread is a box-based source approximation rather than measured individual positions. Selecting an acoustic profile does not populate or require acousticResponse in the standalone planner or mixer; callers own any stronger response-admission policy.
 * @evidence contracts/common.md#meaningful-documentation Defines occurrence identity, film frame and seconds, world-meter source/listener positions, RMS spread, incoherent density, stereo pan and optional propagation and room-response effects.
 * @author Samchon
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
   * How many individual sources the event's subjects contain: one for a scene node, the member count for a formation or an instance set, summed over every subject the event names.
   *
   * This is what makes a mass sound like a mass. A group used to contribute exactly one emitter no matter how many stood in it, so three people and a hundred thousand were acoustically identical.
   */
  memberCount: number;

  /**
   * Square root of the modeled source variance in metres about emitter. Formations and instance sets use a uniform-box approximation from compiled position bounds, rather than measuring every member.
   *
   * Zero for a single node. A crowd has a radius, and a source with a radius is not a point: it cannot be all in one place in the stereo field, and the listener is not the same distance from all of it.
   */
  spreadRadiusMeters: number;

  /**
   * Level factor for `memberCount` mutually uncorrelated sources, `sqrt(memberCount)`.
   *
   * The model assumes equal-level uncorrelated sources, whose powers add: `p_total^2 = N * p_single^2`, giving amplitude gain `sqrt(N)` and a `10*log10(N)` dB increase. It does not measure actual source correlation; coherent sources would require a different law.
   */
  densityGain: number;

  /**
   * Camera-relative stereo position from -1 (left) through 1 (right), narrowed by the source's own angular width: `local.x / hypot(distanceMeters, spreadRadiusMeters)`.
   *
   * Modeled spread reduces the centroid's pan magnitude. As spread becomes small relative to distance, this formula approaches the point-source result; it does not measure each member's stereo contribution.
   */
  pan: number;

  /**
   * Distance-derived dry gain from zero through one, taken at the root-mean-square source/listener distance `hypot(distanceMeters, spreadRadiusMeters)` rather than at the centroid alone.
   *
   * The declared dry gain law is evaluated at the modeled RMS distance. Population variance comes from uniform-box approximations of compiled position bounds, so this calculation does not measure individual member distances or their combined physical attenuation.
   */
  attenuation: number;

  /**
   * Direct-path propagation result when the production selected a profile. Omitted only on the legacy dry path.
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
   * Consumer-supplied room-path result. The planner does not derive it, and the mixer uses the dry event when it is absent; acousticProfile alone does not establish a response or enforce a complete response population.
   */
  acousticResponse?: IAutoMovieProductionAcousticResponse;

  /** Stable unsigned 32-bit procedural seed. */
  seed: number;
}
