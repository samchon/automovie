import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { armPhrase } from "../../everyday/internal/armPhrase";
import { AutoMovieMotionHumanActionRow } from "../../law/AutoMovieMotionHumanActionRow";
import { HUMAN_GESTURE_PHRASE_ARM_AT_SIDE } from "../../next/presets/HUMAN_GESTURE_PHRASE_ARM_AT_SIDE";
import { HUMAN_GESTURE_PHRASE_BECKON_HAND } from "../../next/presets/HUMAN_GESTURE_PHRASE_BECKON_HAND";
import { HUMAN_GESTURE_PHRASE_CHEEK_IN_HAND } from "../../next/presets/HUMAN_GESTURE_PHRASE_CHEEK_IN_HAND";
import { HUMAN_GESTURE_PHRASE_CHEER_HANDS } from "../../next/presets/HUMAN_GESTURE_PHRASE_CHEER_HANDS";
import { HUMAN_GESTURE_PHRASE_CHIN_ON_FIST } from "../../next/presets/HUMAN_GESTURE_PHRASE_CHIN_ON_FIST";
import { HUMAN_GESTURE_PHRASE_CLAP_HANDS } from "../../next/presets/HUMAN_GESTURE_PHRASE_CLAP_HANDS";
import { HUMAN_GESTURE_PHRASE_DRINK_FROM } from "../../next/presets/HUMAN_GESTURE_PHRASE_DRINK_FROM";
import { HUMAN_GESTURE_PHRASE_EAT_WITH } from "../../next/presets/HUMAN_GESTURE_PHRASE_EAT_WITH";
import { HUMAN_GESTURE_PHRASE_FOLD_ARMS } from "../../next/presets/HUMAN_GESTURE_PHRASE_FOLD_ARMS";
import { HUMAN_GESTURE_PHRASE_GLASSES_UP } from "../../next/presets/HUMAN_GESTURE_PHRASE_GLASSES_UP";
import { HUMAN_GESTURE_PHRASE_HAIR_COMBING } from "../../next/presets/HUMAN_GESTURE_PHRASE_HAIR_COMBING";
import { HUMAN_GESTURE_PHRASE_HAMMER_STROKES } from "../../next/presets/HUMAN_GESTURE_PHRASE_HAMMER_STROKES";
import { HUMAN_GESTURE_PHRASE_HANDS_CLASPED_BEHIND } from "../../next/presets/HUMAN_GESTURE_PHRASE_HANDS_CLASPED_BEHIND";
import { HUMAN_GESTURE_PHRASE_HANDS_TOGETHER_FRONT } from "../../next/presets/HUMAN_GESTURE_PHRASE_HANDS_TOGETHER_FRONT";
import { HUMAN_GESTURE_PHRASE_HAND_BEHIND_HEAD } from "../../next/presets/HUMAN_GESTURE_PHRASE_HAND_BEHIND_HEAD";
import { HUMAN_GESTURE_PHRASE_HAND_IN_POCKET } from "../../next/presets/HUMAN_GESTURE_PHRASE_HAND_IN_POCKET";
import { HUMAN_GESTURE_PHRASE_HAND_ON_HIP } from "../../next/presets/HUMAN_GESTURE_PHRASE_HAND_ON_HIP";
import { HUMAN_GESTURE_PHRASE_HAT_ON_HEAD } from "../../next/presets/HUMAN_GESTURE_PHRASE_HAT_ON_HEAD";
import { HUMAN_GESTURE_PHRASE_HEAD_SCRATCH } from "../../next/presets/HUMAN_GESTURE_PHRASE_HEAD_SCRATCH";
import { HUMAN_GESTURE_PHRASE_HOLD_ON } from "../../next/presets/HUMAN_GESTURE_PHRASE_HOLD_ON";
import { HUMAN_GESTURE_PHRASE_PALM_UP } from "../../next/presets/HUMAN_GESTURE_PHRASE_PALM_UP";
import { HUMAN_GESTURE_PHRASE_PAT_ON } from "../../next/presets/HUMAN_GESTURE_PHRASE_PAT_ON";
import { HUMAN_GESTURE_PHRASE_PHONE_TO_EAR } from "../../next/presets/HUMAN_GESTURE_PHRASE_PHONE_TO_EAR";
import { HUMAN_GESTURE_PHRASE_POINT_AT } from "../../next/presets/HUMAN_GESTURE_PHRASE_POINT_AT";
import { HUMAN_GESTURE_PHRASE_PRESS_ON } from "../../next/presets/HUMAN_GESTURE_PHRASE_PRESS_ON";
import { HUMAN_GESTURE_PHRASE_RAISE_HAND_HIGH } from "../../next/presets/HUMAN_GESTURE_PHRASE_RAISE_HAND_HIGH";
import { HUMAN_GESTURE_PHRASE_RUB_ON } from "../../next/presets/HUMAN_GESTURE_PHRASE_RUB_ON";
import { HUMAN_GESTURE_PHRASE_RUB_PALMS } from "../../next/presets/HUMAN_GESTURE_PHRASE_RUB_PALMS";
import { HUMAN_GESTURE_PHRASE_SAW_STROKES } from "../../next/presets/HUMAN_GESTURE_PHRASE_SAW_STROKES";
import { HUMAN_GESTURE_PHRASE_SCRATCH_ON } from "../../next/presets/HUMAN_GESTURE_PHRASE_SCRATCH_ON";
import { HUMAN_GESTURE_PHRASE_SQUEEZE_ON } from "../../next/presets/HUMAN_GESTURE_PHRASE_SQUEEZE_ON";
import { HUMAN_GESTURE_PHRASE_STIR_STROKES } from "../../next/presets/HUMAN_GESTURE_PHRASE_STIR_STROKES";
import { HUMAN_GESTURE_PHRASE_STOP_HAND } from "../../next/presets/HUMAN_GESTURE_PHRASE_STOP_HAND";
import { HUMAN_GESTURE_PHRASE_STROKE_DOWN } from "../../next/presets/HUMAN_GESTURE_PHRASE_STROKE_DOWN";
import { HUMAN_GESTURE_PHRASE_TAP_ON } from "../../next/presets/HUMAN_GESTURE_PHRASE_TAP_ON";
import { HUMAN_GESTURE_PHRASE_TEETH_BRUSHING } from "../../next/presets/HUMAN_GESTURE_PHRASE_TEETH_BRUSHING";
import { HUMAN_GESTURE_PHRASE_WAVE_HAND } from "../../next/presets/HUMAN_GESTURE_PHRASE_WAVE_HAND";
import { HUMAN_GESTURE_PHRASE_WIPE_ACROSS } from "../../next/presets/HUMAN_GESTURE_PHRASE_WIPE_ACROSS";
import { HUMAN_GESTURE_PHRASE_WIPE_MOUTH_ACROSS } from "../../next/presets/HUMAN_GESTURE_PHRASE_WIPE_MOUTH_ACROSS";

