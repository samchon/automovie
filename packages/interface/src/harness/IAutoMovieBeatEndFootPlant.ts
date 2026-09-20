import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * One stance plant carried across a beat boundary: where a foot stood on the
 * ground when the beat ended, as the ground-IK pass pinned it.
 *
 * Mirrors the engine's ground-IK plant output at the interface level so the
 * next beat can keep a planted foot exactly where the previous beat left it
 * instead of letting the first stride re-derive (and shift) the contact.
 *
 * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `IAutoMovieBeatEndFootPlant` as the portable data boundary for the story beat observation plan requirement.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `IAutoMovieBeatEndFootPlant` for the narrative intent beat observation boundary system contract.
 * @author Samchon
 */
export interface IAutoMovieBeatEndFootPlant {
  /**
   * The planted foot bone.
   *
   * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `foot` as the portable data boundary for the story beat observation plan requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `foot` for the narrative intent beat observation boundary system contract.
   */
  foot: AutoMovieHumanoidBone;

  /**
   * Inclusive stance-run start, seconds on the ended beat's local clock.
   *
   * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `start` as the portable data boundary for the story beat observation plan requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `start` for the narrative intent beat observation boundary system contract.
   */
  start: number;

  /**
   * Inclusive stance-run end, seconds on the ended beat's local clock.
   *
   * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `end` as the portable data boundary for the story beat observation plan requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `end` for the narrative intent beat observation boundary system contract.
   */
  end: number;

  /**
   * Pinned world foot position held across the run (`y` = ground plane).
   *
   * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `position` as the portable data boundary for the story beat observation plan requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `position` for the narrative intent beat observation boundary system contract.
   */
  position: IAutoMovieVector3;
}
