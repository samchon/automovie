import { HUMAN_GESTURE_PHRASE_ARM_AT_SIDE } from "../presets/HUMAN_GESTURE_PHRASE_ARM_AT_SIDE";
import { HUMAN_GESTURE_PHRASE_BECKON_HAND } from "../presets/HUMAN_GESTURE_PHRASE_BECKON_HAND";
import { HUMAN_GESTURE_PHRASE_CHEEK_IN_HAND } from "../presets/HUMAN_GESTURE_PHRASE_CHEEK_IN_HAND";
import { HUMAN_GESTURE_PHRASE_CHEER_HANDS } from "../presets/HUMAN_GESTURE_PHRASE_CHEER_HANDS";
import { HUMAN_GESTURE_PHRASE_CHIN_ON_FIST } from "../presets/HUMAN_GESTURE_PHRASE_CHIN_ON_FIST";
import { HUMAN_GESTURE_PHRASE_CLAP_HANDS } from "../presets/HUMAN_GESTURE_PHRASE_CLAP_HANDS";
import { HUMAN_GESTURE_PHRASE_DRINK_FROM } from "../presets/HUMAN_GESTURE_PHRASE_DRINK_FROM";
import { HUMAN_GESTURE_PHRASE_EAT_WITH } from "../presets/HUMAN_GESTURE_PHRASE_EAT_WITH";
import { HUMAN_GESTURE_PHRASE_FOLD_ARMS } from "../presets/HUMAN_GESTURE_PHRASE_FOLD_ARMS";
import { HUMAN_GESTURE_PHRASE_GLASSES_UP } from "../presets/HUMAN_GESTURE_PHRASE_GLASSES_UP";
import { HUMAN_GESTURE_PHRASE_HAIR_COMBING } from "../presets/HUMAN_GESTURE_PHRASE_HAIR_COMBING";
import { HUMAN_GESTURE_PHRASE_HAMMER_STROKES } from "../presets/HUMAN_GESTURE_PHRASE_HAMMER_STROKES";
import { HUMAN_GESTURE_PHRASE_HANDS_CLASPED_BEHIND } from "../presets/HUMAN_GESTURE_PHRASE_HANDS_CLASPED_BEHIND";
import { HUMAN_GESTURE_PHRASE_HANDS_TOGETHER_FRONT } from "../presets/HUMAN_GESTURE_PHRASE_HANDS_TOGETHER_FRONT";
import { HUMAN_GESTURE_PHRASE_HAND_BEHIND_HEAD } from "../presets/HUMAN_GESTURE_PHRASE_HAND_BEHIND_HEAD";
import { HUMAN_GESTURE_PHRASE_HAND_IN_POCKET } from "../presets/HUMAN_GESTURE_PHRASE_HAND_IN_POCKET";
import { HUMAN_GESTURE_PHRASE_HAND_ON_HIP } from "../presets/HUMAN_GESTURE_PHRASE_HAND_ON_HIP";
import { HUMAN_GESTURE_PHRASE_HAT_ON_HEAD } from "../presets/HUMAN_GESTURE_PHRASE_HAT_ON_HEAD";
import { HUMAN_GESTURE_PHRASE_HEAD_SCRATCH } from "../presets/HUMAN_GESTURE_PHRASE_HEAD_SCRATCH";
import { HUMAN_GESTURE_PHRASE_HOLD_ON } from "../presets/HUMAN_GESTURE_PHRASE_HOLD_ON";
import { HUMAN_GESTURE_PHRASE_PALM_UP } from "../presets/HUMAN_GESTURE_PHRASE_PALM_UP";
import { HUMAN_GESTURE_PHRASE_PAT_ON } from "../presets/HUMAN_GESTURE_PHRASE_PAT_ON";
import { HUMAN_GESTURE_PHRASE_PHONE_TO_EAR } from "../presets/HUMAN_GESTURE_PHRASE_PHONE_TO_EAR";
import { HUMAN_GESTURE_PHRASE_POINT_AT } from "../presets/HUMAN_GESTURE_PHRASE_POINT_AT";
import { HUMAN_GESTURE_PHRASE_PRESS_ON } from "../presets/HUMAN_GESTURE_PHRASE_PRESS_ON";
import { HUMAN_GESTURE_PHRASE_RAISE_HAND_HIGH } from "../presets/HUMAN_GESTURE_PHRASE_RAISE_HAND_HIGH";
import { HUMAN_GESTURE_PHRASE_RUB_ON } from "../presets/HUMAN_GESTURE_PHRASE_RUB_ON";
import { HUMAN_GESTURE_PHRASE_RUB_PALMS } from "../presets/HUMAN_GESTURE_PHRASE_RUB_PALMS";
import { HUMAN_GESTURE_PHRASE_SAW_STROKES } from "../presets/HUMAN_GESTURE_PHRASE_SAW_STROKES";
import { HUMAN_GESTURE_PHRASE_SCRATCH_ON } from "../presets/HUMAN_GESTURE_PHRASE_SCRATCH_ON";
import { HUMAN_GESTURE_PHRASE_SQUEEZE_ON } from "../presets/HUMAN_GESTURE_PHRASE_SQUEEZE_ON";
import { HUMAN_GESTURE_PHRASE_STIR_STROKES } from "../presets/HUMAN_GESTURE_PHRASE_STIR_STROKES";
import { HUMAN_GESTURE_PHRASE_STOP_HAND } from "../presets/HUMAN_GESTURE_PHRASE_STOP_HAND";
import { HUMAN_GESTURE_PHRASE_STROKE_DOWN } from "../presets/HUMAN_GESTURE_PHRASE_STROKE_DOWN";
import { HUMAN_GESTURE_PHRASE_TAP_ON } from "../presets/HUMAN_GESTURE_PHRASE_TAP_ON";
import { HUMAN_GESTURE_PHRASE_TEETH_BRUSHING } from "../presets/HUMAN_GESTURE_PHRASE_TEETH_BRUSHING";
import { HUMAN_GESTURE_PHRASE_WAVE_HAND } from "../presets/HUMAN_GESTURE_PHRASE_WAVE_HAND";
import { HUMAN_GESTURE_PHRASE_WIPE_ACROSS } from "../presets/HUMAN_GESTURE_PHRASE_WIPE_ACROSS";
import { HUMAN_GESTURE_PHRASE_WIPE_MOUTH_ACROSS } from "../presets/HUMAN_GESTURE_PHRASE_WIPE_MOUTH_ACROSS";

