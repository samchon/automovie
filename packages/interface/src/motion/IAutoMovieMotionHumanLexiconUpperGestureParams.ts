import type { IAutoMovieMotionHumanHeadTilt } from "./IAutoMovieMotionHumanHeadTilt";
import type { IAutoMovieMotionHumanGesture } from "./IAutoMovieMotionHumanGesture";

/**
 * Open parameters of the upperGesture lexicon family, keyed by each runtime
 * export name.
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

  /** Incline the head to one side. */
  headTilt: IAutoMovieMotionHumanHeadTilt;
}
