import { AutoMovieGestureKind } from "./AutoMovieGestureKind";
import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * A whole-body gesture from the engine's motion vocabulary. Pick the closest
 * `kind`; refine with `note`. The engine owns the keyframes; keep this intent,
 * not animation.
 */
export interface IAutoMovieGestureAction extends IAutoMovieActionBase {
  /** Selects a gesture as the action family. */
  verb: "gesture";

  /** Gesture family named by the authored action. */
  kind: AutoMovieGestureKind;

  /**
   * Specialise the family ("jab" for `strike`, "roundhouse" for `kick`) or
   * describe a `custom` one.
   */
  note?: string;

  /**
   * What the gesture is directed at (a strike's target, a wave's recipient).
   */
  at?: IAutoMovieActionTarget;
}