/*
 * The gesture family's arm phrases (`AutoMovieMotionHumanGesture`).
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
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
 */
export namespace AutoMovieMotionHumanGesturePhrases {
  /*
   * The values the `waveHand` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A wave: the open hand oscillates out and in,
   * raised beside the head, palm forward.
   */
  export const PHRASE_WAVE_HAND: typeof HUMAN_GESTURE_PHRASE_WAVE_HAND =
    HUMAN_GESTURE_PHRASE_WAVE_HAND;

  /*
   * The values the `raiseHandHigh` row of `HumanUpperRows` fixes on
   * `armPhrase`, spread into its parameters. A raised hand: the open hand
   * visits a place above the shoulder, palm forward, and holds it.
   */
  export const PHRASE_RAISE_HAND_HIGH: typeof HUMAN_GESTURE_PHRASE_RAISE_HAND_HIGH =
    HUMAN_GESTURE_PHRASE_RAISE_HAND_HIGH;

  /*
   * The values the `stopHand` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A stop sign: the open hand held out ahead at
   * shoulder height, palm forward.
   */
  export const PHRASE_STOP_HAND: typeof HUMAN_GESTURE_PHRASE_STOP_HAND =
    HUMAN_GESTURE_PHRASE_STOP_HAND;

  /*
   * The values the `pointAt` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A point: the forefinger's tip visits a place on
   * the target's line, the hand pointing.
   */
  export const PHRASE_POINT_AT: typeof HUMAN_GESTURE_PHRASE_POINT_AT =
    HUMAN_GESTURE_PHRASE_POINT_AT;

