import { HUMAN_GESTURE_BECKON } from "../presets/HUMAN_GESTURE_BECKON";
import { HUMAN_GESTURE_BOW } from "../presets/HUMAN_GESTURE_BOW";
import { HUMAN_GESTURE_CHEER } from "../presets/HUMAN_GESTURE_CHEER";
import { HUMAN_GESTURE_CHIN_LIFT } from "../presets/HUMAN_GESTURE_CHIN_LIFT";
import { HUMAN_GESTURE_CLAP } from "../presets/HUMAN_GESTURE_CLAP";
import { HUMAN_GESTURE_NOD } from "../presets/HUMAN_GESTURE_NOD";
import { HUMAN_GESTURE_PALMS_TOGETHER } from "../presets/HUMAN_GESTURE_PALMS_TOGETHER";
import { HUMAN_GESTURE_PALMS_UP } from "../presets/HUMAN_GESTURE_PALMS_UP";
import { HUMAN_GESTURE_POINT } from "../presets/HUMAN_GESTURE_POINT";
import { HUMAN_GESTURE_PUSH_GLASSES } from "../presets/HUMAN_GESTURE_PUSH_GLASSES";
import { HUMAN_GESTURE_RAISE_HAND } from "../presets/HUMAN_GESTURE_RAISE_HAND";
import { HUMAN_GESTURE_RUB_HANDS } from "../presets/HUMAN_GESTURE_RUB_HANDS";
import { HUMAN_GESTURE_SCRATCH_HEAD } from "../presets/HUMAN_GESTURE_SCRATCH_HEAD";
import { HUMAN_GESTURE_SHAKE_HEAD } from "../presets/HUMAN_GESTURE_SHAKE_HEAD";
import { HUMAN_GESTURE_SHRUG } from "../presets/HUMAN_GESTURE_SHRUG";
import { HUMAN_GESTURE_SLUMP } from "../presets/HUMAN_GESTURE_SLUMP";
import { HUMAN_GESTURE_SQUARE_SHOULDERS } from "../presets/HUMAN_GESTURE_SQUARE_SHOULDERS";
import { HUMAN_GESTURE_STOP_PALM } from "../presets/HUMAN_GESTURE_STOP_PALM";
import { HUMAN_GESTURE_THUMBS_DOWN } from "../presets/HUMAN_GESTURE_THUMBS_DOWN";
import { HUMAN_GESTURE_TOUCH_FACE } from "../presets/HUMAN_GESTURE_TOUCH_FACE";
import { HUMAN_GESTURE_WAVE } from "../presets/HUMAN_GESTURE_WAVE";

