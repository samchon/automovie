import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * Turn the head to look at a target.
 *
 * `performShot` refuses a target that does not resolve to one point, which
 * includes the relative kinds and a group naming a formation. The reference
 * synthesizer (`makeActorSynthesizer`) aims from the actor's eye height and,
 * for any id with an actor context, at that actor's eye height rather than its
 * feet, then solves yaw and pitch and spreads them over `neck` and `head` within
 * the rig's declared range when the context carries one. The solve runs once
 * at `start` and is held, unless the target is a bone or the host supplies the
 * actor's moving frame, in which case it is resampled through the span. An
 * `"auto"` gaze lasts 1 s, and with no `region` it drives the head region.
 *
 * @evidence contracts/common.md#principled-implementation aimYawPitch solves eye-to-target yaw/pitch in the actor's facing frame; gazeChainJoints shares each axis head-first then neck, leaving excess on the head for ROM refusal. Single-axis addition assumes aligned rest bases; simultaneous split rotations do not commute, so joint-range agreement is not exact world-gaze alignment. Dynamic output uses a 24 Hz bake with linear inter-key pose interpolation.
 * @evidence contracts/common.md#clear-and-simple-design One target on the shared base is the whole verb; eye height, rig range and the actor's frame come from the actor context, so no angle or joint field is exposed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A target with no point is refused rather than aimed at a default direction, and a prop or camera keeps its own placement as the aim point instead of an invented eye height.
 * @evidence contracts/common.md#meaningful-documentation States the refusals, the eye-to-eye aim and its exception, how the angles are spread, when the gaze is held or resampled, the `"auto"` length and the default region; the member says what the gaze is directed at.
 */
export interface IAutoMovieLookAtAction extends IAutoMovieActionBase {
  /** Selects gaze tracking as the action family. */
  verb: "lookAt";

  /** Target the actor's gaze is directed at; it must resolve to one point. */
  to: IAutoMovieActionTarget;
}
