import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { gesture } from "../everyday/gesture";
import { HumanActionRow } from "../law/HumanActionRow";

/**
 * The gestures as rows (#3361): each kind of `gesture` (emblems, self-adaptors and displays, Ekman and Friesen 1969) under a name of its own, with every other axis of the law open (the side, the target, the count, the hold, the effort), so a production composes a gesture by its name on any base and carrier the law admits.
 *
 * Each row writes no motion: its law plans it, so it fits any body, refuses and is checked as the law is, and its draws are keyed by its own name. The rows over the arm's phrases themselves are `HumanUpperRows`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row fixes and what it leaves open.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped law (`HumanActionRow`), data over a law that already fits the body and refuses.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One row per value of the law's closed union and nothing else.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own or restates a value of the law.
 */
export namespace HumanGestureRows {
  /** `gesture` of kind `wave`. */
  export const gestureWave: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureWave"]
  > = HumanActionRow.of("gestureWave", gesture, {
    kind: "wave",
  });

  /** `gesture` of kind `raiseHand`. */
  export const gestureRaiseHand: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureRaiseHand"]
  > = HumanActionRow.of("gestureRaiseHand", gesture, { kind: "raiseHand" });

  /** `gesture` of kind `cheer`. */
  export const gestureCheer: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureCheer"]
  > = HumanActionRow.of("gestureCheer", gesture, {
    kind: "cheer",
  });

  /** `gesture` of kind `stopPalm`. */
  export const gestureStopPalm: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureStopPalm"]
  > = HumanActionRow.of("gestureStopPalm", gesture, {
    kind: "stopPalm",
  });

  /** `gesture` of kind `point`. */
  export const gesturePoint: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gesturePoint"]
  > = HumanActionRow.of("gesturePoint", gesture, {
    kind: "point",
  });

  /** `gesture` of kind `palmsUp`. */
  export const gesturePalmsUp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gesturePalmsUp"]
  > = HumanActionRow.of("gesturePalmsUp", gesture, {
    kind: "palmsUp",
  });

  /** `gesture` of kind `beckon`. */
  export const gestureBeckon: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureBeckon"]
  > = HumanActionRow.of("gestureBeckon", gesture, {
    kind: "beckon",
  });

  /** `gesture` of kind `clap`. */
  export const gestureClap: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureClap"]
  > = HumanActionRow.of("gestureClap", gesture, {
    kind: "clap",
  });

  /** `gesture` of kind `rubHands`. */
  export const gestureRubHands: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureRubHands"]
  > = HumanActionRow.of("gestureRubHands", gesture, {
    kind: "rubHands",
  });

  /** `gesture` of kind `palmsTogether`. */
  export const gesturePalmsTogether: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gesturePalmsTogether"]
  > = HumanActionRow.of("gesturePalmsTogether", gesture, {
    kind: "palmsTogether",
  });

  /** `gesture` of kind `thumbsDown`. */
  export const gestureThumbsDown: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureThumbsDown"]
  > = HumanActionRow.of("gestureThumbsDown", gesture, { kind: "thumbsDown" });

  /** `gesture` of kind `touchFace`. */
  export const gestureTouchFace: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureTouchFace"]
  > = HumanActionRow.of("gestureTouchFace", gesture, { kind: "touchFace" });

  /** `gesture` of kind `pushGlasses`. */
  export const gesturePushGlasses: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gesturePushGlasses"]
  > = HumanActionRow.of("gesturePushGlasses", gesture, { kind: "pushGlasses" });

  /** `gesture` of kind `scratchHead`. */
  export const gestureScratchHead: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureScratchHead"]
  > = HumanActionRow.of("gestureScratchHead", gesture, { kind: "scratchHead" });

  /** `gesture` of kind `shrug`. */
  export const gestureShrug: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureShrug"]
  > = HumanActionRow.of("gestureShrug", gesture, {
    kind: "shrug",
  });

  /** `gesture` of kind `nod`. */
  export const gestureNod: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureNod"]
  > = HumanActionRow.of("gestureNod", gesture, {
    kind: "nod",
  });

  /** `gesture` of kind `shakeHead`. */
  export const gestureShakeHead: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureShakeHead"]
  > = HumanActionRow.of("gestureShakeHead", gesture, { kind: "shakeHead" });

  /** `gesture` of kind `bow`. */
  export const gestureBow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureBow"]
  > = HumanActionRow.of("gestureBow", gesture, {
    kind: "bow",
  });

  /** `gesture` of kind `chinLift`. */
  export const gestureChinLift: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureChinLift"]
  > = HumanActionRow.of("gestureChinLift", gesture, {
    kind: "chinLift",
  });

  /** `gesture` of kind `squareShoulders`. */
  export const gestureSquareShoulders: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureSquareShoulders"]
  > = HumanActionRow.of("gestureSquareShoulders", gesture, {
    kind: "squareShoulders",
  });

  /** `gesture` of kind `slump`. */
  export const gestureSlump: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureSlump"]
  > = HumanActionRow.of("gestureSlump", gesture, {
    kind: "slump",
  });
}