/*
 * The gesture family's beats and body gestures (`AutoMovieMotionHumanGesture`).
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
 * - `WAVE`: The values the `gestureWave` row of `HumanGestureRows` fixes on
 *   `gesture`, spread into its parameters.
 * - `RAISE_HAND`: The values the `gestureRaiseHand` row of `HumanGestureRows`
 *   fixes on `gesture`, spread into its parameters.
 * - `CHEER`: The values the `gestureCheer` row of `HumanGestureRows` fixes on
 *   `gesture`, spread into its parameters.
 * - `STOP_PALM`: The values the `gestureStopPalm` row of `HumanGestureRows` fixes
 *   on `gesture`, spread into its parameters.
 * - `POINT`: The values the `gesturePoint` row of `HumanGestureRows` fixes on
 *   `gesture`, spread into its parameters.
 * - `PALMS_UP`: The values the `gesturePalmsUp` row of `HumanGestureRows` fixes
 *   on `gesture`, spread into its parameters.
 * - `BECKON`: The values the `gestureBeckon` row of `HumanGestureRows` fixes on
 *   `gesture`, spread into its parameters.
 * - `CLAP`: The values the `gestureClap` row of `HumanGestureRows` fixes on
 *   `gesture`, spread into its parameters.
 * - `RUB_HANDS`: The values the `gestureRubHands` row of `HumanGestureRows` fixes
 *   on `gesture`, spread into its parameters.
 * - `PALMS_TOGETHER`: The values the `gesturePalmsTogether` row of
 *   `HumanGestureRows` fixes on `gesture`, spread into its parameters.
 * - `THUMBS_DOWN`: The values the `gestureThumbsDown` row of `HumanGestureRows`
 *   fixes on `gesture`, spread into its parameters.
 * - `TOUCH_FACE`: The values the `gestureTouchFace` row of `HumanGestureRows`
 *   fixes on `gesture`, spread into its parameters.
 * - `PUSH_GLASSES`: The values the `gesturePushGlasses` row of `HumanGestureRows`
 *   fixes on `gesture`, spread into its parameters.
 * - `SCRATCH_HEAD`: The values the `gestureScratchHead` row of `HumanGestureRows`
 *   fixes on `gesture`, spread into its parameters.
 * - `SHRUG`: The values the `gestureShrug` row of `HumanGestureRows` fixes on
 *   `gesture`, spread into its parameters.
 * - `NOD`: The values the `gestureNod` row of `HumanGestureRows` fixes on
 *   `gesture`, spread into its parameters.
 * - `SHAKE_HEAD`: The values the `gestureShakeHead` row of `HumanGestureRows`
 *   fixes on `gesture`, spread into its parameters.
 * - `BOW`: The values the `gestureBow` row of `HumanGestureRows` fixes on
 *   `gesture`, spread into its parameters.
 * - `CHIN_LIFT`: The values the `gestureChinLift` row of `HumanGestureRows` fixes
 *   on `gesture`, spread into its parameters.
 * - `SQUARE_SHOULDERS`: The values the `gestureSquareShoulders` row of
 *   `HumanGestureRows` fixes on `gesture`, spread into its parameters.
 * - `SLUMP`: The values the `gestureSlump` row of `HumanGestureRows` fixes on
 *   `gesture`, spread into its parameters.
 */
export namespace AutoMovieMotionHumanGestureBeats {
  /*
   * The values the `gestureWave` row of `HumanGestureRows` fixes on `gesture`,
   * spread into its parameters. `gesture` of kind `wave`: three swings of 0.4
   * s, a stroke of 1.2 s, plus the preparation and retraction; fits a greeting,
   * a farewell, hailing someone (gestureStrokeTables.RHYTHM, `count`
   * repeats the stroke).
   */
  export const WAVE: typeof HUMAN_GESTURE_WAVE = HUMAN_GESTURE_WAVE;

  /*
   * The values the `gestureRaiseHand` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `raiseHand`: one
   * raise of 0.5 s, plus the preparation and retraction; fits asking to speak,
   * volunteering, calling for attention (gestureStrokeTables.RHYTHM,
   * `count` repeats the stroke).
   */
  export const RAISE_HAND: typeof HUMAN_GESTURE_RAISE_HAND =
    HUMAN_GESTURE_RAISE_HAND;

  /*
   * The values the `gestureCheer` row of `HumanGestureRows` fixes on `gesture`,
   * spread into its parameters. `gesture` of kind `cheer`: two raises of 0.5 s,
   * a stroke of 1.0 s, both hands, plus the preparation and retraction; fits
   * celebrating, a win, acclaim (gestureStrokeTables.RHYTHM, `count`
   * repeats the stroke).
   */
  export const CHEER: typeof HUMAN_GESTURE_CHEER = HUMAN_GESTURE_CHEER;

  /*
   * The values the `gestureStopPalm` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `stopPalm`: one
   * push of 0.35 s, plus the preparation and retraction; fits halting someone,
   * refusing, "wait" (gestureStrokeTables.RHYTHM, `count` repeats the
   * stroke).
   */
  export const STOP_PALM: typeof HUMAN_GESTURE_STOP_PALM =
    HUMAN_GESTURE_STOP_PALM;

