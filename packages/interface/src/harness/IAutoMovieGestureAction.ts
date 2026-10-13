import { AutoMovieGestureKind } from "./AutoMovieGestureKind";
import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * A whole-body gesture from the engine's motion vocabulary. Pick the closest
 * `kind`; refine with `note`. The engine owns the keyframes; keep this intent,
 * not animation.
 *
 * `point` and `strike` require an `at` that resolves to a point and always
 * solve the right arm toward it; `performShot` refuses them when that arm
 * cannot bend. An `"auto"` gesture lasts 1 s. {@link AutoMovieGestureKind}
 * lists the kinds the reference synthesizer leaves without motion.
 *
 * @evidence contracts/common.md#principled-implementation Dispatches on `kind`: `point` and `strike` solve the right arm toward `at` with two-bone IK (`reachPose`), the other animated kinds play fixed keyframe shapes from `gestureMotion` scaled to `duration`, and `jump` adds root translation.
 * @evidence contracts/common.md#clear-and-simple-design Adds the family, an optional note and an optional target to the shared base; per-kind region defaults live in the engine's `REGION_BY_GESTURE` table rather than on the action.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the right arm is ever used for `point` and `strike`, a fixed choice the synthesizer documents; `note`, and `at` outside those two kinds, are read by no engine path.
 * @evidence contracts/common.md#meaningful-documentation States which kinds need `at`, which arm they use, the refusals, that other kinds ignore `at` and `note`, the default length, and where the motionless kinds are listed.
 * @author Samchon
 */
export interface IAutoMovieGestureAction extends IAutoMovieActionBase {
  /** Selects a gesture as the action family. */
  verb: "gesture";

  /** Gesture family named by the authored action. */
  kind: AutoMovieGestureKind;

  /**
   * Specialise the family ("jab" for `strike`, "roundhouse" for `kick`) or
   * describe a `custom` one. Read by people and host synthesizers; the engine
   * ignores it.
   */
  note?: string;

  /**
   * What the gesture is directed at (a strike's target, a wave's recipient).
   * Required for `point` and `strike`; every other kind ignores it.
   */
  at?: IAutoMovieActionTarget;
}