/**
 * The upper-body acts re-expressed as rows over the arm's phrases: each row is
 * `armPhrase` with its phrase, its hand and the shape of its target fixed, so a
 * gesture, a touch, a hand at rest, a hand to the face and a wipe share one
 * plan, one timing and one set of refusals, and each accepts any base, carrier,
 * side and manner the phrase law does. The rows of the older laws (`gesture`,
 * `touch`, `rest`, `handToFace`, `wipe`) stay until these rows pass their
 * verdicts; the target a touch or a wipe needs, and the prop a tool row holds
 * (`held`), are left open.
 *
 * A row is written for the right hand: the region of a side it fixes
 * (`hipRight`) is read on the acting hand's own side (`mirror`), so the same
 * row puts the left hand on the left hip.
 *
 * Every offset is a share of the arm's length (upper arm, forearm and hand) in
 * the performer's frame, so a row fits any body; the shares are provisional,
 * set from each act's description with no measured source read.
 *
 * Duration of every row (the phrase's timing, {@link armPhrase}): the hand
 * reaches its place in the free-space time of its travel and returns in as long
 * again, `0.25 + 0.5 D` seconds for `D` metres, about 0.5 s for a 0.5 m reach
 * ({@link AutoMovieMotionHumanTiming.transport}). A visit (a hand on the hip, a
 * phone to the ear, a hat on) holds the place for a beat, 0.4 s, unless `hold`
 * names another pause ({@link AutoMovieMotionHumanTiming.PAUSES}). An
 * oscillation (a wave, a rub, a scratch, a stir) lasts 2 beats, 0.8 s, unless
 * `cycles` says more. `manner.pace` and the Effort `time` factor scale every
 * phase. All of these are provisional.
 */
