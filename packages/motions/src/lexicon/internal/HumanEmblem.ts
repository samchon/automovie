import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { handToFace } from "../../daily/internal/handToFace";
import { gesture } from "../../everyday/internal/gesture";
import { AutoMovieMotionHumanActionRow } from "../../law/AutoMovieMotionHumanActionRow";
import { HUMAN_GESTURE_EMBLEM_AIR_QUOTES } from "../../next/presets/HUMAN_GESTURE_EMBLEM_AIR_QUOTES";
import { HUMAN_GESTURE_EMBLEM_COME_HERE } from "../../next/presets/HUMAN_GESTURE_EMBLEM_COME_HERE";
import { HUMAN_GESTURE_EMBLEM_COUNT_FIVE } from "../../next/presets/HUMAN_GESTURE_EMBLEM_COUNT_FIVE";
import { HUMAN_GESTURE_EMBLEM_COUNT_FOUR } from "../../next/presets/HUMAN_GESTURE_EMBLEM_COUNT_FOUR";
import { HUMAN_GESTURE_EMBLEM_COUNT_ONE } from "../../next/presets/HUMAN_GESTURE_EMBLEM_COUNT_ONE";
import { HUMAN_GESTURE_EMBLEM_COUNT_THREE } from "../../next/presets/HUMAN_GESTURE_EMBLEM_COUNT_THREE";
import { HUMAN_GESTURE_EMBLEM_COUNT_TWO } from "../../next/presets/HUMAN_GESTURE_EMBLEM_COUNT_TWO";
import { HUMAN_GESTURE_EMBLEM_CROSSED_FINGERS } from "../../next/presets/HUMAN_GESTURE_EMBLEM_CROSSED_FINGERS";
import { HUMAN_GESTURE_EMBLEM_DONT_KNOW } from "../../next/presets/HUMAN_GESTURE_EMBLEM_DONT_KNOW";
import { HUMAN_GESTURE_EMBLEM_FINGER_SNAP } from "../../next/presets/HUMAN_GESTURE_EMBLEM_FINGER_SNAP";
import { HUMAN_GESTURE_EMBLEM_HALT } from "../../next/presets/HUMAN_GESTURE_EMBLEM_HALT";
import { HUMAN_GESTURE_EMBLEM_HANDS_UP } from "../../next/presets/HUMAN_GESTURE_EMBLEM_HANDS_UP";
import { HUMAN_GESTURE_EMBLEM_OK_SIGN } from "../../next/presets/HUMAN_GESTURE_EMBLEM_OK_SIGN";
import { HUMAN_GESTURE_EMBLEM_PALMS_TOGETHER } from "../../next/presets/HUMAN_GESTURE_EMBLEM_PALMS_TOGETHER";
import { HUMAN_GESTURE_EMBLEM_SHAKE_FIST } from "../../next/presets/HUMAN_GESTURE_EMBLEM_SHAKE_FIST";
import { HUMAN_GESTURE_EMBLEM_THUMBS_DOWN } from "../../next/presets/HUMAN_GESTURE_EMBLEM_THUMBS_DOWN";
import { HUMAN_GESTURE_EMBLEM_THUMBS_UP } from "../../next/presets/HUMAN_GESTURE_EMBLEM_THUMBS_UP";
import { HUMAN_GESTURE_EMBLEM_VICTORY_SIGN } from "../../next/presets/HUMAN_GESTURE_EMBLEM_VICTORY_SIGN";
import { HUMAN_TOUCH_EMBLEM_BLOWN_KISS_SEND } from "../../next/presets/HUMAN_TOUCH_EMBLEM_BLOWN_KISS_SEND";
import { HUMAN_TOUCH_EMBLEM_COVER_EARS } from "../../next/presets/HUMAN_TOUCH_EMBLEM_COVER_EARS";
import { HUMAN_TOUCH_EMBLEM_COVER_MOUTH } from "../../next/presets/HUMAN_TOUCH_EMBLEM_COVER_MOUTH";
import { HUMAN_TOUCH_EMBLEM_HAND_ON_HEART } from "../../next/presets/HUMAN_TOUCH_EMBLEM_HAND_ON_HEART";
import { HUMAN_TOUCH_EMBLEM_SALUTE } from "../../next/presets/HUMAN_TOUCH_EMBLEM_SALUTE";
import { touch } from "../../touch/internal/touch";

/*
 * Emblems: gestures with a fixed meaning, each a row of a shipped action.
 * Register the ones a film uses (`AutoMovieMotionHumanPerformance.IInput.laws`,
 * `AutoMovieMotionHumanChain.extend`).
 */
export namespace HumanEmblem {
  /*
   * The military hand salute (US Army TC 3-21.5): the forefinger's end at the
   * right brow, the hand in line with the forearm, the upper arm level.
   */
  export const salute: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["salute"]
  > = AutoMovieMotionHumanActionRow.of(
    "salute",
    touch,
    HUMAN_TOUCH_EMBLEM_SALUTE,
  );