  /*
   * The values the `gesturePoint` row of `HumanGestureRows` fixes on `gesture`,
   * spread into its parameters. `gesture` of kind `point`: one point of 0.5 s,
   * plus the preparation and retraction; fits showing a thing or a direction to
   * someone (gestureStrokeTables.RHYTHM, `count` repeats the stroke).
   */
  export const POINT: typeof HUMAN_GESTURE_POINT = HUMAN_GESTURE_POINT;

  /*
   * The values the `gesturePalmsUp` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `palmsUp`: one
   * opening of 0.6 s, both hands, plus the preparation and retraction; fits "I
   * do not know", an appeal, offering an explanation
   * (gestureStrokeTables.RHYTHM, `count` repeats the stroke).
   */
  export const PALMS_UP: typeof HUMAN_GESTURE_PALMS_UP = HUMAN_GESTURE_PALMS_UP;

  /*
   * The values the `gestureBeckon` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `beckon`: two
   * curls of 0.6 s, a stroke of 1.2 s, plus the preparation and retraction;
   * fits calling someone over (gestureStrokeTables.RHYTHM, `count`
   * repeats the stroke).
   */
  export const BECKON: typeof HUMAN_GESTURE_BECKON = HUMAN_GESTURE_BECKON;

  /*
   * The values the `gestureClap` row of `HumanGestureRows` fixes on `gesture`,
   * spread into its parameters. `gesture` of kind `clap`: four claps at 4 a
   * second (Neda et al. 2000), a stroke of 1.0 s, both hands, plus the
   * preparation and retraction; fits applause, a cheer, getting attention
   * (gestureStrokeTables.RHYTHM, `count` repeats the stroke).
   */
  export const CLAP: typeof HUMAN_GESTURE_CLAP = HUMAN_GESTURE_CLAP;

  /*
   * The values the `gestureRubHands` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `rubHands`: three
   * rubs of 0.35 s, a stroke of 1.05 s, both hands, plus the preparation and
   * retraction; fits anticipation, cold, scheming
   * (gestureStrokeTables.RHYTHM, `count` repeats the stroke).
   */
  export const RUB_HANDS: typeof HUMAN_GESTURE_RUB_HANDS =
    HUMAN_GESTURE_RUB_HANDS;

  /*
   * The values the `gesturePalmsTogether` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `palmsTogether`:
   * one close of 0.8 s, both hands, plus the preparation and retraction; fits a
   * plea, a prayer, thanks (gestureStrokeTables.RHYTHM, `count` repeats
   * the stroke).
   */
  export const PALMS_TOGETHER: typeof HUMAN_GESTURE_PALMS_TOGETHER =
    HUMAN_GESTURE_PALMS_TOGETHER;

  /*
   * The values the `gestureThumbsDown` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `thumbsDown`: a
   * held sign of 0.8 s, plus the preparation and retraction; fits disapproval,
   * rejection (gestureStrokeTables.RHYTHM, `count` repeats the stroke).
   */
  export const THUMBS_DOWN: typeof HUMAN_GESTURE_THUMBS_DOWN =
    HUMAN_GESTURE_THUMBS_DOWN;

  /*
   * The values the `gestureTouchFace` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `touchFace`: a
   * held touch of 0.8 s, plus the preparation and retraction; fits thinking,
   * doubt, embarrassment (gestureStrokeTables.RHYTHM, `count` repeats
   * the stroke).
   */
  export const TOUCH_FACE: typeof HUMAN_GESTURE_TOUCH_FACE =
    HUMAN_GESTURE_TOUCH_FACE;

  /*
   * The values the `gesturePushGlasses` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `pushGlasses`: one
   * push of 0.3 s, plus the preparation and retraction; fits a nervous or
   * studious beat (gestureStrokeTables.RHYTHM, `count` repeats the
   * stroke).
   */
  export const PUSH_GLASSES: typeof HUMAN_GESTURE_PUSH_GLASSES =
    HUMAN_GESTURE_PUSH_GLASSES;