export namespace HumanUpperRows {
  /**
   * The phrase law itself, for a production that states its own phrase, target
   * and hand.
   */
  export const phrase = armPhrase;

  /**
   * A wave: the open hand oscillates out and in, raised beside the head, palm
   * forward.
   */
  export const waveHand: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["waveHand"]
  > = AutoMovieMotionHumanActionRow.of(
    "waveHand",
    armPhrase,
    HUMAN_GESTURE_PHRASE_WAVE_HAND,
  );

  /**
   * A raised hand: the open hand visits a place above the shoulder, palm
   * forward, and holds it.
   */
  export const raiseHandHigh: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["raiseHandHigh"]
  > = AutoMovieMotionHumanActionRow.of(
    "raiseHandHigh",
    armPhrase,
    HUMAN_GESTURE_PHRASE_RAISE_HAND_HIGH,
  );

  /** A stop sign: the open hand held out ahead at shoulder height, palm forward. */
  export const stopHand: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["stopHand"]
  > = AutoMovieMotionHumanActionRow.of(
    "stopHand",
    armPhrase,
    HUMAN_GESTURE_PHRASE_STOP_HAND,
  );

  /**
   * A point: the forefinger's tip visits a place on the target's line, the hand
   * pointing.
   */
  export const pointAt: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["pointAt"]
  > = AutoMovieMotionHumanActionRow.of(
    "pointAt",
    armPhrase,
    HUMAN_GESTURE_PHRASE_POINT_AT,
  );

  /** A tap: the fingertips visit the target with no hold. */
  export const tapOn: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["tapOn"]
  > = AutoMovieMotionHumanActionRow.of(
    "tapOn",
    armPhrase,
    HUMAN_GESTURE_PHRASE_TAP_ON,
  );

  /** A press: the palm visits the target and holds. */
  export const pressOn: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["pressOn"]
  > = AutoMovieMotionHumanActionRow.of(
    "pressOn",
    armPhrase,
    HUMAN_GESTURE_PHRASE_PRESS_ON,
  );

  /** A rub: the palm oscillates across the target. */
  export const rubOn: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["rubOn"]
  > = AutoMovieMotionHumanActionRow.of(
    "rubOn",
    armPhrase,
    HUMAN_GESTURE_PHRASE_RUB_ON,
  );

  /** A stroke: the palm draws down along the target. */
  export const strokeDown: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["strokeDown"]
  > = AutoMovieMotionHumanActionRow.of(
    "strokeDown",
    armPhrase,
    HUMAN_GESTURE_PHRASE_STROKE_DOWN,
  );

  /** Hand on the hip: the palm visits the near hip and stays. */
  export const handOnHip: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["handOnHip"]
  > = AutoMovieMotionHumanActionRow.of(
    "handOnHip",
    armPhrase,
    HUMAN_GESTURE_PHRASE_HAND_ON_HIP,
  );

  /** Chin in hand: the fist visits the chin and stays. */
  export const chinOnFist: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["chinOnFist"]
  > = AutoMovieMotionHumanActionRow.of(
    "chinOnFist",
    armPhrase,
    HUMAN_GESTURE_PHRASE_CHIN_ON_FIST,
  );

  /** Wiping the mouth: the back of the hand draws across the lips. */
  export const wipeMouthAcross: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["wipeMouthAcross"]
  > = AutoMovieMotionHumanActionRow.of(
    "wipeMouthAcross",
    armPhrase,
    HUMAN_GESTURE_PHRASE_WIPE_MOUTH_ACROSS,
  );

  /** Wiping a surface: the flat palm oscillates across the target. */
  export const wipeAcross: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["wipeAcross"]
  > = AutoMovieMotionHumanActionRow.of(
    "wipeAcross",
    armPhrase,
    HUMAN_GESTURE_PHRASE_WIPE_ACROSS,
  );

  /**
   * Hammering: the fist that holds the hammer strikes down and back on the
   * target, up and down.
   */
  export const hammerStrokes: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["hammerStrokes"]
  > = AutoMovieMotionHumanActionRow.of(
    "hammerStrokes",
    armPhrase,
    HUMAN_GESTURE_PHRASE_HAMMER_STROKES,
  );

