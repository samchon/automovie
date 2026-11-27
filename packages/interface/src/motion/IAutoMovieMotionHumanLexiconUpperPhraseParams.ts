import type { IAutoMovieMotionHumanArmPhrase } from "./IAutoMovieMotionHumanArmPhrase";

/**
 * Open parameters of the upperPhrase lexicon family, keyed by each runtime
 * export name.
 */
export interface IAutoMovieMotionHumanLexiconUpperPhraseParams {
  /**
   * The phrase law itself, for a production that states its own phrase, target
   * and hand.
   */
  phrase: IAutoMovieMotionHumanArmPhrase.IParams;

  /**
   * A wave: the open hand oscillates out and in, raised beside the head, palm
   * forward.
   */
  waveHand: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "mirror" | "offset" | "swing" | "count" | "facing"
  >;

  /**
   * A raised hand: the open hand visits a place above the shoulder, palm
   * forward, and holds it.
   */
  raiseHandHigh: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "mirror" | "offset" | "facing" | "hold"
  >;

  /** A stop sign: the open hand held out ahead at shoulder height, palm forward. */
  stopHand: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "mirror" | "offset" | "facing" | "hold"
  >;

  /**
   * A point: the forefinger's tip visits a place on the target's line, the hand
   * pointing.
   */
  pointAt: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "surface" | "shape" | "hold"
  >;

  /** A tap: the fingertips visit the target with no hold. */
  tapOn: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "surface" | "shape" | "hold"
  >;

  /** A press: the palm visits the target and holds. */
  pressOn: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "surface" | "shape" | "hold"
  >;

  /** A rub: the palm oscillates across the target. */
  rubOn: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "surface" | "shape" | "swing" | "count"
  >;

  /** A stroke: the palm draws down along the target. */
  strokeDown: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "surface" | "shape" | "from"
  >;

  /** Hand on the hip: the palm visits the near hip and stays. */
  handOnHip: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "mirror" | "surface" | "shape" | "hold"
  >;

  /** Chin in hand: the fist visits the chin and stays. */
  chinOnFist: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "surface" | "shape" | "hold"
  >;

  /** Wiping the mouth: the back of the hand draws across the lips. */
  wipeMouthAcross: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "surface" | "shape" | "from"
  >;

  /** Wiping a surface: the flat palm oscillates across the target. */
  wipeAcross: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "surface" | "shape" | "swing" | "count"
  >;

  /**
   * Hammering: the fist that holds the hammer strikes down and back on the
   * target, up and down.
   */
  hammerStrokes: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "surface" | "shape" | "swing" | "count"
  >;

  /** Sawing: the fist that holds the saw draws forward and back over the target. */
  sawStrokes: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "surface" | "shape" | "swing" | "count"
  >;

  /** Stirring: the fist that holds the spoon circles out and in over the pot. */
  stirStrokes: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "surface" | "shape" | "swing" | "count"
  >;

  /** Putting on a hat: the hand that holds it visits the crown and stays a beat. */
  hatOnHead: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "surface" | "shape" | "hold"
  >;

  /** Palms up: the open hand held out ahead at waist height, palm up. */
  palmUp: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "mirror" | "offset" | "facing" | "hold"
  >;

  /**
   * Pushing up one's glasses: the forefinger's tip visits the bridge of the
   * nose.
   */
  glassesUp: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "surface" | "shape" | "hold"
  >;

  /** Scratching the head: the forefinger's tip oscillates on the crown. */
  headScratch: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "surface" | "shape" | "swing" | "count"
  >;

  /** A hand to the cheek: the palm visits the cheek and stays a beat. */
  cheekInHand: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "mirror" | "surface" | "shape" | "hold"
  >;

  /** A hand in the pocket: the fingertips visit the front pocket and stay. */
  handInPocket: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "mirror" | "surface" | "shape" | "hold"
  >;

  /** A hand behind the head: the palm visits the back of the head and stays. */
  handBehindHead: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "surface" | "shape" | "hold"
  >;

  /** A phone to the ear: the hand that holds it visits the ear and stays. */
  phoneToEar: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "mirror" | "surface" | "shape" | "hold"
  >;

  /**
   * Brushing the teeth: the hand that holds the brush oscillates before the
   * mouth.
   */
  teethBrushing: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "surface" | "shape" | "swing" | "count"
  >;

  /** Combing: the hand that holds the comb draws it back over the crown. */
  hairCombing: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "surface" | "shape" | "from"
  >;

  /** Clapping: both palms meet ahead of the chest and part, out and in. */
  clapHands: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "hand" | "target" | "offset" | "swing" | "count" | "facing"
  >;

  /**
   * Rubbing the hands: both palms together ahead of the chest, sliding up and
   * down.
   */
  rubPalms: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "hand" | "target" | "offset" | "swing" | "count" | "facing"
  >;

  /** Hands clasped in front: both palms meet before the abdomen and stay. */
  handsTogetherFront: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "hand" | "target" | "offset" | "facing" | "hold"
  >;

  /**
   * A cheer: both open hands visit places above and beside the head, palms
   * forward, for a beat.
   */
  cheerHands: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "hand" | "target" | "offset" | "facing" | "hold"
  >;

  /**
   * A beckon: the open hand held out ahead, palm up, draws in toward the chest
   * and out again.
   */
  beckonHand: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "mirror" | "offset" | "swing" | "count" | "facing"
  >;

  /**
   * Folding the arms: each hand visits the far arm before the chest, the
   * forearms folded, and stays (the phrase that reaches
   * `HumanStance.armsCrossed`, which holds the rest itself).
   */
  foldArms: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "hand" | "target" | "offset" | "shape" | "facing" | "hold"
  >;

  /** Hands clasped behind: both palms meet behind the lower back and stay. */
  handsClaspedBehind: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "hand" | "target" | "offset" | "facing" | "hold"
  >;

  /**
   * An arm at rest at the side: the relaxed hand visits a place beside the
   * thigh, palm in, and stays.
   */
  armAtSide: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "mirror" | "offset" | "shape" | "facing" | "hold"
  >;

  /** A pat: the flat palm bounces on the target, up and down. */
  patOn: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "surface" | "shape" | "swing" | "count"
  >;

  /** A squeeze: the hand closes on the target and holds. */
  squeezeOn: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "surface" | "shape" | "hold"
  >;

  /** A hold: the relaxed palm rests on the target and stays. */
  holdOn: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "surface" | "shape" | "hold"
  >;

  /**
   * Drinking: the hand that holds a vessel brings its lip to the mouth and
   * holds it there; the vessel is named as `held`.
   */
  drinkFrom: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "surface" | "shape" | "point" | "hold"
  >;

  /**
   * Eating: the hand that holds a utensil brings the point it names (a fork's
   * `face`) to the mouth for a beat; the utensil is named as `held`.
   */
  eatWith: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "surface" | "shape" | "hold"
  >;

  /** A scratch: the fingertips oscillate in short strokes on the target. */
  scratchOn: Omit<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "surface" | "shape" | "swing" | "count"
  >;
}
