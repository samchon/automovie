import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { gesture } from "../../everyday/internal/gesture";
import { AutoMovieMotionHumanActionRow } from "../../law/AutoMovieMotionHumanActionRow";
import { HUMAN_GESTURE_BECKON } from "../../next/presets/HUMAN_GESTURE_BECKON";
import { HUMAN_GESTURE_BOW } from "../../next/presets/HUMAN_GESTURE_BOW";
import { HUMAN_GESTURE_CHEER } from "../../next/presets/HUMAN_GESTURE_CHEER";
import { HUMAN_GESTURE_CHIN_LIFT } from "../../next/presets/HUMAN_GESTURE_CHIN_LIFT";
import { HUMAN_GESTURE_CLAP } from "../../next/presets/HUMAN_GESTURE_CLAP";
import { HUMAN_GESTURE_NOD } from "../../next/presets/HUMAN_GESTURE_NOD";
import { HUMAN_GESTURE_PALMS_TOGETHER } from "../../next/presets/HUMAN_GESTURE_PALMS_TOGETHER";
import { HUMAN_GESTURE_PALMS_UP } from "../../next/presets/HUMAN_GESTURE_PALMS_UP";
import { HUMAN_GESTURE_POINT } from "../../next/presets/HUMAN_GESTURE_POINT";
import { HUMAN_GESTURE_PUSH_GLASSES } from "../../next/presets/HUMAN_GESTURE_PUSH_GLASSES";
import { HUMAN_GESTURE_RAISE_HAND } from "../../next/presets/HUMAN_GESTURE_RAISE_HAND";
import { HUMAN_GESTURE_RUB_HANDS } from "../../next/presets/HUMAN_GESTURE_RUB_HANDS";
import { HUMAN_GESTURE_SCRATCH_HEAD } from "../../next/presets/HUMAN_GESTURE_SCRATCH_HEAD";
import { HUMAN_GESTURE_SHAKE_HEAD } from "../../next/presets/HUMAN_GESTURE_SHAKE_HEAD";
import { HUMAN_GESTURE_SHRUG } from "../../next/presets/HUMAN_GESTURE_SHRUG";
import { HUMAN_GESTURE_SLUMP } from "../../next/presets/HUMAN_GESTURE_SLUMP";
import { HUMAN_GESTURE_SQUARE_SHOULDERS } from "../../next/presets/HUMAN_GESTURE_SQUARE_SHOULDERS";
import { HUMAN_GESTURE_STOP_PALM } from "../../next/presets/HUMAN_GESTURE_STOP_PALM";
import { HUMAN_GESTURE_THUMBS_DOWN } from "../../next/presets/HUMAN_GESTURE_THUMBS_DOWN";
import { HUMAN_GESTURE_TOUCH_FACE } from "../../next/presets/HUMAN_GESTURE_TOUCH_FACE";
import { HUMAN_GESTURE_WAVE } from "../../next/presets/HUMAN_GESTURE_WAVE";

/**
 * The gestures as rows: each kind of `gesture` (emblems, self-adaptors and
 * displays, Ekman and Friesen 1969) under a name of its own, with every other
 * axis of the law open (the side, the target, the count, the hold, the effort),
 * so a production composes a gesture by its name on any base and carrier the
 * law admits.
 *
 * Each row writes no motion: its law plans it, so it fits any body, refuses and
 * is checked as the law is, and its draws are keyed by its own name. The rows
 * over the arm's phrases themselves are `HumanUpperRows`.
 */