  /** Sawing: the fist that holds the saw draws forward and back over the target. */
  export const sawStrokes: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["sawStrokes"]
  > = AutoMovieMotionHumanActionRow.of(
    "sawStrokes",
    armPhrase,
    HUMAN_GESTURE_PHRASE_SAW_STROKES,
  );

  /** Stirring: the fist that holds the spoon circles out and in over the pot. */
  export const stirStrokes: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["stirStrokes"]
  > = AutoMovieMotionHumanActionRow.of(
    "stirStrokes",
    armPhrase,
    HUMAN_GESTURE_PHRASE_STIR_STROKES,
  );

  /** Putting on a hat: the hand that holds it visits the crown and stays a beat. */
  export const hatOnHead: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["hatOnHead"]
  > = AutoMovieMotionHumanActionRow.of(
    "hatOnHead",
    armPhrase,
    HUMAN_GESTURE_PHRASE_HAT_ON_HEAD,
  );

  /** Palms up: the open hand held out ahead at waist height, palm up. */
  export const palmUp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["palmUp"]
  > = AutoMovieMotionHumanActionRow.of(
    "palmUp",
    armPhrase,
    HUMAN_GESTURE_PHRASE_PALM_UP,
  );

  /**
   * Pushing up one's glasses: the forefinger's tip visits the bridge of the
   * nose.
   */
  export const glassesUp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["glassesUp"]
  > = AutoMovieMotionHumanActionRow.of(
    "glassesUp",
    armPhrase,
    HUMAN_GESTURE_PHRASE_GLASSES_UP,
  );

  /** Scratching the head: the forefinger's tip oscillates on the crown. */
  export const headScratch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["headScratch"]
  > = AutoMovieMotionHumanActionRow.of(
    "headScratch",
    armPhrase,
    HUMAN_GESTURE_PHRASE_HEAD_SCRATCH,
  );

  /** A hand to the cheek: the palm visits the cheek and stays a beat. */
  export const cheekInHand: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["cheekInHand"]
  > = AutoMovieMotionHumanActionRow.of(
    "cheekInHand",
    armPhrase,
    HUMAN_GESTURE_PHRASE_CHEEK_IN_HAND,
  );

  /** A hand in the pocket: the fingertips visit the front pocket and stay. */
  export const handInPocket: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["handInPocket"]
  > = AutoMovieMotionHumanActionRow.of(
    "handInPocket",
    armPhrase,
    HUMAN_GESTURE_PHRASE_HAND_IN_POCKET,
  );

  /** A hand behind the head: the palm visits the back of the head and stays. */
  export const handBehindHead: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["handBehindHead"]
  > = AutoMovieMotionHumanActionRow.of(
    "handBehindHead",
    armPhrase,
    HUMAN_GESTURE_PHRASE_HAND_BEHIND_HEAD,
  );

  /** A phone to the ear: the hand that holds it visits the ear and stays. */
  export const phoneToEar: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["phoneToEar"]
  > = AutoMovieMotionHumanActionRow.of(
    "phoneToEar",
    armPhrase,
    HUMAN_GESTURE_PHRASE_PHONE_TO_EAR,
  );

  /**
   * Brushing the teeth: the hand that holds the brush oscillates before the
   * mouth.
   */
  export const teethBrushing: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["teethBrushing"]
  > = AutoMovieMotionHumanActionRow.of(
    "teethBrushing",
    armPhrase,
    HUMAN_GESTURE_PHRASE_TEETH_BRUSHING,
  );

  /** Combing: the hand that holds the comb draws it back over the crown. */
  export const hairCombing: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["hairCombing"]
  > = AutoMovieMotionHumanActionRow.of(
    "hairCombing",
    armPhrase,
    HUMAN_GESTURE_PHRASE_HAIR_COMBING,
  );

  /** Clapping: both palms meet ahead of the chest and part, out and in. */
  export const clapHands: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["clapHands"]
  > = AutoMovieMotionHumanActionRow.of(
    "clapHands",
    armPhrase,
    HUMAN_GESTURE_PHRASE_CLAP_HANDS,
  );

