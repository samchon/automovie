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
  /** `gesture` of kind `wave`: three swings of 0.4 s, a stroke of 1.2 s, plus the preparation and retraction; fits a greeting, a farewell, hailing someone ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke). */
  export const gestureWave: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureWave"]
  > = HumanActionRow.of("gestureWave", gesture, {
    kind: "wave",
  });

  /** `gesture` of kind `raiseHand`: one raise of 0.5 s, plus the preparation and retraction; fits asking to speak, volunteering, calling for attention ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke). */
  export const gestureRaiseHand: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureRaiseHand"]
  > = HumanActionRow.of("gestureRaiseHand", gesture, { kind: "raiseHand" });

  /** `gesture` of kind `cheer`: two raises of 0.5 s, a stroke of 1.0 s, both hands, plus the preparation and retraction; fits celebrating, a win, acclaim ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke). */
  export const gestureCheer: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureCheer"]
  > = HumanActionRow.of("gestureCheer", gesture, {
    kind: "cheer",
  });

  /** `gesture` of kind `stopPalm`: one push of 0.35 s, plus the preparation and retraction; fits halting someone, refusing, "wait" ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke). */
  export const gestureStopPalm: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureStopPalm"]
  > = HumanActionRow.of("gestureStopPalm", gesture, {
    kind: "stopPalm",
  });

  /** `gesture` of kind `point`: one point of 0.5 s, plus the preparation and retraction; fits showing a thing or a direction to someone ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke). */
  export const gesturePoint: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gesturePoint"]
  > = HumanActionRow.of("gesturePoint", gesture, {
    kind: "point",
  });

  /** `gesture` of kind `palmsUp`: one opening of 0.6 s, both hands, plus the preparation and retraction; fits "I do not know", an appeal, offering an explanation ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke). */
  export const gesturePalmsUp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gesturePalmsUp"]
  > = HumanActionRow.of("gesturePalmsUp", gesture, {
    kind: "palmsUp",
  });

  /** `gesture` of kind `beckon`: two curls of 0.6 s, a stroke of 1.2 s, plus the preparation and retraction; fits calling someone over ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke). */
  export const gestureBeckon: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureBeckon"]
  > = HumanActionRow.of("gestureBeckon", gesture, {
    kind: "beckon",
  });

  /** `gesture` of kind `clap`: four claps at 4 a second (Neda et al. 2000), a stroke of 1.0 s, both hands, plus the preparation and retraction; fits applause, a cheer, getting attention ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke). */
  export const gestureClap: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureClap"]
  > = HumanActionRow.of("gestureClap", gesture, {
    kind: "clap",
  });

  /** `gesture` of kind `rubHands`: three rubs of 0.35 s, a stroke of 1.05 s, both hands, plus the preparation and retraction; fits anticipation, cold, scheming ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke). */
  export const gestureRubHands: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureRubHands"]
  > = HumanActionRow.of("gestureRubHands", gesture, {
    kind: "rubHands",
  });

  /** `gesture` of kind `palmsTogether`: one close of 0.8 s, both hands, plus the preparation and retraction; fits a plea, a prayer, thanks ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke). */
  export const gesturePalmsTogether: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gesturePalmsTogether"]
  > = HumanActionRow.of("gesturePalmsTogether", gesture, {
    kind: "palmsTogether",
  });

  /** `gesture` of kind `thumbsDown`: a held sign of 0.8 s, plus the preparation and retraction; fits disapproval, rejection ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke). */
  export const gestureThumbsDown: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureThumbsDown"]
  > = HumanActionRow.of("gestureThumbsDown", gesture, { kind: "thumbsDown" });

  /** `gesture` of kind `touchFace`: a held touch of 0.8 s, plus the preparation and retraction; fits thinking, doubt, embarrassment ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke). */
  export const gestureTouchFace: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureTouchFace"]
  > = HumanActionRow.of("gestureTouchFace", gesture, { kind: "touchFace" });

  /** `gesture` of kind `pushGlasses`: one push of 0.3 s, plus the preparation and retraction; fits a nervous or studious beat ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke). */
  export const gesturePushGlasses: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gesturePushGlasses"]
  > = HumanActionRow.of("gesturePushGlasses", gesture, { kind: "pushGlasses" });

  /** `gesture` of kind `scratchHead`: four scratches of 0.25 s, a stroke of 1.0 s, plus the preparation and retraction; fits puzzlement, confusion ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke). */
  export const gestureScratchHead: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureScratchHead"]
  > = HumanActionRow.of("gestureScratchHead", gesture, { kind: "scratchHead" });

  /** `gesture` of kind `shrug`: one shrug of 0.7 s, both shoulders, plus the preparation and retraction; fits indifference, "I do not know" ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke). */
  export const gestureShrug: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureShrug"]
  > = HumanActionRow.of("gestureShrug", gesture, {
    kind: "shrug",
  });

  /** `gesture` of kind `nod`: two nods of 0.5 s, a stroke of 1.0 s, plus the preparation and retraction; fits yes, agreement, acknowledgement ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke). */
  export const gestureNod: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureNod"]
  > = HumanActionRow.of("gestureNod", gesture, {
    kind: "nod",
  });

  /** `gesture` of kind `shakeHead`: three turns of 0.45 s, a stroke of 1.35 s, plus the preparation and retraction; fits no, disagreement, disbelief ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke). */
  export const gestureShakeHead: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureShakeHead"]
  > = HumanActionRow.of("gestureShakeHead", gesture, { kind: "shakeHead" });

  /** `gesture` of kind `bow`: the trunk goes down at about 50 degrees a second, is held 0.95 s at the deepest (Kawabata et al. 2009) and comes up at about 43 degrees a second; 30 degrees when `depth` is absent, plus the preparation and retraction; fits a greeting of respect, thanks, an apology ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke). */
  export const gestureBow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureBow"]
  > = HumanActionRow.of("gestureBow", gesture, {
    kind: "bow",
  });

  /** `gesture` of kind `chinLift`: a held pose of 0.8 s, plus the preparation and retraction; fits pride, defiance ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke). */
  export const gestureChinLift: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureChinLift"]
  > = HumanActionRow.of("gestureChinLift", gesture, {
    kind: "chinLift",
  });

  /** `gesture` of kind `squareShoulders`: a held pose of 0.8 s, plus the preparation and retraction; fits resolve, readiness ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke). */
  export const gestureSquareShoulders: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureSquareShoulders"]
  > = HumanActionRow.of("gestureSquareShoulders", gesture, {
    kind: "squareShoulders",
  });

  /** `gesture` of kind `slump`: a held pose of 0.8 s, plus the preparation and retraction; fits defeat, exhaustion, dejection ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke). */
  export const gestureSlump: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureSlump"]
  > = HumanActionRow.of("gestureSlump", gesture, {
    kind: "slump",
  });
}
