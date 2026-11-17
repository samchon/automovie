import type { IAutoMovieMotionHumanGesture } from "../everyday/IAutoMovieMotionHumanGesture";

/**
 * Open parameters of the upperGesture lexicon family, keyed by each runtime export name.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The upperGesture family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the upperGesture row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconUpperGestureParams {
  /** `gesture` of kind `wave`. */
  gestureWave: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** `gesture` of kind `raiseHand`. */
  gestureRaiseHand: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** `gesture` of kind `cheer`. */
  gestureCheer: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** `gesture` of kind `stopPalm`. */
  gestureStopPalm: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** `gesture` of kind `point`. */
  gesturePoint: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** `gesture` of kind `palmsUp`. */
  gesturePalmsUp: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** `gesture` of kind `beckon`. */
  gestureBeckon: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** `gesture` of kind `clap`. */
  gestureClap: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** `gesture` of kind `rubHands`. */
  gestureRubHands: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** `gesture` of kind `palmsTogether`. */
  gesturePalmsTogether: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** `gesture` of kind `thumbsDown`. */
  gestureThumbsDown: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** `gesture` of kind `touchFace`. */
  gestureTouchFace: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** `gesture` of kind `pushGlasses`. */
  gesturePushGlasses: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** `gesture` of kind `scratchHead`. */
  gestureScratchHead: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** `gesture` of kind `shrug`. */
  gestureShrug: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** `gesture` of kind `nod`. */
  gestureNod: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** `gesture` of kind `shakeHead`. */
  gestureShakeHead: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** `gesture` of kind `bow`. */
  gestureBow: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** `gesture` of kind `chinLift`. */
  gestureChinLift: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** `gesture` of kind `squareShoulders`. */
  gestureSquareShoulders: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** `gesture` of kind `slump`. */
  gestureSlump: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;
}