  /**
   * Rubbing the hands: both palms together ahead of the chest, sliding up and
   * down.
   */
  export const rubPalms: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["rubPalms"]
  > = AutoMovieMotionHumanActionRow.of(
    "rubPalms",
    armPhrase,
    HUMAN_GESTURE_PHRASE_RUB_PALMS,
  );

  /** Hands clasped in front: both palms meet before the abdomen and stay. */
  export const handsTogetherFront: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["handsTogetherFront"]
  > = AutoMovieMotionHumanActionRow.of(
    "handsTogetherFront",
    armPhrase,
    HUMAN_GESTURE_PHRASE_HANDS_TOGETHER_FRONT,
  );

  /**
   * A cheer: both open hands visit places above and beside the head, palms
   * forward, for a beat.
   */
  export const cheerHands: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["cheerHands"]
  > = AutoMovieMotionHumanActionRow.of(
    "cheerHands",
    armPhrase,
    HUMAN_GESTURE_PHRASE_CHEER_HANDS,
  );

  /**
   * A beckon: the open hand held out ahead, palm up, draws in toward the chest
   * and out again.
   */
  export const beckonHand: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["beckonHand"]
  > = AutoMovieMotionHumanActionRow.of(
    "beckonHand",
    armPhrase,
    HUMAN_GESTURE_PHRASE_BECKON_HAND,
  );

  /**
   * Folding the arms: each hand visits the far arm before the chest, the
   * forearms folded, and stays (the phrase that reaches
   * `HumanStance.armsCrossed`, which holds the rest itself).
   */
  export const foldArms: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["foldArms"]
  > = AutoMovieMotionHumanActionRow.of(
    "foldArms",
    armPhrase,
    HUMAN_GESTURE_PHRASE_FOLD_ARMS,
  );

  /** Hands clasped behind: both palms meet behind the lower back and stay. */
  export const handsClaspedBehind: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["handsClaspedBehind"]
  > = AutoMovieMotionHumanActionRow.of(
    "handsClaspedBehind",
    armPhrase,
    HUMAN_GESTURE_PHRASE_HANDS_CLASPED_BEHIND,
  );

  /**
   * An arm at rest at the side: the relaxed hand visits a place beside the
   * thigh, palm in, and stays.
   */
  export const armAtSide: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["armAtSide"]
  > = AutoMovieMotionHumanActionRow.of(
    "armAtSide",
    armPhrase,
    HUMAN_GESTURE_PHRASE_ARM_AT_SIDE,
  );

  /** A pat: the flat palm bounces on the target, up and down. */
  export const patOn: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["patOn"]
  > = AutoMovieMotionHumanActionRow.of(
    "patOn",
    armPhrase,
    HUMAN_GESTURE_PHRASE_PAT_ON,
  );

  /** A squeeze: the hand closes on the target and holds. */
  export const squeezeOn: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["squeezeOn"]
  > = AutoMovieMotionHumanActionRow.of(
    "squeezeOn",
    armPhrase,
    HUMAN_GESTURE_PHRASE_SQUEEZE_ON,
  );

  /** A hold: the relaxed palm rests on the target and stays. */
  export const holdOn: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["holdOn"]
  > = AutoMovieMotionHumanActionRow.of(
    "holdOn",
    armPhrase,
    HUMAN_GESTURE_PHRASE_HOLD_ON,
  );

  /**
   * Drinking: the hand that holds a vessel brings its lip to the mouth and
   * holds it there; the vessel is named as `held`.
   */
  export const drinkFrom: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["drinkFrom"]
  > = AutoMovieMotionHumanActionRow.of(
    "drinkFrom",
    armPhrase,
    HUMAN_GESTURE_PHRASE_DRINK_FROM,
  );

  /**
   * Eating: the hand that holds a utensil brings the point it names (a fork's
   * `face`) to the mouth for a beat; the utensil is named as `held`.
   */
  export const eatWith: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["eatWith"]
  > = AutoMovieMotionHumanActionRow.of(
    "eatWith",
    armPhrase,
    HUMAN_GESTURE_PHRASE_EAT_WITH,
  );

  /** A scratch: the fingertips oscillate in short strokes on the target. */
  export const scratchOn: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperPhrase"]["scratchOn"]
  > = AutoMovieMotionHumanActionRow.of(
    "scratchOn",
    armPhrase,
    HUMAN_GESTURE_PHRASE_SCRATCH_ON,
  );
}