  /*
   * Hush: the forefinger upright across the lips, its middle on them and the
   * palm turned to the other side, so the thumb's side of the finger meets the
   * mouth and the wrist stays near straight (provisional: the hold, the fifth
   * of a hand the tip stands above the lips, and the twentieth of a hand, the
   * finger's half thickness, its axis stands off them).
   */
  export const hush: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["hush"]
  > = AutoMovieMotionHumanActionRow.of("hush", handToFace, {
    kind: {
      region: "mouth",
      effector: {
        surface: "indexTip",
        shape: "point",
        tool: { fingers: -0.2, thumb: 0.05 },
        facing: "thumb",
        along: "fingers",
      },
      kind: "hold",
      count: 1,
      hold: 1,
      tangent: "up",
      // The lips face down as well as forward, so a finger laid up their
      // slope stood 16.6 to 18.1 degrees off upright; it stands upright.
      level: true,
      head: 0,
      at: "atLips",
    },
  });

  /*
   * Palms together ahead of the chest, as a prayer or a greeting (wai, gassho):
   * the gesture's held meeting of the two palms.
   */
  export const palmsTogether: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["palmsTogether"]
  > = AutoMovieMotionHumanActionRow.of(
    "palmsTogether",
    gesture,
    HUMAN_GESTURE_EMBLEM_PALMS_TOGETHER,
  );

  /*
   * A hand on the heart: the right palm on the left chest.
   */
  export const handOnHeart: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["handOnHeart"]
  > = AutoMovieMotionHumanActionRow.of(
    "handOnHeart",
    touch,
    HUMAN_TOUCH_EMBLEM_HAND_ON_HEART,
  );

  /*
   * The blown kiss's send, performed after `blownKiss`: the open hand, palm up,
   * swept forward from the lips and held a moment at the shoulder's height,
   * 0.818 of the stature, the forearm and the hand's length, 0.146 and 0.108 of
   * it, ahead of the performer (Drillis and Contini's segment proportions, as
   * Winter's Biomechanics and Motor Control of Human Movement tabulates them),
   * in the performer's own statures so it fits every body.
   */
  export const blownKissSend: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["blownKissSend"]
  > = AutoMovieMotionHumanActionRow.of(
    "blownKissSend",
    touch,
    HUMAN_TOUCH_EMBLEM_BLOWN_KISS_SEND,
  );

  /*
   * A blown kiss: the fingertips to the lips, then away (provisional: the
   * outward throw is the retraction). The hand leans half way between upright
   * and level, the fingers pointing up and back at the mouth with the palm
   * toward the chin, so the forearm comes from below.
   */
  export const blownKiss: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["blownKiss"]
  > = AutoMovieMotionHumanActionRow.of("blownKiss", handToFace, {
    kind: {
      region: "mouth",
      effector: {
        surface: "indexTip",
        shape: "flat",
        facing: { fingers: 1, palm: 1 },
        along: { fingers: 1, palm: -1 },
      },
      kind: "tap",
      count: 1,
      hold: 0.2,
      tangent: "up",
      head: 0,
      at: "atLips",
    },
  });

  /*
   * A facepalm: the palm over the face, the head bowed into it (15 degrees,
   * provisional).
   */
  export const facepalm: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["facepalm"]
  > = AutoMovieMotionHumanActionRow.of("facepalm", handToFace, {
    kind: {
      region: "face",
      effector: { surface: "palm", shape: "flat" },
      kind: "hold",
      count: 1,
      hold: 1.2,
      tangent: "up",
      head: 15,
      at: "atFace",
    },
  });

  /*
   * Both hands raised in surrender.
   */
  export const handsUp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["handsUp"]
  > = AutoMovieMotionHumanActionRow.of(
    "handsUp",
    gesture,
    HUMAN_GESTURE_EMBLEM_HANDS_UP,
  );

  /*
   * A stop sign: the palm held out.
   */
  export const halt: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["halt"]
  > = AutoMovieMotionHumanActionRow.of(
    "halt",
    gesture,
    HUMAN_GESTURE_EMBLEM_HALT,
  );

  /*
   * A summons: the beckoning hand.
   */
  export const comeHere: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["comeHere"]
  > = AutoMovieMotionHumanActionRow.of(
    "comeHere",
    gesture,
    HUMAN_GESTURE_EMBLEM_COME_HERE,
  );

  /*
   * "I do not know": the shrug with the palms turned up.
   */
  export const dontKnow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["dontKnow"]
  > = AutoMovieMotionHumanActionRow.of(
    "dontKnow",
    gesture,
    HUMAN_GESTURE_EMBLEM_DONT_KNOW,
  );

