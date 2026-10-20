import { AutoMovieGestureKind } from "./AutoMovieGestureKind";
import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * A gesture from the engine's motion vocabulary. Pick the closest `kind` and
 * refine it with `note`; the engine owns the keyframes, so this states intent,
 * not animation.
 *
 * `point` and `strike` require an `at` that resolves to a point and always
 * solve the right arm toward it, `point` holding the extended arm and `strike`
 * snapping out and back; `performShot` refuses them without a target or when
 * that arm cannot bend. An `"auto"` gesture lasts 1 s.
 * {@link AutoMovieGestureKind} lists which kinds the reference synthesizer
 * leaves without motion and each kind's default region.
 *
 * @evidence contracts/common.md#principled-implementation Reference synthesis routes point/strike through right-arm reachPose and fixed extension/jab envelopes, using a 24 Hz bake plus envelope landmarks when the target is a bone or a live actor frame is supplied. Other kinds use gestureMotion's fixed stops or return null when unsupported; sampled target poses do not prove continuous contact between keys.
 * @evidence contracts/common.md#clear-and-simple-design A kind, an optional note and an optional target are the whole gesture; timing comes from the shared base and the motion from the engine, so no keyframe or joint field is exposed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `reachPose` extends the arm toward a far target but never clamps joint angles into the rig's ranges, so an impossible pose fails the range-of-motion gate instead of being hidden, and `note` is never parsed to choose different motion.
 * @evidence contracts/common.md#meaningful-documentation States the intent-only contract, the arm, target and refusal rules of `point` and `strike`, their hold and snap shapes, the `"auto"` length, and where per-kind coverage is listed; members say who reads `note` and which kinds read `at`.
 */
export interface IAutoMovieGestureAction extends IAutoMovieActionBase {
  /** Selects a gesture as the action family. */
  verb: "gesture";

  /** Gesture family named by the authored action. */
  kind: AutoMovieGestureKind;

  /**
   * Specialises the family ("jab" for `strike`, "roundhouse" for `kick`) or
   * describes a `custom` one. Read by people and host synthesizers; the engine
   * ignores it.
   */
  note?: string;

  /**
   * What the gesture is directed at (a strike's target, a wave's recipient).
   * Required for `point` and `strike`; every other kind ignores it.
   */
  at?: IAutoMovieActionTarget;
}