  /*
   * The values the `tapOn` row of `HumanUpperRows` fixes on `armPhrase`, spread
   * into its parameters. A tap: the fingertips visit the target with no hold.
   */
  export const PHRASE_TAP_ON: typeof HUMAN_GESTURE_PHRASE_TAP_ON =
    HUMAN_GESTURE_PHRASE_TAP_ON;

  /*
   * The values the `pressOn` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A press: the palm visits the target and holds.
   */
  export const PHRASE_PRESS_ON: typeof HUMAN_GESTURE_PHRASE_PRESS_ON =
    HUMAN_GESTURE_PHRASE_PRESS_ON;

  /*
   * The values the `rubOn` row of `HumanUpperRows` fixes on `armPhrase`, spread
   * into its parameters. A rub: the palm oscillates across the target.
   */
  export const PHRASE_RUB_ON: typeof HUMAN_GESTURE_PHRASE_RUB_ON =
    HUMAN_GESTURE_PHRASE_RUB_ON;

  /*
   * The values the `strokeDown` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A stroke: the palm draws down along the
   * target.
   */
  export const PHRASE_STROKE_DOWN: typeof HUMAN_GESTURE_PHRASE_STROKE_DOWN =
    HUMAN_GESTURE_PHRASE_STROKE_DOWN;

  /*
   * The values the `handOnHip` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Hand on the hip: the palm visits the near hip
   * and stays.
   */
  export const PHRASE_HAND_ON_HIP: typeof HUMAN_GESTURE_PHRASE_HAND_ON_HIP =
    HUMAN_GESTURE_PHRASE_HAND_ON_HIP;

  /*
   * The values the `chinOnFist` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Chin in hand: the fist visits the chin and
   * stays.
   */
  export const PHRASE_CHIN_ON_FIST: typeof HUMAN_GESTURE_PHRASE_CHIN_ON_FIST =
    HUMAN_GESTURE_PHRASE_CHIN_ON_FIST;

  /*
   * The values the `wipeMouthAcross` row of `HumanUpperRows` fixes on
   * `armPhrase`, spread into its parameters. Wiping the mouth: the back of the
   * hand draws across the lips.
   */
  export const PHRASE_WIPE_MOUTH_ACROSS: typeof HUMAN_GESTURE_PHRASE_WIPE_MOUTH_ACROSS =
    HUMAN_GESTURE_PHRASE_WIPE_MOUTH_ACROSS;

  /*
   * The values the `wipeAcross` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Wiping a surface: the flat palm oscillates
   * across the target.
   */
  export const PHRASE_WIPE_ACROSS: typeof HUMAN_GESTURE_PHRASE_WIPE_ACROSS =
    HUMAN_GESTURE_PHRASE_WIPE_ACROSS;

  /*
   * The values the `hammerStrokes` row of `HumanUpperRows` fixes on
   * `armPhrase`, spread into its parameters. Hammering: the fist that holds the
   * hammer strikes down and back on the target, up and down.
   */
  export const PHRASE_HAMMER_STROKES: typeof HUMAN_GESTURE_PHRASE_HAMMER_STROKES =
    HUMAN_GESTURE_PHRASE_HAMMER_STROKES;

  /*
   * The values the `sawStrokes` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Sawing: the fist that holds the saw draws
   * forward and back over the target.
   */
  export const PHRASE_SAW_STROKES: typeof HUMAN_GESTURE_PHRASE_SAW_STROKES =
    HUMAN_GESTURE_PHRASE_SAW_STROKES;

  /*
   * The values the `stirStrokes` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Stirring: the fist that holds the spoon circles
   * out and in over the pot.
   */
  export const PHRASE_STIR_STROKES: typeof HUMAN_GESTURE_PHRASE_STIR_STROKES =
    HUMAN_GESTURE_PHRASE_STIR_STROKES;

  /*
   * The values the `hatOnHead` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Putting on a hat: the hand that holds it visits
   * the crown and stays a beat.
   */
  export const PHRASE_HAT_ON_HEAD: typeof HUMAN_GESTURE_PHRASE_HAT_ON_HEAD =
    HUMAN_GESTURE_PHRASE_HAT_ON_HEAD;

