import type { AutoMovieGestureKind } from "./AutoMovieGestureKind";
import type { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import type { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

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