export namespace HumanGestureRows {
  /**
   * `gesture` of kind `wave`: three swings of 0.4 s, a stroke of 1.2 s, plus
   * the preparation and retraction; fits a greeting, a farewell, hailing
   * someone ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const gestureWave: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureWave"]
  > = AutoMovieMotionHumanActionRow.of(
    "gestureWave",
    gesture,
    HUMAN_GESTURE_WAVE,
  );

  /**
   * `gesture` of kind `raiseHand`: one raise of 0.5 s, plus the preparation and
   * retraction; fits asking to speak, volunteering, calling for attention
   * ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const gestureRaiseHand: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureRaiseHand"]
  > = AutoMovieMotionHumanActionRow.of(
    "gestureRaiseHand",
    gesture,
    HUMAN_GESTURE_RAISE_HAND,
  );

  /**
   * `gesture` of kind `cheer`: two raises of 0.5 s, a stroke of 1.0 s, both
   * hands, plus the preparation and retraction; fits celebrating, a win,
   * acclaim ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const gestureCheer: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureCheer"]
  > = AutoMovieMotionHumanActionRow.of(
    "gestureCheer",
    gesture,
    HUMAN_GESTURE_CHEER,
  );

  /**
   * `gesture` of kind `stopPalm`: one push of 0.35 s, plus the preparation and
   * retraction; fits halting someone, refusing, "wait"
   * ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const gestureStopPalm: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureStopPalm"]
  > = AutoMovieMotionHumanActionRow.of(
    "gestureStopPalm",
    gesture,
    HUMAN_GESTURE_STOP_PALM,
  );

  /**
   * `gesture` of kind `point`: one point of 0.5 s, plus the preparation and
   * retraction; fits showing a thing or a direction to someone
   * ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const gesturePoint: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gesturePoint"]
  > = AutoMovieMotionHumanActionRow.of(
    "gesturePoint",
    gesture,
    HUMAN_GESTURE_POINT,
  );

  /**
   * `gesture` of kind `palmsUp`: one opening of 0.6 s, both hands, plus the
   * preparation and retraction; fits "I do not know", an appeal, offering an
   * explanation ({@link gestureStrokeTables.RHYTHM}, `count` repeats the
   * stroke).
   */
  export const gesturePalmsUp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gesturePalmsUp"]
  > = AutoMovieMotionHumanActionRow.of(
    "gesturePalmsUp",
    gesture,
    HUMAN_GESTURE_PALMS_UP,
  );

  /**
   * `gesture` of kind `beckon`: two curls of 0.6 s, a stroke of 1.2 s, plus the
   * preparation and retraction; fits calling someone over
   * ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const gestureBeckon: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureBeckon"]
  > = AutoMovieMotionHumanActionRow.of(
    "gestureBeckon",
    gesture,
    HUMAN_GESTURE_BECKON,
  );

  /**
   * `gesture` of kind `clap`: four claps at 4 a second (Neda et al. 2000), a
   * stroke of 1.0 s, both hands, plus the preparation and retraction; fits
   * applause, a cheer, getting attention ({@link gestureStrokeTables.RHYTHM},
   * `count` repeats the stroke).
   */
  export const gestureClap: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureClap"]
  > = AutoMovieMotionHumanActionRow.of(
    "gestureClap",
    gesture,
    HUMAN_GESTURE_CLAP,
  );