  /*
   * The values the `palmUp` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Palms up: the open hand held out ahead at waist
   * height, palm up.
   */
  export const PHRASE_PALM_UP: typeof HUMAN_GESTURE_PHRASE_PALM_UP =
    HUMAN_GESTURE_PHRASE_PALM_UP;

  /*
   * The values the `glassesUp` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Pushing up one's glasses: the forefinger's tip
   * visits the bridge of the nose.
   */
  export const PHRASE_GLASSES_UP: typeof HUMAN_GESTURE_PHRASE_GLASSES_UP =
    HUMAN_GESTURE_PHRASE_GLASSES_UP;

  /*
   * The values the `headScratch` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Scratching the head: the forefinger's tip
   * oscillates on the crown.
   */
  export const PHRASE_HEAD_SCRATCH: typeof HUMAN_GESTURE_PHRASE_HEAD_SCRATCH =
    HUMAN_GESTURE_PHRASE_HEAD_SCRATCH;

  /*
   * The values the `cheekInHand` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A hand to the cheek: the palm visits the cheek
   * and stays a beat.
   */
  export const PHRASE_CHEEK_IN_HAND: typeof HUMAN_GESTURE_PHRASE_CHEEK_IN_HAND =
    HUMAN_GESTURE_PHRASE_CHEEK_IN_HAND;

  /*
   * The values the `handInPocket` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A hand in the pocket: the fingertips visit the
   * front pocket and stay.
   */
  export const PHRASE_HAND_IN_POCKET: typeof HUMAN_GESTURE_PHRASE_HAND_IN_POCKET =
    HUMAN_GESTURE_PHRASE_HAND_IN_POCKET;

  /*
   * The values the `handBehindHead` row of `HumanUpperRows` fixes on
   * `armPhrase`, spread into its parameters. A hand behind the head: the palm
   * visits the back of the head and stays.
   */
  export const PHRASE_HAND_BEHIND_HEAD: typeof HUMAN_GESTURE_PHRASE_HAND_BEHIND_HEAD =
    HUMAN_GESTURE_PHRASE_HAND_BEHIND_HEAD;

  /*
   * The values the `phoneToEar` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A phone to the ear: the hand that holds it
   * visits the ear and stays.
   */
  export const PHRASE_PHONE_TO_EAR: typeof HUMAN_GESTURE_PHRASE_PHONE_TO_EAR =
    HUMAN_GESTURE_PHRASE_PHONE_TO_EAR;

  /*
   * The values the `teethBrushing` row of `HumanUpperRows` fixes on
   * `armPhrase`, spread into its parameters. Brushing the teeth: the hand that
   * holds the brush oscillates before the mouth.
   */
  export const PHRASE_TEETH_BRUSHING: typeof HUMAN_GESTURE_PHRASE_TEETH_BRUSHING =
    HUMAN_GESTURE_PHRASE_TEETH_BRUSHING;

  /*
   * The values the `hairCombing` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Combing: the hand that holds the comb draws it
   * back over the crown.
   */
  export const PHRASE_HAIR_COMBING: typeof HUMAN_GESTURE_PHRASE_HAIR_COMBING =
    HUMAN_GESTURE_PHRASE_HAIR_COMBING;

  /*
   * The values the `clapHands` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Clapping: both palms meet ahead of the chest
   * and part, out and in.
   */
  export const PHRASE_CLAP_HANDS: typeof HUMAN_GESTURE_PHRASE_CLAP_HANDS =
    HUMAN_GESTURE_PHRASE_CLAP_HANDS;

  /*
   * The values the `rubPalms` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Rubbing the hands: both palms together ahead of
   * the chest, sliding up and down.
   */
  export const PHRASE_RUB_PALMS: typeof HUMAN_GESTURE_PHRASE_RUB_PALMS =
    HUMAN_GESTURE_PHRASE_RUB_PALMS;

  /*
   * The values the `handsTogetherFront` row of `HumanUpperRows` fixes on
   * `armPhrase`, spread into its parameters. Hands clasped in front: both palms
   * meet before the abdomen and stay.
   */
  export const PHRASE_HANDS_TOGETHER_FRONT: typeof HUMAN_GESTURE_PHRASE_HANDS_TOGETHER_FRONT =
    HUMAN_GESTURE_PHRASE_HANDS_TOGETHER_FRONT;

