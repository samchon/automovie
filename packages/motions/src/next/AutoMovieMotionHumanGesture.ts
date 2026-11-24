import { AutoMovieMotionHumanGestureBeats } from "./AutoMovieMotionHumanGestureBeats";
import { AutoMovieMotionHumanGestureEmblems } from "./AutoMovieMotionHumanGestureEmblems";
import { AutoMovieMotionHumanGestureLaws } from "./AutoMovieMotionHumanGestureLaws";
import { AutoMovieMotionHumanGesturePhrases } from "./AutoMovieMotionHumanGesturePhrases";

/**
 * Gestures of the hands and arms: emblems, beats and pointing, as arm phrases.
 *
 * The family carries its fixed-parameter gestures as presets, data on
 * `AutoMovieMotionHumanGesture`: the beats and body gestures `WAVE`,
 * `RAISE_HAND`, `CHEER`, `STOP_PALM`, `POINT`, `PALMS_UP`, `BECKON`, `CLAP`,
 * `RUB_HANDS`, `PALMS_TOGETHER`, `THUMBS_DOWN`, `TOUCH_FACE`, `PUSH_GLASSES`,
 * `SCRATCH_HEAD`, `SHRUG`, `NOD`, `SHAKE_HEAD`, `BOW`, `CHIN_LIFT`,
 * `SQUARE_SHOULDERS` and `SLUMP`, read by the rows of `HumanGestureRows`; the
 * emblems `EMBLEM_PALMS_TOGETHER`, `EMBLEM_HANDS_UP`, `EMBLEM_HALT`,
 * `EMBLEM_COME_HERE`, `EMBLEM_DONT_KNOW`, `EMBLEM_THUMBS_UP`,
 * `EMBLEM_THUMBS_DOWN`, `EMBLEM_OK_SIGN`, `EMBLEM_VICTORY_SIGN`,
 * `EMBLEM_CROSSED_FINGERS`, `EMBLEM_COUNT_ONE` to `EMBLEM_COUNT_FIVE`,
 * `EMBLEM_SHAKE_FIST`, `EMBLEM_FINGER_SNAP` and `EMBLEM_AIR_QUOTES`, read by
 * the rows of `HumanEmblem`; and the arm phrases `PHRASE_*`
 * (`PHRASE_WAVE_HAND`, `PHRASE_POINT_AT`, `PHRASE_TAP_ON`, `PHRASE_FOLD_ARMS`,
 * `PHRASE_HAND_ON_HIP`, `PHRASE_PHONE_TO_EAR` and the rest of that group), read
 * by the rows of `HumanUpperRows`. A preset adds no method and is spread into
 * the parameters of `gesture` or `armPhrase`; each row and its preset share one
 * value.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `gesture`: A communicative gesture while standing: the hand, head or trunk
 *   moves through Kendon's phases (Kendon 1980; McNeill 1992, Hand and Mind):
 *   preparation from rest to the stroke's start, the stroke that carries the
 *   meaning, an optional post-stroke hold, and retraction to rest.
 * - `armPhrase`: One arm phrase on a target: the hand visits a place, strokes
 *   along a path or oscillates about a pose, on the standard instants of a
 *   phrase (Kendon 1980's preparation, stroke, hold and retraction as BML's
 *   `ready`, `strokeStart`, `stroke`, `strokeEnd` and `relax`).
 * - `gestureSignal`: The signals a gesture's stroke rides, each a function of the
 *   stroke's share in [0, 1] that starts at rest: a windowed oscillation for
 *   the repeated strokes, a single rise and fall, and a rise held to the end.
 * - `gestureStroke`: The stroke of each gesture: where each hand surface goes,
 *   turned which way and in which shape, as a function of the stroke's
 *   progress, and which joints a gesture moves directly.
 * - `handGoals`: Arm goals that put hand surfaces on their points, the contact
 *   first and the hand's turn as close as the arm allows.
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method, each documented on its group:
 * `AutoMovieMotionHumanGestureBeats` (the beats and body gestures read by the
 * rows of `HumanGestureRows`), `AutoMovieMotionHumanGestureEmblems` (the
 * emblems read by the rows of `HumanEmblem`) and
 * `AutoMovieMotionHumanGesturePhrases` (the arm phrases read by the rows of
 * `HumanUpperRows`).
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanGestureRows`: The gestures as rows: each kind of `gesture` (emblems,
 *   self-adaptors and displays, Ekman and Friesen 1969) under a name of its
 *   own, with every other axis of the law open (the side, the target, the
 *   count, the hold, the effort), so a production composes a gesture by its
 *   name on any base and carrier the law admits.
 * - `HumanEmblem`: Emblems: gestures with a fixed meaning, each a row of a
 *   shipped action.
 * - `HumanUpperRows`: The upper-body acts re-expressed as rows over the arm's
 *   phrases: each row is `armPhrase` with its phrase, its hand and the shape of
 *   its target fixed, so a gesture, a touch, a hand at rest, a hand to the face
 *   and a wipe share one plan, one timing and one set of refusals, and each
 *   accepts any base, carrier, side and manner the phrase law does.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanGesture} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanGesture {
  /**
   * A communicative gesture while standing. See
   * `AutoMovieMotionHumanGestureLaws.gesture`.
   */
  export import gesture = AutoMovieMotionHumanGestureLaws.gesture;

  /**
   * One arm phrase on a target. See
   * `AutoMovieMotionHumanGestureLaws.armPhrase`.
   */
  export import armPhrase = AutoMovieMotionHumanGestureLaws.armPhrase;

  /**
   * The signals a gesture's stroke rides, each a function of the stroke's share
   * in [0, 1] that starts at rest. See
   * `AutoMovieMotionHumanGestureLaws.gestureSignal`.
   */
  export import gestureSignal = AutoMovieMotionHumanGestureLaws.gestureSignal;

  /**
   * The stroke of each gesture. See
   * `AutoMovieMotionHumanGestureLaws.gestureStroke`.
   */
  export import gestureStroke = AutoMovieMotionHumanGestureLaws.gestureStroke;

  /**
   * Arm goals that put hand surfaces on their points, the contact first and the
   * hand's turn as close as the arm allows. See
   * `AutoMovieMotionHumanGestureLaws.handGoals`.
   */
  export import handGoals = AutoMovieMotionHumanGestureLaws.handGoals;

  /**
   * The gestures as rows. See
   * `AutoMovieMotionHumanGestureLaws.HumanGestureRows`.
   */
  export import HumanGestureRows = AutoMovieMotionHumanGestureLaws.HumanGestureRows;

  /** Emblems. See `AutoMovieMotionHumanGestureLaws.HumanEmblem`. */
  export import HumanEmblem = AutoMovieMotionHumanGestureLaws.HumanEmblem;

  /**
   * The upper-body acts re-expressed as rows over the arm's phrases. See
   * `AutoMovieMotionHumanGestureLaws.HumanUpperRows`.
   */
  export import HumanUpperRows = AutoMovieMotionHumanGestureLaws.HumanUpperRows;

  /** The `gestureWave` row of `HumanGestureRows`, as a preset. */
  export import WAVE = AutoMovieMotionHumanGestureBeats.WAVE;

  /** The `gestureRaiseHand` row of `HumanGestureRows`, as a preset. */
  export import RAISE_HAND = AutoMovieMotionHumanGestureBeats.RAISE_HAND;

  /** The `gestureCheer` row of `HumanGestureRows`, as a preset. */
  export import CHEER = AutoMovieMotionHumanGestureBeats.CHEER;

  /** The `gestureStopPalm` row of `HumanGestureRows`, as a preset. */
  export import STOP_PALM = AutoMovieMotionHumanGestureBeats.STOP_PALM;

  /** The `gesturePoint` row of `HumanGestureRows`, as a preset. */
  export import POINT = AutoMovieMotionHumanGestureBeats.POINT;

  /** The `gesturePalmsUp` row of `HumanGestureRows`, as a preset. */
  export import PALMS_UP = AutoMovieMotionHumanGestureBeats.PALMS_UP;

  /** The `gestureBeckon` row of `HumanGestureRows`, as a preset. */
  export import BECKON = AutoMovieMotionHumanGestureBeats.BECKON;

  /** The `gestureClap` row of `HumanGestureRows`, as a preset. */
  export import CLAP = AutoMovieMotionHumanGestureBeats.CLAP;

  /** The `gestureRubHands` row of `HumanGestureRows`, as a preset. */
  export import RUB_HANDS = AutoMovieMotionHumanGestureBeats.RUB_HANDS;

  /** The `gesturePalmsTogether` row of `HumanGestureRows`, as a preset. */
  export import PALMS_TOGETHER = AutoMovieMotionHumanGestureBeats.PALMS_TOGETHER;

  /** The `gestureThumbsDown` row of `HumanGestureRows`, as a preset. */
  export import THUMBS_DOWN = AutoMovieMotionHumanGestureBeats.THUMBS_DOWN;

  /** The `gestureTouchFace` row of `HumanGestureRows`, as a preset. */
  export import TOUCH_FACE = AutoMovieMotionHumanGestureBeats.TOUCH_FACE;

  /** The `gesturePushGlasses` row of `HumanGestureRows`, as a preset. */
  export import PUSH_GLASSES = AutoMovieMotionHumanGestureBeats.PUSH_GLASSES;

  /** The `gestureScratchHead` row of `HumanGestureRows`, as a preset. */
  export import SCRATCH_HEAD = AutoMovieMotionHumanGestureBeats.SCRATCH_HEAD;

  /** The `gestureShrug` row of `HumanGestureRows`, as a preset. */
  export import SHRUG = AutoMovieMotionHumanGestureBeats.SHRUG;

  /** The `gestureNod` row of `HumanGestureRows`, as a preset. */
  export import NOD = AutoMovieMotionHumanGestureBeats.NOD;

  /** The `gestureShakeHead` row of `HumanGestureRows`, as a preset. */
  export import SHAKE_HEAD = AutoMovieMotionHumanGestureBeats.SHAKE_HEAD;

  /** The `gestureBow` row of `HumanGestureRows`, as a preset. */
  export import BOW = AutoMovieMotionHumanGestureBeats.BOW;

  /** The `gestureChinLift` row of `HumanGestureRows`, as a preset. */
  export import CHIN_LIFT = AutoMovieMotionHumanGestureBeats.CHIN_LIFT;

  /** The `gestureSquareShoulders` row of `HumanGestureRows`, as a preset. */
  export import SQUARE_SHOULDERS = AutoMovieMotionHumanGestureBeats.SQUARE_SHOULDERS;

  /** The `gestureSlump` row of `HumanGestureRows`, as a preset. */
  export import SLUMP = AutoMovieMotionHumanGestureBeats.SLUMP;

  /** The `palmsTogether` row of `HumanEmblem`, as a preset. */
  export import EMBLEM_PALMS_TOGETHER = AutoMovieMotionHumanGestureEmblems.EMBLEM_PALMS_TOGETHER;

  /** The `handsUp` row of `HumanEmblem`, as a preset. */
  export import EMBLEM_HANDS_UP = AutoMovieMotionHumanGestureEmblems.EMBLEM_HANDS_UP;

  /** The `halt` row of `HumanEmblem`, as a preset. */
  export import EMBLEM_HALT = AutoMovieMotionHumanGestureEmblems.EMBLEM_HALT;

  /** The `comeHere` row of `HumanEmblem`, as a preset. */
  export import EMBLEM_COME_HERE = AutoMovieMotionHumanGestureEmblems.EMBLEM_COME_HERE;

  /** The `dontKnow` row of `HumanEmblem`, as a preset. */
  export import EMBLEM_DONT_KNOW = AutoMovieMotionHumanGestureEmblems.EMBLEM_DONT_KNOW;

  /** The `thumbsUp` row of `HumanEmblem`, as a preset. */
  export import EMBLEM_THUMBS_UP = AutoMovieMotionHumanGestureEmblems.EMBLEM_THUMBS_UP;

  /** The `thumbsDown` row of `HumanEmblem`, as a preset. */
  export import EMBLEM_THUMBS_DOWN = AutoMovieMotionHumanGestureEmblems.EMBLEM_THUMBS_DOWN;

  /** The `okSign` row of `HumanEmblem`, as a preset. */
  export import EMBLEM_OK_SIGN = AutoMovieMotionHumanGestureEmblems.EMBLEM_OK_SIGN;

  /** The `victorySign` row of `HumanEmblem`, as a preset. */
  export import EMBLEM_VICTORY_SIGN = AutoMovieMotionHumanGestureEmblems.EMBLEM_VICTORY_SIGN;

  /** The `crossedFingers` row of `HumanEmblem`, as a preset. */
  export import EMBLEM_CROSSED_FINGERS = AutoMovieMotionHumanGestureEmblems.EMBLEM_CROSSED_FINGERS;

  /** The `countOne` row of `HumanEmblem`, as a preset. */
  export import EMBLEM_COUNT_ONE = AutoMovieMotionHumanGestureEmblems.EMBLEM_COUNT_ONE;

  /** The `countTwo` row of `HumanEmblem`, as a preset. */
  export import EMBLEM_COUNT_TWO = AutoMovieMotionHumanGestureEmblems.EMBLEM_COUNT_TWO;

  /** The `countThree` row of `HumanEmblem`, as a preset. */
  export import EMBLEM_COUNT_THREE = AutoMovieMotionHumanGestureEmblems.EMBLEM_COUNT_THREE;

  /** The `countFour` row of `HumanEmblem`, as a preset. */
  export import EMBLEM_COUNT_FOUR = AutoMovieMotionHumanGestureEmblems.EMBLEM_COUNT_FOUR;

  /** The `countFive` row of `HumanEmblem`, as a preset. */
  export import EMBLEM_COUNT_FIVE = AutoMovieMotionHumanGestureEmblems.EMBLEM_COUNT_FIVE;

  /** The `shakeFist` row of `HumanEmblem`, as a preset. */
  export import EMBLEM_SHAKE_FIST = AutoMovieMotionHumanGestureEmblems.EMBLEM_SHAKE_FIST;

  /** The `fingerSnap` row of `HumanEmblem`, as a preset. */
  export import EMBLEM_FINGER_SNAP = AutoMovieMotionHumanGestureEmblems.EMBLEM_FINGER_SNAP;

  /** The `airQuotes` row of `HumanEmblem`, as a preset. */
  export import EMBLEM_AIR_QUOTES = AutoMovieMotionHumanGestureEmblems.EMBLEM_AIR_QUOTES;

  /** The `waveHand` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_WAVE_HAND = AutoMovieMotionHumanGesturePhrases.PHRASE_WAVE_HAND;

  /** The `raiseHandHigh` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_RAISE_HAND_HIGH = AutoMovieMotionHumanGesturePhrases.PHRASE_RAISE_HAND_HIGH;

  /** The `stopHand` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_STOP_HAND = AutoMovieMotionHumanGesturePhrases.PHRASE_STOP_HAND;

  /** The `pointAt` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_POINT_AT = AutoMovieMotionHumanGesturePhrases.PHRASE_POINT_AT;

  /** The `tapOn` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_TAP_ON = AutoMovieMotionHumanGesturePhrases.PHRASE_TAP_ON;

  /** The `pressOn` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_PRESS_ON = AutoMovieMotionHumanGesturePhrases.PHRASE_PRESS_ON;

  /** The `rubOn` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_RUB_ON = AutoMovieMotionHumanGesturePhrases.PHRASE_RUB_ON;

  /** The `strokeDown` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_STROKE_DOWN = AutoMovieMotionHumanGesturePhrases.PHRASE_STROKE_DOWN;

  /** The `handOnHip` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_HAND_ON_HIP = AutoMovieMotionHumanGesturePhrases.PHRASE_HAND_ON_HIP;

  /** The `chinOnFist` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_CHIN_ON_FIST = AutoMovieMotionHumanGesturePhrases.PHRASE_CHIN_ON_FIST;

  /** The `wipeMouthAcross` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_WIPE_MOUTH_ACROSS = AutoMovieMotionHumanGesturePhrases.PHRASE_WIPE_MOUTH_ACROSS;

  /** The `wipeAcross` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_WIPE_ACROSS = AutoMovieMotionHumanGesturePhrases.PHRASE_WIPE_ACROSS;

  /** The `hammerStrokes` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_HAMMER_STROKES = AutoMovieMotionHumanGesturePhrases.PHRASE_HAMMER_STROKES;

  /** The `sawStrokes` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_SAW_STROKES = AutoMovieMotionHumanGesturePhrases.PHRASE_SAW_STROKES;

  /** The `stirStrokes` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_STIR_STROKES = AutoMovieMotionHumanGesturePhrases.PHRASE_STIR_STROKES;

  /** The `hatOnHead` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_HAT_ON_HEAD = AutoMovieMotionHumanGesturePhrases.PHRASE_HAT_ON_HEAD;

  /** The `palmUp` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_PALM_UP = AutoMovieMotionHumanGesturePhrases.PHRASE_PALM_UP;

  /** The `glassesUp` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_GLASSES_UP = AutoMovieMotionHumanGesturePhrases.PHRASE_GLASSES_UP;

  /** The `headScratch` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_HEAD_SCRATCH = AutoMovieMotionHumanGesturePhrases.PHRASE_HEAD_SCRATCH;

  /** The `cheekInHand` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_CHEEK_IN_HAND = AutoMovieMotionHumanGesturePhrases.PHRASE_CHEEK_IN_HAND;

  /** The `handInPocket` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_HAND_IN_POCKET = AutoMovieMotionHumanGesturePhrases.PHRASE_HAND_IN_POCKET;

  /** The `handBehindHead` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_HAND_BEHIND_HEAD = AutoMovieMotionHumanGesturePhrases.PHRASE_HAND_BEHIND_HEAD;

  /** The `phoneToEar` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_PHONE_TO_EAR = AutoMovieMotionHumanGesturePhrases.PHRASE_PHONE_TO_EAR;

  /** The `teethBrushing` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_TEETH_BRUSHING = AutoMovieMotionHumanGesturePhrases.PHRASE_TEETH_BRUSHING;

  /** The `hairCombing` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_HAIR_COMBING = AutoMovieMotionHumanGesturePhrases.PHRASE_HAIR_COMBING;

  /** The `clapHands` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_CLAP_HANDS = AutoMovieMotionHumanGesturePhrases.PHRASE_CLAP_HANDS;

  /** The `rubPalms` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_RUB_PALMS = AutoMovieMotionHumanGesturePhrases.PHRASE_RUB_PALMS;

  /** The `handsTogetherFront` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_HANDS_TOGETHER_FRONT = AutoMovieMotionHumanGesturePhrases.PHRASE_HANDS_TOGETHER_FRONT;

  /** The `cheerHands` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_CHEER_HANDS = AutoMovieMotionHumanGesturePhrases.PHRASE_CHEER_HANDS;

  /** The `beckonHand` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_BECKON_HAND = AutoMovieMotionHumanGesturePhrases.PHRASE_BECKON_HAND;

  /** The `foldArms` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_FOLD_ARMS = AutoMovieMotionHumanGesturePhrases.PHRASE_FOLD_ARMS;

  /** The `handsClaspedBehind` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_HANDS_CLASPED_BEHIND = AutoMovieMotionHumanGesturePhrases.PHRASE_HANDS_CLASPED_BEHIND;

  /** The `armAtSide` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_ARM_AT_SIDE = AutoMovieMotionHumanGesturePhrases.PHRASE_ARM_AT_SIDE;

  /** The `patOn` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_PAT_ON = AutoMovieMotionHumanGesturePhrases.PHRASE_PAT_ON;

  /** The `squeezeOn` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_SQUEEZE_ON = AutoMovieMotionHumanGesturePhrases.PHRASE_SQUEEZE_ON;

  /** The `holdOn` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_HOLD_ON = AutoMovieMotionHumanGesturePhrases.PHRASE_HOLD_ON;

  /** The `drinkFrom` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_DRINK_FROM = AutoMovieMotionHumanGesturePhrases.PHRASE_DRINK_FROM;

  /** The `eatWith` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_EAT_WITH = AutoMovieMotionHumanGesturePhrases.PHRASE_EAT_WITH;

  /** The `scratchOn` row of `HumanUpperRows`, as a preset. */
  export import PHRASE_SCRATCH_ON = AutoMovieMotionHumanGesturePhrases.PHRASE_SCRATCH_ON;
}