  /**
   * `gesture` of kind `rubHands`: three rubs of 0.35 s, a stroke of 1.05 s,
   * both hands, plus the preparation and retraction; fits anticipation, cold,
   * scheming ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const gestureRubHands: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureRubHands"]
  > = AutoMovieMotionHumanActionRow.of(
    "gestureRubHands",
    gesture,
    HUMAN_GESTURE_RUB_HANDS,
  );

  /**
   * `gesture` of kind `palmsTogether`: one close of 0.8 s, both hands, plus the
   * preparation and retraction; fits a plea, a prayer, thanks
   * ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const gesturePalmsTogether: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gesturePalmsTogether"]
  > = AutoMovieMotionHumanActionRow.of(
    "gesturePalmsTogether",
    gesture,
    HUMAN_GESTURE_PALMS_TOGETHER,
  );

  /**
   * `gesture` of kind `thumbsDown`: a held sign of 0.8 s, plus the preparation
   * and retraction; fits disapproval, rejection
   * ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const gestureThumbsDown: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureThumbsDown"]
  > = AutoMovieMotionHumanActionRow.of(
    "gestureThumbsDown",
    gesture,
    HUMAN_GESTURE_THUMBS_DOWN,
  );

  /**
   * `gesture` of kind `touchFace`: a held touch of 0.8 s, plus the preparation
   * and retraction; fits thinking, doubt, embarrassment
   * ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const gestureTouchFace: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureTouchFace"]
  > = AutoMovieMotionHumanActionRow.of(
    "gestureTouchFace",
    gesture,
    HUMAN_GESTURE_TOUCH_FACE,
  );

  /**
   * `gesture` of kind `pushGlasses`: one push of 0.3 s, plus the preparation
   * and retraction; fits a nervous or studious beat
   * ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const gesturePushGlasses: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gesturePushGlasses"]
  > = AutoMovieMotionHumanActionRow.of(
    "gesturePushGlasses",
    gesture,
    HUMAN_GESTURE_PUSH_GLASSES,
  );

  /**
   * `gesture` of kind `scratchHead`: four scratches of 0.25 s, a stroke of 1.0
   * s, plus the preparation and retraction; fits puzzlement, confusion
   * ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const gestureScratchHead: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureScratchHead"]
  > = AutoMovieMotionHumanActionRow.of(
    "gestureScratchHead",
    gesture,
    HUMAN_GESTURE_SCRATCH_HEAD,
  );

  /**
   * `gesture` of kind `shrug`: one shrug of 0.7 s, both shoulders, plus the
   * preparation and retraction; fits indifference, "I do not know"
   * ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const gestureShrug: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureShrug"]
  > = AutoMovieMotionHumanActionRow.of(
    "gestureShrug",
    gesture,
    HUMAN_GESTURE_SHRUG,
  );

  /**
   * `gesture` of kind `nod`: two nods of 0.5 s, a stroke of 1.0 s, plus the
   * preparation and retraction; fits yes, agreement, acknowledgement
   * ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const gestureNod: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureNod"]
  > = AutoMovieMotionHumanActionRow.of(
    "gestureNod",
    gesture,
    HUMAN_GESTURE_NOD,
  );

  /**
   * `gesture` of kind `shakeHead`: three turns of 0.45 s, a stroke of 1.35 s,
   * plus the preparation and retraction; fits no, disagreement, disbelief
   * ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const gestureShakeHead: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureShakeHead"]
  > = AutoMovieMotionHumanActionRow.of(
    "gestureShakeHead",
    gesture,
    HUMAN_GESTURE_SHAKE_HEAD,
  );

  /**
   * `gesture` of kind `bow`: the trunk goes down at about 50 degrees a second,
   * is held 0.95 s at the deepest (Kawabata et al. 2009) and comes up at about
   * 43 degrees a second; 30 degrees when `depth` is absent, plus the
   * preparation and retraction; fits a greeting of respect, thanks, an apology
   * ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const gestureBow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureBow"]
  > = AutoMovieMotionHumanActionRow.of(
    "gestureBow",
    gesture,
    HUMAN_GESTURE_BOW,
  );

  /**
   * `gesture` of kind `chinLift`: a held pose of 0.8 s, plus the preparation
   * and retraction; fits pride, defiance ({@link gestureStrokeTables.RHYTHM},
   * `count` repeats the stroke).
   */
  export const gestureChinLift: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureChinLift"]
  > = AutoMovieMotionHumanActionRow.of(
    "gestureChinLift",
    gesture,
    HUMAN_GESTURE_CHIN_LIFT,
  );

  /**
   * `gesture` of kind `squareShoulders`: a held pose of 0.8 s, plus the
   * preparation and retraction; fits resolve, readiness
   * ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const gestureSquareShoulders: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureSquareShoulders"]
  > = AutoMovieMotionHumanActionRow.of(
    "gestureSquareShoulders",
    gesture,
    HUMAN_GESTURE_SQUARE_SHOULDERS,
  );

  /**
   * `gesture` of kind `slump`: a held pose of 0.8 s, plus the preparation and
   * retraction; fits defeat, exhaustion, dejection
   * ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const gestureSlump: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperGesture"]["gestureSlump"]
  > = AutoMovieMotionHumanActionRow.of(
    "gestureSlump",
    gesture,
    HUMAN_GESTURE_SLUMP,
  );
}
