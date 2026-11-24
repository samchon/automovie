import { armPhrase as armPhraseLaw } from "../everyday/armPhrase";
import { gesture as gestureLaw } from "../everyday/gesture";
import { gestureSignal as gestureSignalLaw } from "../everyday/gestureSignal";
import { gestureStroke as gestureStrokeLaw } from "../everyday/gestureStroke";
import { handGoals as handGoalsLaw } from "../everyday/handGoals";
import { HumanEmblem as HumanEmblemSource } from "../lexicon/HumanEmblem";
import { HumanGestureRows as HumanGestureRowsSource } from "../lexicon/HumanGestureRows";
import { HumanUpperRows as HumanUpperRowsSource } from "../lexicon/HumanUpperRows";
import { HUMAN_GESTURE_BECKON } from "./presets/HUMAN_GESTURE_BECKON";
import { HUMAN_GESTURE_BOW } from "./presets/HUMAN_GESTURE_BOW";
import { HUMAN_GESTURE_CHEER } from "./presets/HUMAN_GESTURE_CHEER";
import { HUMAN_GESTURE_CHIN_LIFT } from "./presets/HUMAN_GESTURE_CHIN_LIFT";
import { HUMAN_GESTURE_CLAP } from "./presets/HUMAN_GESTURE_CLAP";
import { HUMAN_GESTURE_EMBLEM_AIR_QUOTES } from "./presets/HUMAN_GESTURE_EMBLEM_AIR_QUOTES";
import { HUMAN_GESTURE_EMBLEM_COME_HERE } from "./presets/HUMAN_GESTURE_EMBLEM_COME_HERE";
import { HUMAN_GESTURE_EMBLEM_COUNT_FIVE } from "./presets/HUMAN_GESTURE_EMBLEM_COUNT_FIVE";
import { HUMAN_GESTURE_EMBLEM_COUNT_FOUR } from "./presets/HUMAN_GESTURE_EMBLEM_COUNT_FOUR";
import { HUMAN_GESTURE_EMBLEM_COUNT_ONE } from "./presets/HUMAN_GESTURE_EMBLEM_COUNT_ONE";
import { HUMAN_GESTURE_EMBLEM_COUNT_THREE } from "./presets/HUMAN_GESTURE_EMBLEM_COUNT_THREE";
import { HUMAN_GESTURE_EMBLEM_COUNT_TWO } from "./presets/HUMAN_GESTURE_EMBLEM_COUNT_TWO";
import { HUMAN_GESTURE_EMBLEM_CROSSED_FINGERS } from "./presets/HUMAN_GESTURE_EMBLEM_CROSSED_FINGERS";
import { HUMAN_GESTURE_EMBLEM_DONT_KNOW } from "./presets/HUMAN_GESTURE_EMBLEM_DONT_KNOW";
import { HUMAN_GESTURE_EMBLEM_FINGER_SNAP } from "./presets/HUMAN_GESTURE_EMBLEM_FINGER_SNAP";
import { HUMAN_GESTURE_EMBLEM_HALT } from "./presets/HUMAN_GESTURE_EMBLEM_HALT";
import { HUMAN_GESTURE_EMBLEM_HANDS_UP } from "./presets/HUMAN_GESTURE_EMBLEM_HANDS_UP";
import { HUMAN_GESTURE_EMBLEM_OK_SIGN } from "./presets/HUMAN_GESTURE_EMBLEM_OK_SIGN";
import { HUMAN_GESTURE_EMBLEM_PALMS_TOGETHER } from "./presets/HUMAN_GESTURE_EMBLEM_PALMS_TOGETHER";
import { HUMAN_GESTURE_EMBLEM_SHAKE_FIST } from "./presets/HUMAN_GESTURE_EMBLEM_SHAKE_FIST";
import { HUMAN_GESTURE_EMBLEM_THUMBS_DOWN } from "./presets/HUMAN_GESTURE_EMBLEM_THUMBS_DOWN";
import { HUMAN_GESTURE_EMBLEM_THUMBS_UP } from "./presets/HUMAN_GESTURE_EMBLEM_THUMBS_UP";
import { HUMAN_GESTURE_EMBLEM_VICTORY_SIGN } from "./presets/HUMAN_GESTURE_EMBLEM_VICTORY_SIGN";
import { HUMAN_GESTURE_NOD } from "./presets/HUMAN_GESTURE_NOD";
import { HUMAN_GESTURE_PALMS_TOGETHER } from "./presets/HUMAN_GESTURE_PALMS_TOGETHER";
import { HUMAN_GESTURE_PALMS_UP } from "./presets/HUMAN_GESTURE_PALMS_UP";
import { HUMAN_GESTURE_PHRASE_ARM_AT_SIDE } from "./presets/HUMAN_GESTURE_PHRASE_ARM_AT_SIDE";
import { HUMAN_GESTURE_PHRASE_BECKON_HAND } from "./presets/HUMAN_GESTURE_PHRASE_BECKON_HAND";
import { HUMAN_GESTURE_PHRASE_CHEEK_IN_HAND } from "./presets/HUMAN_GESTURE_PHRASE_CHEEK_IN_HAND";
import { HUMAN_GESTURE_PHRASE_CHEER_HANDS } from "./presets/HUMAN_GESTURE_PHRASE_CHEER_HANDS";
import { HUMAN_GESTURE_PHRASE_CHIN_ON_FIST } from "./presets/HUMAN_GESTURE_PHRASE_CHIN_ON_FIST";
import { HUMAN_GESTURE_PHRASE_CLAP_HANDS } from "./presets/HUMAN_GESTURE_PHRASE_CLAP_HANDS";
import { HUMAN_GESTURE_PHRASE_DRINK_FROM } from "./presets/HUMAN_GESTURE_PHRASE_DRINK_FROM";
import { HUMAN_GESTURE_PHRASE_EAT_WITH } from "./presets/HUMAN_GESTURE_PHRASE_EAT_WITH";
import { HUMAN_GESTURE_PHRASE_FOLD_ARMS } from "./presets/HUMAN_GESTURE_PHRASE_FOLD_ARMS";
import { HUMAN_GESTURE_PHRASE_GLASSES_UP } from "./presets/HUMAN_GESTURE_PHRASE_GLASSES_UP";
import { HUMAN_GESTURE_PHRASE_HAIR_COMBING } from "./presets/HUMAN_GESTURE_PHRASE_HAIR_COMBING";
import { HUMAN_GESTURE_PHRASE_HAMMER_STROKES } from "./presets/HUMAN_GESTURE_PHRASE_HAMMER_STROKES";
import { HUMAN_GESTURE_PHRASE_HANDS_CLASPED_BEHIND } from "./presets/HUMAN_GESTURE_PHRASE_HANDS_CLASPED_BEHIND";
import { HUMAN_GESTURE_PHRASE_HANDS_TOGETHER_FRONT } from "./presets/HUMAN_GESTURE_PHRASE_HANDS_TOGETHER_FRONT";
import { HUMAN_GESTURE_PHRASE_HAND_BEHIND_HEAD } from "./presets/HUMAN_GESTURE_PHRASE_HAND_BEHIND_HEAD";
import { HUMAN_GESTURE_PHRASE_HAND_IN_POCKET } from "./presets/HUMAN_GESTURE_PHRASE_HAND_IN_POCKET";
import { HUMAN_GESTURE_PHRASE_HAND_ON_HIP } from "./presets/HUMAN_GESTURE_PHRASE_HAND_ON_HIP";
import { HUMAN_GESTURE_PHRASE_HAT_ON_HEAD } from "./presets/HUMAN_GESTURE_PHRASE_HAT_ON_HEAD";
import { HUMAN_GESTURE_PHRASE_HEAD_SCRATCH } from "./presets/HUMAN_GESTURE_PHRASE_HEAD_SCRATCH";
import { HUMAN_GESTURE_PHRASE_HOLD_ON } from "./presets/HUMAN_GESTURE_PHRASE_HOLD_ON";
import { HUMAN_GESTURE_PHRASE_PALM_UP } from "./presets/HUMAN_GESTURE_PHRASE_PALM_UP";
import { HUMAN_GESTURE_PHRASE_PAT_ON } from "./presets/HUMAN_GESTURE_PHRASE_PAT_ON";
import { HUMAN_GESTURE_PHRASE_PHONE_TO_EAR } from "./presets/HUMAN_GESTURE_PHRASE_PHONE_TO_EAR";
import { HUMAN_GESTURE_PHRASE_POINT_AT } from "./presets/HUMAN_GESTURE_PHRASE_POINT_AT";
import { HUMAN_GESTURE_PHRASE_PRESS_ON } from "./presets/HUMAN_GESTURE_PHRASE_PRESS_ON";
import { HUMAN_GESTURE_PHRASE_RAISE_HAND_HIGH } from "./presets/HUMAN_GESTURE_PHRASE_RAISE_HAND_HIGH";
import { HUMAN_GESTURE_PHRASE_RUB_ON } from "./presets/HUMAN_GESTURE_PHRASE_RUB_ON";
import { HUMAN_GESTURE_PHRASE_RUB_PALMS } from "./presets/HUMAN_GESTURE_PHRASE_RUB_PALMS";
import { HUMAN_GESTURE_PHRASE_SAW_STROKES } from "./presets/HUMAN_GESTURE_PHRASE_SAW_STROKES";
import { HUMAN_GESTURE_PHRASE_SCRATCH_ON } from "./presets/HUMAN_GESTURE_PHRASE_SCRATCH_ON";
import { HUMAN_GESTURE_PHRASE_SQUEEZE_ON } from "./presets/HUMAN_GESTURE_PHRASE_SQUEEZE_ON";
import { HUMAN_GESTURE_PHRASE_STIR_STROKES } from "./presets/HUMAN_GESTURE_PHRASE_STIR_STROKES";
import { HUMAN_GESTURE_PHRASE_STOP_HAND } from "./presets/HUMAN_GESTURE_PHRASE_STOP_HAND";
import { HUMAN_GESTURE_PHRASE_STROKE_DOWN } from "./presets/HUMAN_GESTURE_PHRASE_STROKE_DOWN";
import { HUMAN_GESTURE_PHRASE_TAP_ON } from "./presets/HUMAN_GESTURE_PHRASE_TAP_ON";
import { HUMAN_GESTURE_PHRASE_TEETH_BRUSHING } from "./presets/HUMAN_GESTURE_PHRASE_TEETH_BRUSHING";
import { HUMAN_GESTURE_PHRASE_WAVE_HAND } from "./presets/HUMAN_GESTURE_PHRASE_WAVE_HAND";
import { HUMAN_GESTURE_PHRASE_WIPE_ACROSS } from "./presets/HUMAN_GESTURE_PHRASE_WIPE_ACROSS";
import { HUMAN_GESTURE_PHRASE_WIPE_MOUTH_ACROSS } from "./presets/HUMAN_GESTURE_PHRASE_WIPE_MOUTH_ACROSS";
import { HUMAN_GESTURE_POINT } from "./presets/HUMAN_GESTURE_POINT";
import { HUMAN_GESTURE_PUSH_GLASSES } from "./presets/HUMAN_GESTURE_PUSH_GLASSES";
import { HUMAN_GESTURE_RAISE_HAND } from "./presets/HUMAN_GESTURE_RAISE_HAND";
import { HUMAN_GESTURE_RUB_HANDS } from "./presets/HUMAN_GESTURE_RUB_HANDS";
import { HUMAN_GESTURE_SCRATCH_HEAD } from "./presets/HUMAN_GESTURE_SCRATCH_HEAD";
import { HUMAN_GESTURE_SHAKE_HEAD } from "./presets/HUMAN_GESTURE_SHAKE_HEAD";
import { HUMAN_GESTURE_SHRUG } from "./presets/HUMAN_GESTURE_SHRUG";
import { HUMAN_GESTURE_SLUMP } from "./presets/HUMAN_GESTURE_SLUMP";
import { HUMAN_GESTURE_SQUARE_SHOULDERS } from "./presets/HUMAN_GESTURE_SQUARE_SHOULDERS";
import { HUMAN_GESTURE_STOP_PALM } from "./presets/HUMAN_GESTURE_STOP_PALM";
import { HUMAN_GESTURE_THUMBS_DOWN } from "./presets/HUMAN_GESTURE_THUMBS_DOWN";
import { HUMAN_GESTURE_TOUCH_FACE } from "./presets/HUMAN_GESTURE_TOUCH_FACE";
import { HUMAN_GESTURE_WAVE } from "./presets/HUMAN_GESTURE_WAVE";

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
 * - `EMBLEM_PALMS_TOGETHER`: The values the `palmsTogether` row of `HumanEmblem`
 *   fixes on `gesture`, spread into its parameters.
 * - `EMBLEM_HANDS_UP`: The values the `handsUp` row of `HumanEmblem` fixes on
 *   `gesture`, spread into its parameters.
 * - `EMBLEM_HALT`: The values the `halt` row of `HumanEmblem` fixes on `gesture`,
 *   spread into its parameters.
 * - `EMBLEM_COME_HERE`: The values the `comeHere` row of `HumanEmblem` fixes on
 *   `gesture`, spread into its parameters.
 * - `EMBLEM_DONT_KNOW`: The values the `dontKnow` row of `HumanEmblem` fixes on
 *   `gesture`, spread into its parameters.
 * - `EMBLEM_THUMBS_UP`: The values the `thumbsUp` row of `HumanEmblem` fixes on
 *   `gesture`, spread into its parameters.
 * - `EMBLEM_THUMBS_DOWN`: The values the `thumbsDown` row of `HumanEmblem` fixes
 *   on `gesture`, spread into its parameters.
 * - `EMBLEM_OK_SIGN`: The values the `okSign` row of `HumanEmblem` fixes on
 *   `gesture`, spread into its parameters.
 * - `EMBLEM_VICTORY_SIGN`: The values the `victorySign` row of `HumanEmblem`
 *   fixes on `gesture`, spread into its parameters.
 * - `EMBLEM_CROSSED_FINGERS`: The values the `crossedFingers` row of
 *   `HumanEmblem` fixes on `gesture`, spread into its parameters.
 * - `EMBLEM_COUNT_ONE`: The values the `countOne` row of `HumanEmblem` fixes on
 *   `gesture`, spread into its parameters.
 * - `EMBLEM_COUNT_TWO`: The values the `countTwo` row of `HumanEmblem` fixes on
 *   `gesture`, spread into its parameters.
 * - `EMBLEM_COUNT_THREE`: The values the `countThree` row of `HumanEmblem` fixes
 *   on `gesture`, spread into its parameters.
 * - `EMBLEM_COUNT_FOUR`: The values the `countFour` row of `HumanEmblem` fixes on
 *   `gesture`, spread into its parameters.
 * - `EMBLEM_COUNT_FIVE`: The values the `countFive` row of `HumanEmblem` fixes on
 *   `gesture`, spread into its parameters.
 * - `EMBLEM_SHAKE_FIST`: The values the `shakeFist` row of `HumanEmblem` fixes on
 *   `gesture`, spread into its parameters.
 * - `EMBLEM_FINGER_SNAP`: The values the `fingerSnap` row of `HumanEmblem` fixes
 *   on `gesture`, spread into its parameters.
 * - `EMBLEM_AIR_QUOTES`: The values the `airQuotes` row of `HumanEmblem` fixes on
 *   `gesture`, spread into its parameters.
 * - `PHRASE_WAVE_HAND`: The values the `waveHand` row of `HumanUpperRows` fixes
 *   on `armPhrase`, spread into its parameters.
 * - `PHRASE_RAISE_HAND_HIGH`: The values the `raiseHandHigh` row of
 *   `HumanUpperRows` fixes on `armPhrase`, spread into its parameters.
 * - `PHRASE_STOP_HAND`: The values the `stopHand` row of `HumanUpperRows` fixes
 *   on `armPhrase`, spread into its parameters.
 * - `PHRASE_POINT_AT`: The values the `pointAt` row of `HumanUpperRows` fixes on
 *   `armPhrase`, spread into its parameters.
 * - `PHRASE_TAP_ON`: The values the `tapOn` row of `HumanUpperRows` fixes on
 *   `armPhrase`, spread into its parameters.
 * - `PHRASE_PRESS_ON`: The values the `pressOn` row of `HumanUpperRows` fixes on
 *   `armPhrase`, spread into its parameters.
 * - `PHRASE_RUB_ON`: The values the `rubOn` row of `HumanUpperRows` fixes on
 *   `armPhrase`, spread into its parameters.
 * - `PHRASE_STROKE_DOWN`: The values the `strokeDown` row of `HumanUpperRows`
 *   fixes on `armPhrase`, spread into its parameters.
 * - `PHRASE_HAND_ON_HIP`: The values the `handOnHip` row of `HumanUpperRows`
 *   fixes on `armPhrase`, spread into its parameters.
 * - `PHRASE_CHIN_ON_FIST`: The values the `chinOnFist` row of `HumanUpperRows`
 *   fixes on `armPhrase`, spread into its parameters.
 * - `PHRASE_WIPE_MOUTH_ACROSS`: The values the `wipeMouthAcross` row of
 *   `HumanUpperRows` fixes on `armPhrase`, spread into its parameters.
 * - `PHRASE_WIPE_ACROSS`: The values the `wipeAcross` row of `HumanUpperRows`
 *   fixes on `armPhrase`, spread into its parameters.
 * - `PHRASE_HAMMER_STROKES`: The values the `hammerStrokes` row of
 *   `HumanUpperRows` fixes on `armPhrase`, spread into its parameters.
 * - `PHRASE_SAW_STROKES`: The values the `sawStrokes` row of `HumanUpperRows`
 *   fixes on `armPhrase`, spread into its parameters.
 * - `PHRASE_STIR_STROKES`: The values the `stirStrokes` row of `HumanUpperRows`
 *   fixes on `armPhrase`, spread into its parameters.
 * - `PHRASE_HAT_ON_HEAD`: The values the `hatOnHead` row of `HumanUpperRows`
 *   fixes on `armPhrase`, spread into its parameters.
 * - `PHRASE_PALM_UP`: The values the `palmUp` row of `HumanUpperRows` fixes on
 *   `armPhrase`, spread into its parameters.
 * - `PHRASE_GLASSES_UP`: The values the `glassesUp` row of `HumanUpperRows` fixes
 *   on `armPhrase`, spread into its parameters.
 * - `PHRASE_HEAD_SCRATCH`: The values the `headScratch` row of `HumanUpperRows`
 *   fixes on `armPhrase`, spread into its parameters.
 * - `PHRASE_CHEEK_IN_HAND`: The values the `cheekInHand` row of `HumanUpperRows`
 *   fixes on `armPhrase`, spread into its parameters.
 * - `PHRASE_HAND_IN_POCKET`: The values the `handInPocket` row of
 *   `HumanUpperRows` fixes on `armPhrase`, spread into its parameters.
 * - `PHRASE_HAND_BEHIND_HEAD`: The values the `handBehindHead` row of
 *   `HumanUpperRows` fixes on `armPhrase`, spread into its parameters.
 * - `PHRASE_PHONE_TO_EAR`: The values the `phoneToEar` row of `HumanUpperRows`
 *   fixes on `armPhrase`, spread into its parameters.
 * - `PHRASE_TEETH_BRUSHING`: The values the `teethBrushing` row of
 *   `HumanUpperRows` fixes on `armPhrase`, spread into its parameters.
 * - `PHRASE_HAIR_COMBING`: The values the `hairCombing` row of `HumanUpperRows`
 *   fixes on `armPhrase`, spread into its parameters.
 * - `PHRASE_CLAP_HANDS`: The values the `clapHands` row of `HumanUpperRows` fixes
 *   on `armPhrase`, spread into its parameters.
 * - `PHRASE_RUB_PALMS`: The values the `rubPalms` row of `HumanUpperRows` fixes
 *   on `armPhrase`, spread into its parameters.
 * - `PHRASE_HANDS_TOGETHER_FRONT`: The values the `handsTogetherFront` row of
 *   `HumanUpperRows` fixes on `armPhrase`, spread into its parameters.
 * - `PHRASE_CHEER_HANDS`: The values the `cheerHands` row of `HumanUpperRows`
 *   fixes on `armPhrase`, spread into its parameters.
 * - `PHRASE_BECKON_HAND`: The values the `beckonHand` row of `HumanUpperRows`
 *   fixes on `armPhrase`, spread into its parameters.
 * - `PHRASE_FOLD_ARMS`: The values the `foldArms` row of `HumanUpperRows` fixes
 *   on `armPhrase`, spread into its parameters.
 * - `PHRASE_HANDS_CLASPED_BEHIND`: The values the `handsClaspedBehind` row of
 *   `HumanUpperRows` fixes on `armPhrase`, spread into its parameters.
 * - `PHRASE_ARM_AT_SIDE`: The values the `armAtSide` row of `HumanUpperRows`
 *   fixes on `armPhrase`, spread into its parameters.
 * - `PHRASE_PAT_ON`: The values the `patOn` row of `HumanUpperRows` fixes on
 *   `armPhrase`, spread into its parameters.
 * - `PHRASE_SQUEEZE_ON`: The values the `squeezeOn` row of `HumanUpperRows` fixes
 *   on `armPhrase`, spread into its parameters.
 * - `PHRASE_HOLD_ON`: The values the `holdOn` row of `HumanUpperRows` fixes on
 *   `armPhrase`, spread into its parameters.
 * - `PHRASE_DRINK_FROM`: The values the `drinkFrom` row of `HumanUpperRows` fixes
 *   on `armPhrase`, spread into its parameters.
 * - `PHRASE_EAT_WITH`: The values the `eatWith` row of `HumanUpperRows` fixes on
 *   `armPhrase`, spread into its parameters.
 * - `PHRASE_SCRATCH_ON`: The values the `scratchOn` row of `HumanUpperRows` fixes
 *   on `armPhrase`, spread into its parameters.
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
   * A communicative gesture while standing: the hand, head or trunk moves
   * through Kendon's phases (Kendon 1980; McNeill 1992, Hand and Mind):
   * preparation from rest to the stroke's start, the stroke that carries the
   * meaning, an optional post-stroke hold, and retraction to rest.
   *
   * The feet stay planted and the body stands as the stand law places it;
   * performed over a carrier (a walk, a seat, a ride) the body is the
   * carrier's, instant by instant, and the gesture takes only the parts it
   * moves. Each moving hand is an effector goal ({@link gestureStroke}), solved
   * by inverse kinematics with a natural elbow hint widened by the gesture and
   * the Effort; the moving arms are planned over the whole gesture as one
   * trajectory (`gestureHands.planned`): from what the entry left to the
   * stroke's goals in the preparation, on them through the stroke, and back to
   * the relaxed hanging arm's in the retraction, while the fingers take the
   * gesture's shape and leave it on the same share. Head, shoulder and trunk
   * gestures add their joint angles under an envelope that rises in the
   * preparation and falls in the retraction; a bow pitches the whole trunk
   * about the hips by its depth (15, 30 or 45 degrees are the conventional
   * light, ordinary and deep bows) while the hips move back to keep the body
   * balanced over the feet (`HumanBalance.shift`).
   *
   * Transport time is the free-space time of the distance moved
   * (`AutoMovieMotionHumanTiming.transport`), and at least the time each moving
   * arm's arc takes within the audit's travel bound (`gestureHands.reaching`),
   * 0.3 s for head and shoulder gestures (no source found), and for a bow its
   * depth at the measured rates of standing bows, down in 1.21 s and up in 1.38
   * s for 60 degrees, held 0.95 s at the deepest (Kawabata et al. 2009, ISBS
   * 27). The Effort's tempo scales every phase, its extent the gesture's size
   * and its elbow term the arm's width ({@link HumanEffort}).
   *
   * The plan names the hands it moves (`hands`), so a gesture with a hand that
   * holds a prop is refused, naming the free hand.
   *
   * Events: `prepare`, `strokeStart`, `strokeEnd`, `retract`. A gesture may be
   * cut into another during its retraction, making a gesture unit, and into
   * standing or moving before its stroke or after it; its stroke is never cut,
   * since a cut stroke loses the gesture's meaning.
   */
  export import gesture = gestureLaw;

  /**
   * One arm phrase on a target: the hand visits a place, strokes along a path
   * or oscillates about a pose, on the standard instants of a phrase (Kendon
   * 1980's preparation, stroke, hold and retraction as BML's `ready`,
   * `strokeStart`, `stroke`, `strokeEnd` and `relax`). It is the law the
   * upper-body lexicon's rows are written over: a wave, a tap, a hand at rest
   * on the hip, a wipe across a table are each this law with its phrase, its
   * target and its hand fixed (`HumanUpperRows`), so they share one plan, one
   * set of refusals and one timing.
   *
   * The phrase moves the hand from where the entry pose holds it (its surface's
   * place in the performer's frame) to the target and back, by the vocabulary's
   * own arm phrases (`AutoMovieMotionHumanArmPhrase`: `visit`, `stroke`,
   * `oscillate`), and the composition keeps every other part as the carrier or
   * the entry state has it (`AutoMovieMotionHumanBase.under`). The target is
   * any `AutoMovieMotionTarget`, read where it is at the phrase's start: a
   * region of one's own body or another's, a prop's point, a point in the
   * performer's frame. An `offset` moves the target's point in the performer's
   * frame (out, up, forward) by shares of the arm's length (upper arm, forearm
   * and hand), so one row fits every body. The hand faces against the target's
   * normal with its fingers up, unless `facing` names it. A phrase that names a
   * `held` prop keeps the hand's grip on it over its whole span and leaves it
   * held, so a hammer, a spoon or a hat moves with the hand; a hand that does
   * not hold it at entry is refused. Such a phrase may name one of the held
   * prop's own points as its working `point` (a cup's lip, a fork's face): that
   * point, not the hand's surface, is brought to the target, the hand's surface
   * placed short of it by the point's lever from the surface in the hand's
   * frame, which the grip keeps fixed, and the hand turned so the point faces
   * into the target, unless `facing` names the turn. Both hands may perform one
   * phrase on one clock (a clap, palms rubbed together), each hand's offset
   * mirrored by its side, so two hands sent to one median target meet there;
   * such a phrase holds no prop.
   *
   * Timing: the preparation is a travel of the distance from the hand to the
   * phrase's first goal (a stroke's start, otherwise the target) and the
   * retraction one of the distance back from its last, the target
   * (`AutoMovieMotionHumanTiming.transport`); a visit's stroke is instant and
   * its hold the named `hold` pause (a beat when absent); a stroke takes one
   * travel of its path's length; an oscillation takes `cycles` beats. The
   * manner's tempo scales every phase and its extent and curvature reach the
   * phrase (`AutoMovieMotionManner`). Events: the phrase's instants.
   */
  export import armPhrase = armPhraseLaw;

  /**
   * The signals a gesture's stroke rides, each a function of the stroke's share
   * in [0, 1] that starts at rest: a windowed oscillation for the repeated
   * strokes, a single rise and fall, and a rise held to the end.
   */
  export import gestureSignal = gestureSignalLaw;

  /**
   * The stroke of each gesture: where each hand surface goes, turned which way
   * and in which shape, as a function of the stroke's progress, and which
   * joints a gesture moves directly.
   *
   * Hand gestures are effector goals. Each names a hand surface, a world point
   * and a hand rotation; the gesture law transports the hand there in the
   * preparation phase and back in the retraction, and the arm is solved by
   * inverse kinematics ({@link HumanHand}). Points are built in the performer's
   * own frame (`x` left, `y` up, `z` forward from the root) from the body's
   * measure, or on a target or on the body's own face, so every gesture fits
   * any stature and proportion. A place of the air is written in the names of
   * {@link AutoMovieMotionHumanTargetGrid.Place} (a height, a lateral and a
   * distance, with a nudge in arm lengths where the stroke moves about it), a
   * hand's turn in the axes of {@link HumanHand.Direction}, and a joint angle as
   * a level of {@link AutoMovieMotionHumanRange}:
   *
   * - `wave`: the open palm faces forward beside the head, at eye height, outside
   *   the shoulder and near; the hand swings side to side `0.06` arm lengths,
   *   tilting as the forearm turns about the elbow, about 2.5 cycles a second
   *   (provisional).
   * - `raiseHand`: the open palm forward, raised from the shoulder to overhead by
   *   the extent; `cheer` raises both fists and pumps them `0.08` arm lengths.
   * - `stopPalm`: the open palm faces forward at shoulder height, inside the
   *   shoulder and far, pushed `0.05` arm lengths further in the stroke.
   * - `point`: the index fingertip on the line from the eye on the pointing side
   *   to the target, as people point (Henriques and Crawford 2002, J
   *   Neurophysiol 87:1677, found the fingertip placed on the line from the
   *   dominant eye; the side's eye is the provisional choice), at the distance
   *   where the arm reaches with `0.95` of its length, the fingers along the
   *   line and the palm down.
   * - `palmsUp`: both open palms up, forearms forward at the waist, turned a
   *   quarter of the way out, set `0.15` arm lengths out and forward and lifted
   *   `0.03` in the stroke, the offering and not-knowing gesture; `shrug` adds
   *   it under raised shoulders.
   * - `beckon`: the palm up at chest height, `0.05` arm lengths lower and nearer,
   *   while the fingers curl and open, about 1.7 cycles a second
   *   (provisional).
   * - `clap`: both palms face each other ahead of the chest, `0.1` arm lengths
   *   below and `0.17` ahead of its place, part `0.09` and meet at the midpoint
   *   on each beat, four beats a second (free applause clusters near 4 Hz,
   *   faster than the near-2 Hz synchronised rhythm, Neda et al. 2000, Nature
   *   403:849).
   * - `thumbsDown`: the fist ahead of the chest, the palm outward and the
   *   knuckles ahead and 45 degrees down, so a straight thumb, which leans
   *   toward the knuckles, points down; the elbow is asked out at the
   *   shoulder's height, which leaves the forearm a quarter turn instead of a
   *   half (provisional place, tip and elbow).
   * - `rubHands`: the palms together, sliding `0.03` arm lengths opposite ways
   *   along the fingers.
   * - `palmsTogether`: the palms pressed together ahead of the chest, the fingers
   *   up and forward, held: the clap's hand pose without its parting (a prayer,
   *   a wai or gassho greeting).
   * - `touchFace`: the index fingertip, hand flat, on a face region with the palm
   *   toward the face and the fingers up, held; `pushGlasses` slides it 12 mm
   *   up the nose bridge; `scratchHead` rubs it 15 mm on the head's side four
   *   times a second (provisional).
   *
   * Gestures of the head, shoulders and trunk are joint angles, stated by
   * {@link gestureJoints}; pointing and self-touch read the posed trunk in
   * {@link gestureTouch}; the strokes ride the signals of {@link gestureSignal}.
   * Amplitudes and distances that express the gesture's size scale with the
   * Effort extent; contact points and the pointing line do not. Each hand goal
   * widens the elbow's hanging hint by its own share of the upper arm (`out`:
   * 0.3 for a wave, 0.2 for a raised hand, a cheer and open palms, 0.1 for
   * palms together, none for the rest; provisional, read from no measured
   * source). Every value above without a source is provisional.
   */
  export import gestureStroke = gestureStrokeLaw;

  /**
   * Arm goals that put hand surfaces on their points, the contact first and the
   * hand's turn as close as the arm allows.
   *
   * A hand goal names a surface, a point and a hand rotation. Each wrist is
   * placed for the asked rotation and the surface is declared as the goal's
   * contact (`AutoMovieMotionHumanArm.goal`), so where the arm cannot turn the
   * hand as asked the posture resolver re-aims the wrist until the surface
   * stays on its point and the rotation gives way.
   *
   * @param body The body.
   * @param posture The posture the arms are added to.
   * @param requests One target per moving hand; a target's `curl` is not read
   *   here.
   * @returns The posture with the arm goals set.
   */
  export const handGoals: typeof handGoalsLaw = handGoalsLaw;

  /**
   * The gestures as rows: each kind of `gesture` (emblems, self-adaptors and
   * displays, Ekman and Friesen 1969) under a name of its own, with every other
   * axis of the law open (the side, the target, the count, the hold, the
   * effort), so a production composes a gesture by its name on any base and
   * carrier the law admits.
   *
   * Each row writes no motion: its law plans it, so it fits any body, refuses
   * and is checked as the law is, and its draws are keyed by its own name. The
   * rows over the arm's phrases themselves are `HumanUpperRows`.
   */
  export import HumanGestureRows = HumanGestureRowsSource;

  /**
   * Emblems: gestures with a fixed meaning, each a row of a shipped action.
   * Register the ones a film uses (`HumanPerformance.IInput.laws`,
   * `HumanChain.extend`).
   */
  export import HumanEmblem = HumanEmblemSource;

  /**
   * The upper-body acts re-expressed as rows over the arm's phrases: each row
   * is `armPhrase` with its phrase, its hand and the shape of its target fixed,
   * so a gesture, a touch, a hand at rest, a hand to the face and a wipe share
   * one plan, one timing and one set of refusals, and each accepts any base,
   * carrier, side and manner the phrase law does. The rows of the older laws
   * (`gesture`, `touch`, `rest`, `handToFace`, `wipe`) stay until these rows
   * pass their verdicts; the target a touch or a wipe needs, and the prop a
   * tool row holds (`held`), are left open.
   *
   * A row is written for the right hand: the region of a side it fixes
   * (`hipRight`) is read on the acting hand's own side (`mirror`), so the same
   * row puts the left hand on the left hip.
   *
   * Every offset is a share of the arm's length (upper arm, forearm and hand)
   * in the performer's frame, so a row fits any body; the shares are
   * provisional, set from each act's description with no measured source read.
   *
   * Duration of every row (the phrase's timing, {@link armPhrase}): the hand
   * reaches its place in the free-space time of its travel and returns in as
   * long again, `0.25 + 0.5 D` seconds for `D` metres, about 0.5 s for a 0.5 m
   * reach ({@link AutoMovieMotionHumanTiming.transport}). A visit (a hand on the
   * hip, a phone to the ear, a hat on) holds the place for a beat, 0.4 s,
   * unless `hold` names another pause
   * ({@link AutoMovieMotionHumanTiming.PAUSES}). An oscillation (a wave, a rub,
   * a scratch, a stir) lasts 2 beats, 0.8 s, unless `cycles` says more.
   * `manner.pace` and the Effort `time` factor scale every phase. All of these
   * are provisional.
   */
  export import HumanUpperRows = HumanUpperRowsSource;

  /**
   * The values the `gestureWave` row of `HumanGestureRows` fixes on `gesture`,
   * spread into its parameters. `gesture` of kind `wave`: three swings of 0.4
   * s, a stroke of 1.2 s, plus the preparation and retraction; fits a greeting,
   * a farewell, hailing someone ({@link gestureStrokeTables.RHYTHM}, `count`
   * repeats the stroke).
   */
  export const WAVE: typeof HUMAN_GESTURE_WAVE = HUMAN_GESTURE_WAVE;

  /**
   * The values the `gestureRaiseHand` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `raiseHand`: one
   * raise of 0.5 s, plus the preparation and retraction; fits asking to speak,
   * volunteering, calling for attention ({@link gestureStrokeTables.RHYTHM},
   * `count` repeats the stroke).
   */
  export const RAISE_HAND: typeof HUMAN_GESTURE_RAISE_HAND =
    HUMAN_GESTURE_RAISE_HAND;

  /**
   * The values the `gestureCheer` row of `HumanGestureRows` fixes on `gesture`,
   * spread into its parameters. `gesture` of kind `cheer`: two raises of 0.5 s,
   * a stroke of 1.0 s, both hands, plus the preparation and retraction; fits
   * celebrating, a win, acclaim ({@link gestureStrokeTables.RHYTHM}, `count`
   * repeats the stroke).
   */
  export const CHEER: typeof HUMAN_GESTURE_CHEER = HUMAN_GESTURE_CHEER;

  /**
   * The values the `gestureStopPalm` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `stopPalm`: one
   * push of 0.35 s, plus the preparation and retraction; fits halting someone,
   * refusing, "wait" ({@link gestureStrokeTables.RHYTHM}, `count` repeats the
   * stroke).
   */
  export const STOP_PALM: typeof HUMAN_GESTURE_STOP_PALM =
    HUMAN_GESTURE_STOP_PALM;

  /**
   * The values the `gesturePoint` row of `HumanGestureRows` fixes on `gesture`,
   * spread into its parameters. `gesture` of kind `point`: one point of 0.5 s,
   * plus the preparation and retraction; fits showing a thing or a direction to
   * someone ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const POINT: typeof HUMAN_GESTURE_POINT = HUMAN_GESTURE_POINT;

  /**
   * The values the `gesturePalmsUp` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `palmsUp`: one
   * opening of 0.6 s, both hands, plus the preparation and retraction; fits "I
   * do not know", an appeal, offering an explanation
   * ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const PALMS_UP: typeof HUMAN_GESTURE_PALMS_UP = HUMAN_GESTURE_PALMS_UP;

  /**
   * The values the `gestureBeckon` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `beckon`: two
   * curls of 0.6 s, a stroke of 1.2 s, plus the preparation and retraction;
   * fits calling someone over ({@link gestureStrokeTables.RHYTHM}, `count`
   * repeats the stroke).
   */
  export const BECKON: typeof HUMAN_GESTURE_BECKON = HUMAN_GESTURE_BECKON;

  /**
   * The values the `gestureClap` row of `HumanGestureRows` fixes on `gesture`,
   * spread into its parameters. `gesture` of kind `clap`: four claps at 4 a
   * second (Neda et al. 2000), a stroke of 1.0 s, both hands, plus the
   * preparation and retraction; fits applause, a cheer, getting attention
   * ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const CLAP: typeof HUMAN_GESTURE_CLAP = HUMAN_GESTURE_CLAP;

  /**
   * The values the `gestureRubHands` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `rubHands`: three
   * rubs of 0.35 s, a stroke of 1.05 s, both hands, plus the preparation and
   * retraction; fits anticipation, cold, scheming
   * ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const RUB_HANDS: typeof HUMAN_GESTURE_RUB_HANDS =
    HUMAN_GESTURE_RUB_HANDS;

  /**
   * The values the `gesturePalmsTogether` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `palmsTogether`:
   * one close of 0.8 s, both hands, plus the preparation and retraction; fits a
   * plea, a prayer, thanks ({@link gestureStrokeTables.RHYTHM}, `count` repeats
   * the stroke).
   */
  export const PALMS_TOGETHER: typeof HUMAN_GESTURE_PALMS_TOGETHER =
    HUMAN_GESTURE_PALMS_TOGETHER;

  /**
   * The values the `gestureThumbsDown` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `thumbsDown`: a
   * held sign of 0.8 s, plus the preparation and retraction; fits disapproval,
   * rejection ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const THUMBS_DOWN: typeof HUMAN_GESTURE_THUMBS_DOWN =
    HUMAN_GESTURE_THUMBS_DOWN;

  /**
   * The values the `gestureTouchFace` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `touchFace`: a
   * held touch of 0.8 s, plus the preparation and retraction; fits thinking,
   * doubt, embarrassment ({@link gestureStrokeTables.RHYTHM}, `count` repeats
   * the stroke).
   */
  export const TOUCH_FACE: typeof HUMAN_GESTURE_TOUCH_FACE =
    HUMAN_GESTURE_TOUCH_FACE;

  /**
   * The values the `gesturePushGlasses` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `pushGlasses`: one
   * push of 0.3 s, plus the preparation and retraction; fits a nervous or
   * studious beat ({@link gestureStrokeTables.RHYTHM}, `count` repeats the
   * stroke).
   */
  export const PUSH_GLASSES: typeof HUMAN_GESTURE_PUSH_GLASSES =
    HUMAN_GESTURE_PUSH_GLASSES;

  /**
   * The values the `gestureScratchHead` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `scratchHead`:
   * four scratches of 0.25 s, a stroke of 1.0 s, plus the preparation and
   * retraction; fits puzzlement, confusion ({@link gestureStrokeTables.RHYTHM},
   * `count` repeats the stroke).
   */
  export const SCRATCH_HEAD: typeof HUMAN_GESTURE_SCRATCH_HEAD =
    HUMAN_GESTURE_SCRATCH_HEAD;

  /**
   * The values the `gestureShrug` row of `HumanGestureRows` fixes on `gesture`,
   * spread into its parameters. `gesture` of kind `shrug`: one shrug of 0.7 s,
   * both shoulders, plus the preparation and retraction; fits indifference, "I
   * do not know" ({@link gestureStrokeTables.RHYTHM}, `count` repeats the
   * stroke).
   */
  export const SHRUG: typeof HUMAN_GESTURE_SHRUG = HUMAN_GESTURE_SHRUG;

  /**
   * The values the `gestureNod` row of `HumanGestureRows` fixes on `gesture`,
   * spread into its parameters. `gesture` of kind `nod`: two nods of 0.5 s, a
   * stroke of 1.0 s, plus the preparation and retraction; fits yes, agreement,
   * acknowledgement ({@link gestureStrokeTables.RHYTHM}, `count` repeats the
   * stroke).
   */
  export const NOD: typeof HUMAN_GESTURE_NOD = HUMAN_GESTURE_NOD;

  /**
   * The values the `gestureShakeHead` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `shakeHead`: three
   * turns of 0.45 s, a stroke of 1.35 s, plus the preparation and retraction;
   * fits no, disagreement, disbelief ({@link gestureStrokeTables.RHYTHM},
   * `count` repeats the stroke).
   */
  export const SHAKE_HEAD: typeof HUMAN_GESTURE_SHAKE_HEAD =
    HUMAN_GESTURE_SHAKE_HEAD;

  /**
   * The values the `gestureBow` row of `HumanGestureRows` fixes on `gesture`,
   * spread into its parameters. `gesture` of kind `bow`: the trunk goes down at
   * about 50 degrees a second, is held 0.95 s at the deepest (Kawabata et al.
   * 2009) and comes up at about 43 degrees a second; 30 degrees when `depth` is
   * absent, plus the preparation and retraction; fits a greeting of respect,
   * thanks, an apology ({@link gestureStrokeTables.RHYTHM}, `count` repeats the
   * stroke).
   */
  export const BOW: typeof HUMAN_GESTURE_BOW = HUMAN_GESTURE_BOW;

  /**
   * The values the `gestureChinLift` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `chinLift`: a held
   * pose of 0.8 s, plus the preparation and retraction; fits pride, defiance
   * ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const CHIN_LIFT: typeof HUMAN_GESTURE_CHIN_LIFT =
    HUMAN_GESTURE_CHIN_LIFT;

  /**
   * The values the `gestureSquareShoulders` row of `HumanGestureRows` fixes on
   * `gesture`, spread into its parameters. `gesture` of kind `squareShoulders`:
   * a held pose of 0.8 s, plus the preparation and retraction; fits resolve,
   * readiness ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const SQUARE_SHOULDERS: typeof HUMAN_GESTURE_SQUARE_SHOULDERS =
    HUMAN_GESTURE_SQUARE_SHOULDERS;

  /**
   * The values the `gestureSlump` row of `HumanGestureRows` fixes on `gesture`,
   * spread into its parameters. `gesture` of kind `slump`: a held pose of 0.8
   * s, plus the preparation and retraction; fits defeat, exhaustion, dejection
   * ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
   */
  export const SLUMP: typeof HUMAN_GESTURE_SLUMP = HUMAN_GESTURE_SLUMP;

  /**
   * The values the `palmsTogether` row of `HumanEmblem` fixes on `gesture`,
   * spread into its parameters. Palms together ahead of the chest, as a prayer
   * or a greeting (wai, gassho): the gesture's held meeting of the two palms.
   */
  export const EMBLEM_PALMS_TOGETHER: typeof HUMAN_GESTURE_EMBLEM_PALMS_TOGETHER =
    HUMAN_GESTURE_EMBLEM_PALMS_TOGETHER;

  /**
   * The values the `handsUp` row of `HumanEmblem` fixes on `gesture`, spread
   * into its parameters. Both hands raised in surrender.
   */
  export const EMBLEM_HANDS_UP: typeof HUMAN_GESTURE_EMBLEM_HANDS_UP =
    HUMAN_GESTURE_EMBLEM_HANDS_UP;

  /**
   * The values the `halt` row of `HumanEmblem` fixes on `gesture`, spread into
   * its parameters. A stop sign: the palm held out.
   */
  export const EMBLEM_HALT: typeof HUMAN_GESTURE_EMBLEM_HALT =
    HUMAN_GESTURE_EMBLEM_HALT;

  /**
   * The values the `comeHere` row of `HumanEmblem` fixes on `gesture`, spread
   * into its parameters. A summons: the beckoning hand.
   */
  export const EMBLEM_COME_HERE: typeof HUMAN_GESTURE_EMBLEM_COME_HERE =
    HUMAN_GESTURE_EMBLEM_COME_HERE;

  /**
   * The values the `dontKnow` row of `HumanEmblem` fixes on `gesture`, spread
   * into its parameters. "I do not know": the shrug with the palms turned up.
   */
  export const EMBLEM_DONT_KNOW: typeof HUMAN_GESTURE_EMBLEM_DONT_KNOW =
    HUMAN_GESTURE_EMBLEM_DONT_KNOW;

  /**
   * The values the `thumbsUp` row of `HumanEmblem` fixes on `gesture`, spread
   * into its parameters. A thumbs up: the fist held out before the shoulder,
   * turned a quarter in its palm's plane and then aimed so the straight thumb
   * itself stands up (it lies about 35 degrees off the knuckle line, so the
   * quarter turn alone left it 42 degrees off).
   */
  export const EMBLEM_THUMBS_UP: typeof HUMAN_GESTURE_EMBLEM_THUMBS_UP =
    HUMAN_GESTURE_EMBLEM_THUMBS_UP;

  /**
   * The values the `thumbsDown` row of `HumanEmblem` fixes on `gesture`, spread
   * into its parameters. A thumbs down: the fist ahead of the shoulder with the
   * forearm turned over and the elbow raised outward, aimed so the straight
   * thumb itself points down.
   */
  export const EMBLEM_THUMBS_DOWN: typeof HUMAN_GESTURE_EMBLEM_THUMBS_DOWN =
    HUMAN_GESTURE_EMBLEM_THUMBS_DOWN;

  /**
   * The values the `okSign` row of `HumanEmblem` fixes on `gesture`, spread
   * into its parameters. The OK sign: the forefinger and thumb in a ring, held
   * out (first pass, provisional attitude).
   */
  export const EMBLEM_OK_SIGN: typeof HUMAN_GESTURE_EMBLEM_OK_SIGN =
    HUMAN_GESTURE_EMBLEM_OK_SIGN;

  /**
   * The values the `victorySign` row of `HumanEmblem` fixes on `gesture`,
   * spread into its parameters. The V sign: forefinger and middle finger
   * spread, held out (first pass, provisional attitude).
   */
  export const EMBLEM_VICTORY_SIGN: typeof HUMAN_GESTURE_EMBLEM_VICTORY_SIGN =
    HUMAN_GESTURE_EMBLEM_VICTORY_SIGN;

  /**
   * The values the `crossedFingers` row of `HumanEmblem` fixes on `gesture`,
   * spread into its parameters. Crossed fingers, held out (first pass,
   * provisional attitude).
   */
  export const EMBLEM_CROSSED_FINGERS: typeof HUMAN_GESTURE_EMBLEM_CROSSED_FINGERS =
    HUMAN_GESTURE_EMBLEM_CROSSED_FINGERS;

  /**
   * The values the `countOne` row of `HumanEmblem` fixes on `gesture`, spread
   * into its parameters. Counting one on the fingers, from the forefinger on
   * (one convention; cultures differ).
   */
  export const EMBLEM_COUNT_ONE: typeof HUMAN_GESTURE_EMBLEM_COUNT_ONE =
    HUMAN_GESTURE_EMBLEM_COUNT_ONE;

  /**
   * The values the `countTwo` row of `HumanEmblem` fixes on `gesture`, spread
   * into its parameters. Counting two on the fingers.
   */
  export const EMBLEM_COUNT_TWO: typeof HUMAN_GESTURE_EMBLEM_COUNT_TWO =
    HUMAN_GESTURE_EMBLEM_COUNT_TWO;

  /**
   * The values the `countThree` row of `HumanEmblem` fixes on `gesture`, spread
   * into its parameters. Counting three on the fingers.
   */
  export const EMBLEM_COUNT_THREE: typeof HUMAN_GESTURE_EMBLEM_COUNT_THREE =
    HUMAN_GESTURE_EMBLEM_COUNT_THREE;

  /**
   * The values the `countFour` row of `HumanEmblem` fixes on `gesture`, spread
   * into its parameters. Counting four on the fingers.
   */
  export const EMBLEM_COUNT_FOUR: typeof HUMAN_GESTURE_EMBLEM_COUNT_FOUR =
    HUMAN_GESTURE_EMBLEM_COUNT_FOUR;

  /**
   * The values the `countFive` row of `HumanEmblem` fixes on `gesture`, spread
   * into its parameters. Counting five on the fingers: the open hand.
   */
  export const EMBLEM_COUNT_FIVE: typeof HUMAN_GESTURE_EMBLEM_COUNT_FIVE =
    HUMAN_GESTURE_EMBLEM_COUNT_FIVE;

  /**
   * The values the `shakeFist` row of `HumanEmblem` fixes on `gesture`, spread
   * into its parameters. A shaken fist: the raised fist swung from side to side
   * (first pass on the wave's stroke, provisional).
   */
  export const EMBLEM_SHAKE_FIST: typeof HUMAN_GESTURE_EMBLEM_SHAKE_FIST =
    HUMAN_GESTURE_EMBLEM_SHAKE_FIST;

  /**
   * The values the `fingerSnap` row of `HumanEmblem` fixes on `gesture`, spread
   * into its parameters. The hand set for a finger snap: the middle fingertip
   * on the thumb's, held out (first pass: the snap's release is not moved).
   */
  export const EMBLEM_FINGER_SNAP: typeof HUMAN_GESTURE_EMBLEM_FINGER_SNAP =
    HUMAN_GESTURE_EMBLEM_FINGER_SNAP;

  /**
   * The values the `airQuotes` row of `HumanEmblem` fixes on `gesture`, spread
   * into its parameters. Air quotes: both hands raised with two fingers hooked
   * (first pass on the raised hands of a cheer; the fingers do not flex twice
   * yet).
   */
  export const EMBLEM_AIR_QUOTES: typeof HUMAN_GESTURE_EMBLEM_AIR_QUOTES =
    HUMAN_GESTURE_EMBLEM_AIR_QUOTES;

  /**
   * The values the `waveHand` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A wave: the open hand oscillates out and in,
   * raised beside the head, palm forward.
   */
  export const PHRASE_WAVE_HAND: typeof HUMAN_GESTURE_PHRASE_WAVE_HAND =
    HUMAN_GESTURE_PHRASE_WAVE_HAND;

  /**
   * The values the `raiseHandHigh` row of `HumanUpperRows` fixes on
   * `armPhrase`, spread into its parameters. A raised hand: the open hand
   * visits a place above the shoulder, palm forward, and holds it.
   */
  export const PHRASE_RAISE_HAND_HIGH: typeof HUMAN_GESTURE_PHRASE_RAISE_HAND_HIGH =
    HUMAN_GESTURE_PHRASE_RAISE_HAND_HIGH;

  /**
   * The values the `stopHand` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A stop sign: the open hand held out ahead at
   * shoulder height, palm forward.
   */
  export const PHRASE_STOP_HAND: typeof HUMAN_GESTURE_PHRASE_STOP_HAND =
    HUMAN_GESTURE_PHRASE_STOP_HAND;

  /**
   * The values the `pointAt` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A point: the forefinger's tip visits a place on
   * the target's line, the hand pointing.
   */
  export const PHRASE_POINT_AT: typeof HUMAN_GESTURE_PHRASE_POINT_AT =
    HUMAN_GESTURE_PHRASE_POINT_AT;

  /**
   * The values the `tapOn` row of `HumanUpperRows` fixes on `armPhrase`, spread
   * into its parameters. A tap: the fingertips visit the target with no hold.
   */
  export const PHRASE_TAP_ON: typeof HUMAN_GESTURE_PHRASE_TAP_ON =
    HUMAN_GESTURE_PHRASE_TAP_ON;

  /**
   * The values the `pressOn` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A press: the palm visits the target and holds.
   */
  export const PHRASE_PRESS_ON: typeof HUMAN_GESTURE_PHRASE_PRESS_ON =
    HUMAN_GESTURE_PHRASE_PRESS_ON;

  /**
   * The values the `rubOn` row of `HumanUpperRows` fixes on `armPhrase`, spread
   * into its parameters. A rub: the palm oscillates across the target.
   */
  export const PHRASE_RUB_ON: typeof HUMAN_GESTURE_PHRASE_RUB_ON =
    HUMAN_GESTURE_PHRASE_RUB_ON;

  /**
   * The values the `strokeDown` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A stroke: the palm draws down along the
   * target.
   */
  export const PHRASE_STROKE_DOWN: typeof HUMAN_GESTURE_PHRASE_STROKE_DOWN =
    HUMAN_GESTURE_PHRASE_STROKE_DOWN;

  /**
   * The values the `handOnHip` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Hand on the hip: the palm visits the near hip
   * and stays.
   */
  export const PHRASE_HAND_ON_HIP: typeof HUMAN_GESTURE_PHRASE_HAND_ON_HIP =
    HUMAN_GESTURE_PHRASE_HAND_ON_HIP;

  /**
   * The values the `chinOnFist` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Chin in hand: the fist visits the chin and
   * stays.
   */
  export const PHRASE_CHIN_ON_FIST: typeof HUMAN_GESTURE_PHRASE_CHIN_ON_FIST =
    HUMAN_GESTURE_PHRASE_CHIN_ON_FIST;

  /**
   * The values the `wipeMouthAcross` row of `HumanUpperRows` fixes on
   * `armPhrase`, spread into its parameters. Wiping the mouth: the back of the
   * hand draws across the lips.
   */
  export const PHRASE_WIPE_MOUTH_ACROSS: typeof HUMAN_GESTURE_PHRASE_WIPE_MOUTH_ACROSS =
    HUMAN_GESTURE_PHRASE_WIPE_MOUTH_ACROSS;

  /**
   * The values the `wipeAcross` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Wiping a surface: the flat palm oscillates
   * across the target.
   */
  export const PHRASE_WIPE_ACROSS: typeof HUMAN_GESTURE_PHRASE_WIPE_ACROSS =
    HUMAN_GESTURE_PHRASE_WIPE_ACROSS;

  /**
   * The values the `hammerStrokes` row of `HumanUpperRows` fixes on
   * `armPhrase`, spread into its parameters. Hammering: the fist that holds the
   * hammer strikes down and back on the target, up and down.
   */
  export const PHRASE_HAMMER_STROKES: typeof HUMAN_GESTURE_PHRASE_HAMMER_STROKES =
    HUMAN_GESTURE_PHRASE_HAMMER_STROKES;

  /**
   * The values the `sawStrokes` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Sawing: the fist that holds the saw draws
   * forward and back over the target.
   */
  export const PHRASE_SAW_STROKES: typeof HUMAN_GESTURE_PHRASE_SAW_STROKES =
    HUMAN_GESTURE_PHRASE_SAW_STROKES;

  /**
   * The values the `stirStrokes` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Stirring: the fist that holds the spoon circles
   * out and in over the pot.
   */
  export const PHRASE_STIR_STROKES: typeof HUMAN_GESTURE_PHRASE_STIR_STROKES =
    HUMAN_GESTURE_PHRASE_STIR_STROKES;

  /**
   * The values the `hatOnHead` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Putting on a hat: the hand that holds it visits
   * the crown and stays a beat.
   */
  export const PHRASE_HAT_ON_HEAD: typeof HUMAN_GESTURE_PHRASE_HAT_ON_HEAD =
    HUMAN_GESTURE_PHRASE_HAT_ON_HEAD;

  /**
   * The values the `palmUp` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Palms up: the open hand held out ahead at waist
   * height, palm up.
   */
  export const PHRASE_PALM_UP: typeof HUMAN_GESTURE_PHRASE_PALM_UP =
    HUMAN_GESTURE_PHRASE_PALM_UP;

  /**
   * The values the `glassesUp` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Pushing up one's glasses: the forefinger's tip
   * visits the bridge of the nose.
   */
  export const PHRASE_GLASSES_UP: typeof HUMAN_GESTURE_PHRASE_GLASSES_UP =
    HUMAN_GESTURE_PHRASE_GLASSES_UP;

  /**
   * The values the `headScratch` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Scratching the head: the forefinger's tip
   * oscillates on the crown.
   */
  export const PHRASE_HEAD_SCRATCH: typeof HUMAN_GESTURE_PHRASE_HEAD_SCRATCH =
    HUMAN_GESTURE_PHRASE_HEAD_SCRATCH;

  /**
   * The values the `cheekInHand` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A hand to the cheek: the palm visits the cheek
   * and stays a beat.
   */
  export const PHRASE_CHEEK_IN_HAND: typeof HUMAN_GESTURE_PHRASE_CHEEK_IN_HAND =
    HUMAN_GESTURE_PHRASE_CHEEK_IN_HAND;

  /**
   * The values the `handInPocket` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A hand in the pocket: the fingertips visit the
   * front pocket and stay.
   */
  export const PHRASE_HAND_IN_POCKET: typeof HUMAN_GESTURE_PHRASE_HAND_IN_POCKET =
    HUMAN_GESTURE_PHRASE_HAND_IN_POCKET;

  /**
   * The values the `handBehindHead` row of `HumanUpperRows` fixes on
   * `armPhrase`, spread into its parameters. A hand behind the head: the palm
   * visits the back of the head and stays.
   */
  export const PHRASE_HAND_BEHIND_HEAD: typeof HUMAN_GESTURE_PHRASE_HAND_BEHIND_HEAD =
    HUMAN_GESTURE_PHRASE_HAND_BEHIND_HEAD;

  /**
   * The values the `phoneToEar` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A phone to the ear: the hand that holds it
   * visits the ear and stays.
   */
  export const PHRASE_PHONE_TO_EAR: typeof HUMAN_GESTURE_PHRASE_PHONE_TO_EAR =
    HUMAN_GESTURE_PHRASE_PHONE_TO_EAR;

  /**
   * The values the `teethBrushing` row of `HumanUpperRows` fixes on
   * `armPhrase`, spread into its parameters. Brushing the teeth: the hand that
   * holds the brush oscillates before the mouth.
   */
  export const PHRASE_TEETH_BRUSHING: typeof HUMAN_GESTURE_PHRASE_TEETH_BRUSHING =
    HUMAN_GESTURE_PHRASE_TEETH_BRUSHING;

  /**
   * The values the `hairCombing` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Combing: the hand that holds the comb draws it
   * back over the crown.
   */
  export const PHRASE_HAIR_COMBING: typeof HUMAN_GESTURE_PHRASE_HAIR_COMBING =
    HUMAN_GESTURE_PHRASE_HAIR_COMBING;

  /**
   * The values the `clapHands` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Clapping: both palms meet ahead of the chest
   * and part, out and in.
   */
  export const PHRASE_CLAP_HANDS: typeof HUMAN_GESTURE_PHRASE_CLAP_HANDS =
    HUMAN_GESTURE_PHRASE_CLAP_HANDS;

  /**
   * The values the `rubPalms` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Rubbing the hands: both palms together ahead of
   * the chest, sliding up and down.
   */
  export const PHRASE_RUB_PALMS: typeof HUMAN_GESTURE_PHRASE_RUB_PALMS =
    HUMAN_GESTURE_PHRASE_RUB_PALMS;

  /**
   * The values the `handsTogetherFront` row of `HumanUpperRows` fixes on
   * `armPhrase`, spread into its parameters. Hands clasped in front: both palms
   * meet before the abdomen and stay.
   */
  export const PHRASE_HANDS_TOGETHER_FRONT: typeof HUMAN_GESTURE_PHRASE_HANDS_TOGETHER_FRONT =
    HUMAN_GESTURE_PHRASE_HANDS_TOGETHER_FRONT;

  /**
   * The values the `cheerHands` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A cheer: both open hands visit places above and
   * beside the head, palms forward, for a beat.
   */
  export const PHRASE_CHEER_HANDS: typeof HUMAN_GESTURE_PHRASE_CHEER_HANDS =
    HUMAN_GESTURE_PHRASE_CHEER_HANDS;

  /**
   * The values the `beckonHand` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A beckon: the open hand held out ahead, palm
   * up, draws in toward the chest and out again.
   */
  export const PHRASE_BECKON_HAND: typeof HUMAN_GESTURE_PHRASE_BECKON_HAND =
    HUMAN_GESTURE_PHRASE_BECKON_HAND;

  /**
   * The values the `foldArms` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Folding the arms: each hand visits the far arm
   * before the chest, the forearms folded, and stays (the phrase that reaches
   * `HumanStance.armsCrossed`, which holds the rest itself).
   */
  export const PHRASE_FOLD_ARMS: typeof HUMAN_GESTURE_PHRASE_FOLD_ARMS =
    HUMAN_GESTURE_PHRASE_FOLD_ARMS;

  /**
   * The values the `handsClaspedBehind` row of `HumanUpperRows` fixes on
   * `armPhrase`, spread into its parameters. Hands clasped behind: both palms
   * meet behind the lower back and stay.
   */
  export const PHRASE_HANDS_CLASPED_BEHIND: typeof HUMAN_GESTURE_PHRASE_HANDS_CLASPED_BEHIND =
    HUMAN_GESTURE_PHRASE_HANDS_CLASPED_BEHIND;

  /**
   * The values the `armAtSide` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. An arm at rest at the side: the relaxed hand
   * visits a place beside the thigh, palm in, and stays.
   */
  export const PHRASE_ARM_AT_SIDE: typeof HUMAN_GESTURE_PHRASE_ARM_AT_SIDE =
    HUMAN_GESTURE_PHRASE_ARM_AT_SIDE;

  /**
   * The values the `patOn` row of `HumanUpperRows` fixes on `armPhrase`, spread
   * into its parameters. A pat: the flat palm bounces on the target, up and
   * down.
   */
  export const PHRASE_PAT_ON: typeof HUMAN_GESTURE_PHRASE_PAT_ON =
    HUMAN_GESTURE_PHRASE_PAT_ON;

  /**
   * The values the `squeezeOn` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A squeeze: the hand closes on the target and
   * holds.
   */
  export const PHRASE_SQUEEZE_ON: typeof HUMAN_GESTURE_PHRASE_SQUEEZE_ON =
    HUMAN_GESTURE_PHRASE_SQUEEZE_ON;

  /**
   * The values the `holdOn` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A hold: the relaxed palm rests on the target
   * and stays.
   */
  export const PHRASE_HOLD_ON: typeof HUMAN_GESTURE_PHRASE_HOLD_ON =
    HUMAN_GESTURE_PHRASE_HOLD_ON;

  /**
   * The values the `drinkFrom` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Drinking: the hand that holds a vessel brings
   * its lip to the mouth and holds it there; the vessel is named as `held`.
   */
  export const PHRASE_DRINK_FROM: typeof HUMAN_GESTURE_PHRASE_DRINK_FROM =
    HUMAN_GESTURE_PHRASE_DRINK_FROM;

  /**
   * The values the `eatWith` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Eating: the hand that holds a utensil brings
   * the point it names (a fork's `face`) to the mouth for a beat; the utensil
   * is named as `held`.
   */
  export const PHRASE_EAT_WITH: typeof HUMAN_GESTURE_PHRASE_EAT_WITH =
    HUMAN_GESTURE_PHRASE_EAT_WITH;

  /**
   * The values the `scratchOn` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A scratch: the fingertips oscillate in short
   * strokes on the target.
   */
  export const PHRASE_SCRATCH_ON: typeof HUMAN_GESTURE_PHRASE_SCRATCH_ON =
    HUMAN_GESTURE_PHRASE_SCRATCH_ON;
}
