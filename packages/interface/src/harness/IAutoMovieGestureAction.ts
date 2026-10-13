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