  /*
   * The values the `cheerHands` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A cheer: both open hands visit places above and
   * beside the head, palms forward, for a beat.
   */
  export const PHRASE_CHEER_HANDS: typeof HUMAN_GESTURE_PHRASE_CHEER_HANDS =
    HUMAN_GESTURE_PHRASE_CHEER_HANDS;

  /*
   * The values the `beckonHand` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A beckon: the open hand held out ahead, palm
   * up, draws in toward the chest and out again.
   */
  export const PHRASE_BECKON_HAND: typeof HUMAN_GESTURE_PHRASE_BECKON_HAND =
    HUMAN_GESTURE_PHRASE_BECKON_HAND;

  /*
   * The values the `foldArms` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Folding the arms: each hand visits the far arm
   * before the chest, the forearms folded, and stays (the phrase that reaches
   * `HumanStance.armsCrossed`, which holds the rest itself).
   */
  export const PHRASE_FOLD_ARMS: typeof HUMAN_GESTURE_PHRASE_FOLD_ARMS =
    HUMAN_GESTURE_PHRASE_FOLD_ARMS;

  /*
   * The values the `handsClaspedBehind` row of `HumanUpperRows` fixes on
   * `armPhrase`, spread into its parameters. Hands clasped behind: both palms
   * meet behind the lower back and stay.
   */
  export const PHRASE_HANDS_CLASPED_BEHIND: typeof HUMAN_GESTURE_PHRASE_HANDS_CLASPED_BEHIND =
    HUMAN_GESTURE_PHRASE_HANDS_CLASPED_BEHIND;

  /*
   * The values the `armAtSide` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. An arm at rest at the side: the relaxed hand
   * visits a place beside the thigh, palm in, and stays.
   */
  export const PHRASE_ARM_AT_SIDE: typeof HUMAN_GESTURE_PHRASE_ARM_AT_SIDE =
    HUMAN_GESTURE_PHRASE_ARM_AT_SIDE;

  /*
   * The values the `patOn` row of `HumanUpperRows` fixes on `armPhrase`, spread
   * into its parameters. A pat: the flat palm bounces on the target, up and
   * down.
   */
  export const PHRASE_PAT_ON: typeof HUMAN_GESTURE_PHRASE_PAT_ON =
    HUMAN_GESTURE_PHRASE_PAT_ON;

  /*
   * The values the `squeezeOn` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A squeeze: the hand closes on the target and
   * holds.
   */
  export const PHRASE_SQUEEZE_ON: typeof HUMAN_GESTURE_PHRASE_SQUEEZE_ON =
    HUMAN_GESTURE_PHRASE_SQUEEZE_ON;

  /*
   * The values the `holdOn` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A hold: the relaxed palm rests on the target
   * and stays.
   */
  export const PHRASE_HOLD_ON: typeof HUMAN_GESTURE_PHRASE_HOLD_ON =
    HUMAN_GESTURE_PHRASE_HOLD_ON;

  /*
   * The values the `drinkFrom` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Drinking: the hand that holds a vessel brings
   * its lip to the mouth and holds it there; the vessel is named as `held`.
   */
  export const PHRASE_DRINK_FROM: typeof HUMAN_GESTURE_PHRASE_DRINK_FROM =
    HUMAN_GESTURE_PHRASE_DRINK_FROM;

  /*
   * The values the `eatWith` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. Eating: the hand that holds a utensil brings
   * the point it names (a fork's `face`) to the mouth for a beat; the utensil
   * is named as `held`.
   */
  export const PHRASE_EAT_WITH: typeof HUMAN_GESTURE_PHRASE_EAT_WITH =
    HUMAN_GESTURE_PHRASE_EAT_WITH;

  /*
   * The values the `scratchOn` row of `HumanUpperRows` fixes on `armPhrase`,
   * spread into its parameters. A scratch: the fingertips oscillate in short
   * strokes on the target.
   */
  export const PHRASE_SCRATCH_ON: typeof HUMAN_GESTURE_PHRASE_SCRATCH_ON =
    HUMAN_GESTURE_PHRASE_SCRATCH_ON;
}