  /*
   * A thumbs up: the fist held out before the shoulder, turned a quarter in its
   * palm's plane and then aimed so the straight thumb itself stands up (it lies
   * about 35 degrees off the knuckle line, so the quarter turn alone left it 42
   * degrees off).
   */
  export const thumbsUp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["thumbsUp"]
  > = AutoMovieMotionHumanActionRow.of(
    "thumbsUp",
    gesture,
    HUMAN_GESTURE_EMBLEM_THUMBS_UP,
  );

  /*
   * A thumbs down: the fist ahead of the shoulder with the forearm turned over
   * and the elbow raised outward, aimed so the straight thumb itself points
   * down.
   */
  export const thumbsDown: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["thumbsDown"]
  > = AutoMovieMotionHumanActionRow.of(
    "thumbsDown",
    gesture,
    HUMAN_GESTURE_EMBLEM_THUMBS_DOWN,
  );

  /*
   * The OK sign: the forefinger and thumb in a ring, held out (first pass,
   * provisional attitude).
   */
  export const okSign: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["okSign"]
  > = AutoMovieMotionHumanActionRow.of(
    "okSign",
    gesture,
    HUMAN_GESTURE_EMBLEM_OK_SIGN,
  );

  /*
   * The V sign: forefinger and middle finger spread, held out (first pass,
   * provisional attitude).
   */
  export const victorySign: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["victorySign"]
  > = AutoMovieMotionHumanActionRow.of(
    "victorySign",
    gesture,
    HUMAN_GESTURE_EMBLEM_VICTORY_SIGN,
  );

  /*
   * Crossed fingers, held out (first pass, provisional attitude).
   */
  export const crossedFingers: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["crossedFingers"]
  > = AutoMovieMotionHumanActionRow.of(
    "crossedFingers",
    gesture,
    HUMAN_GESTURE_EMBLEM_CROSSED_FINGERS,
  );

  /*
   * Counting one on the fingers, from the forefinger on (one convention;
   * cultures differ).
   */
  export const countOne: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["countOne"]
  > = AutoMovieMotionHumanActionRow.of(
    "countOne",
    gesture,
    HUMAN_GESTURE_EMBLEM_COUNT_ONE,
  );

  /*
   * Counting two on the fingers.
   */
  export const countTwo: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["countTwo"]
  > = AutoMovieMotionHumanActionRow.of(
    "countTwo",
    gesture,
    HUMAN_GESTURE_EMBLEM_COUNT_TWO,
  );

  /*
   * Counting three on the fingers.
   */
  export const countThree: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["countThree"]
  > = AutoMovieMotionHumanActionRow.of(
    "countThree",
    gesture,
    HUMAN_GESTURE_EMBLEM_COUNT_THREE,
  );

  /*
   * Counting four on the fingers.
   */
  export const countFour: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["countFour"]
  > = AutoMovieMotionHumanActionRow.of(
    "countFour",
    gesture,
    HUMAN_GESTURE_EMBLEM_COUNT_FOUR,
  );

  /*
   * Counting five on the fingers: the open hand.
   */
  export const countFive: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["countFive"]
  > = AutoMovieMotionHumanActionRow.of(
    "countFive",
    gesture,
    HUMAN_GESTURE_EMBLEM_COUNT_FIVE,
  );

  /*
   * A shaken fist: the raised fist swung from side to side (first pass on the
   * wave's stroke, provisional).
   */
  export const shakeFist: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["shakeFist"]
  > = AutoMovieMotionHumanActionRow.of(
    "shakeFist",
    gesture,
    HUMAN_GESTURE_EMBLEM_SHAKE_FIST,
  );

  /*
   * The hand set for a finger snap: the middle fingertip on the thumb's, held
   * out (first pass: the snap's release is not moved).
   */
  export const fingerSnap: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["fingerSnap"]
  > = AutoMovieMotionHumanActionRow.of(
    "fingerSnap",
    gesture,
    HUMAN_GESTURE_EMBLEM_FINGER_SNAP,
  );

  /*
   * Air quotes: both hands raised with two fingers hooked (first pass on the
   * raised hands of a cheer; the fingers do not flex twice yet).
   */
  export const airQuotes: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["airQuotes"]
  > = AutoMovieMotionHumanActionRow.of(
    "airQuotes",
    gesture,
    HUMAN_GESTURE_EMBLEM_AIR_QUOTES,
  );

  /*
   * A hand over the mouth, as at a gasp or a yawn.
   */
  export const coverMouth: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["coverMouth"]
  > = AutoMovieMotionHumanActionRow.of(
    "coverMouth",
    touch,
    HUMAN_TOUCH_EMBLEM_COVER_MOUTH,
  );

  /*
   * Both hands over the ears.
   */
  export const coverEars: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["emblem"]["coverEars"]
  > = AutoMovieMotionHumanActionRow.of(
    "coverEars",
    touch,
    HUMAN_TOUCH_EMBLEM_COVER_EARS,
  );
}