  /*
   * The values the `gestureScratchHead` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `scratchHead`:
   * four scratches of 0.25 s, a stroke of 1.0 s, plus the preparation and
   * retraction; fits puzzlement, confusion (gestureStrokeTables.RHYTHM,
   * `count` repeats the stroke).
   */
  export const SCRATCH_HEAD: typeof HUMAN_GESTURE_SCRATCH_HEAD =
    HUMAN_GESTURE_SCRATCH_HEAD;

  /*
   * The values the `gestureShrug` row of `HumanGestureRows` fixes on `gesture`,
   * spread into its parameters. `gesture` of kind `shrug`: one shrug of 0.7 s,
   * both shoulders, plus the preparation and retraction; fits indifference, "I
   * do not know" (gestureStrokeTables.RHYTHM, `count` repeats the
   * stroke).
   */
  export const SHRUG: typeof HUMAN_GESTURE_SHRUG = HUMAN_GESTURE_SHRUG;

  /*
   * The values the `gestureNod` row of `HumanGestureRows` fixes on `gesture`,
   * spread into its parameters. `gesture` of kind `nod`: two nods of 0.5 s, a
   * stroke of 1.0 s, plus the preparation and retraction; fits yes, agreement,
   * acknowledgement (gestureStrokeTables.RHYTHM, `count` repeats the
   * stroke).
   */
  export const NOD: typeof HUMAN_GESTURE_NOD = HUMAN_GESTURE_NOD;

  /*
   * The values the `gestureShakeHead` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `shakeHead`: three
   * turns of 0.45 s, a stroke of 1.35 s, plus the preparation and retraction;
   * fits no, disagreement, disbelief (gestureStrokeTables.RHYTHM,
   * `count` repeats the stroke).
   */
  export const SHAKE_HEAD: typeof HUMAN_GESTURE_SHAKE_HEAD =
    HUMAN_GESTURE_SHAKE_HEAD;

  /*
   * The values the `gestureBow` row of `HumanGestureRows` fixes on `gesture`,
   * spread into its parameters. `gesture` of kind `bow`: the trunk goes down at
   * about 50 degrees a second, is held 0.95 s at the deepest (Kawabata et al.
   * 2009) and comes up at about 43 degrees a second; 30 degrees when `depth` is
   * absent, plus the preparation and retraction; fits a greeting of respect,
   * thanks, an apology (gestureStrokeTables.RHYTHM, `count` repeats the
   * stroke).
   */
  export const BOW: typeof HUMAN_GESTURE_BOW = HUMAN_GESTURE_BOW;

  /*
   * The values the `gestureChinLift` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `chinLift`: a held
   * pose of 0.8 s, plus the preparation and retraction; fits pride, defiance
   * (gestureStrokeTables.RHYTHM, `count` repeats the stroke).
   */
  export const CHIN_LIFT: typeof HUMAN_GESTURE_CHIN_LIFT =
    HUMAN_GESTURE_CHIN_LIFT;

  /*
   * The values the `gestureSquareShoulders` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `squareShoulders`:
   * a held pose of 0.8 s, plus the preparation and retraction; fits resolve,
   * readiness (gestureStrokeTables.RHYTHM, `count` repeats the stroke).
   */
  export const SQUARE_SHOULDERS: typeof HUMAN_GESTURE_SQUARE_SHOULDERS =
    HUMAN_GESTURE_SQUARE_SHOULDERS;

  /*
   * The values the `gestureSlump` row of `HumanGestureRows` fixes on `gesture`,
   * spread into its parameters. `gesture` of kind `slump`: a held pose of 0.8
   * s, plus the preparation and retraction; fits defeat, exhaustion, dejection
   * (gestureStrokeTables.RHYTHM, `count` repeats the stroke).
   */
  export const SLUMP: typeof HUMAN_GESTURE_SLUMP = HUMAN_GESTURE_SLUMP;
}
