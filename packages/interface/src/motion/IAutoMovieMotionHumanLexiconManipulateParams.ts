import type { IAutoMovieMotionHumanPour } from "./IAutoMovieMotionHumanPour";
import type { IAutoMovieMotionHumanPlayWindInstrument } from "./IAutoMovieMotionHumanPlayWindInstrument";
import type { IAutoMovieMotionHumanSwipeTouchscreen } from "./IAutoMovieMotionHumanSwipeTouchscreen";
import type { IAutoMovieMotionHumanDrawFromCarrier } from "./IAutoMovieMotionHumanDrawFromCarrier";
import type { IAutoMovieMotionHumanGuitarChord } from "./IAutoMovieMotionHumanGuitarChord";
import type { IAutoMovieMotionHumanGuitarNote } from "./IAutoMovieMotionHumanGuitarNote";
import type { IAutoMovieMotionHumanHeldWork } from "./IAutoMovieMotionHumanHeldWork";
import type { IAutoMovieMotionHumanManipulate } from "./IAutoMovieMotionHumanManipulate";
import type { IAutoMovieMotionHumanPianoPedal } from "./IAutoMovieMotionHumanPianoPedal";
import type { IAutoMovieMotionHumanPianoPerformance } from "./IAutoMovieMotionHumanPianoPerformance";
import type { IAutoMovieMotionHumanPianoScore } from "./IAutoMovieMotionHumanPianoScore";
import type { IAutoMovieMotionHumanPickUp } from "./IAutoMovieMotionHumanPickUp";
import type { IAutoMovieMotionHumanPickUpMoving } from "./IAutoMovieMotionHumanPickUpMoving";
import type { IAutoMovieMotionHumanPutDownAperture } from "./IAutoMovieMotionHumanPutDownAperture";
import type { IAutoMovieMotionHumanThrowPottery } from "./IAutoMovieMotionHumanThrowPottery";
import type { IAutoMovieMotionHumanWrite } from "./IAutoMovieMotionHumanWrite";
import type { IAutoMovieMotionHumanBowViolinParams } from "./IAutoMovieMotionHumanBowViolinParams";
import type { IAutoMovieMotionHumanConduct } from "./IAutoMovieMotionHumanConduct";
import type { IAutoMovieMotionHumanCymbalStrike } from "./IAutoMovieMotionHumanCymbalStrike";
import type { IAutoMovieMotionHumanFirefight } from "./IAutoMovieMotionHumanFirefight";
import type { IAutoMovieMotionHumanSideDrumStrike } from "./IAutoMovieMotionHumanSideDrumStrike";

/**
 * Open parameters of the manipulate lexicon family, keyed by each runtime
 * export name.
 */
export interface IAutoMovieMotionHumanLexiconManipulateParams {
  /**
   * The keyed contact sequence itself, for a production that names its own
   * contacts.
   */
  sequence: IAutoMovieMotionHumanManipulate.IParams;

  /**
   * Touch typing: a text on a keyboard, both hands, each letter by the digit
   * the home-row chart assigns.
   */
  type: Omit<IAutoMovieMotionHumanManipulate.IParams, "hand">;

  /**
   * Two-finger typing: a text on a keyboard, each key pressed by the forefinger
   * of the hand on its side, `typeText`'s act as a row of the keyed sequence.
   */
  typeTwoFinger: Omit<
    IAutoMovieMotionHumanManipulate.IParams,
    "hand" | "digit"
  >;

  /**
   * Playing a keyboard instrument: both hands, each note's digit by the
   * fingering that keeps the hands still unless the score names it.
   */
  play: Omit<IAutoMovieMotionHumanManipulate.IParams, "hand">;

  /**
   * Fretting a guitar: the left hand's digits on the fret sites, the fingering
   * keeping the hand still (Handrix's outcome, ElKoura and Singh 2003).
   */
  fret: Omit<IAutoMovieMotionHumanManipulate.IParams, "hand">;

  /** Strumming or plucking: the right hand's digits across the string sites. */
  strum: Omit<IAutoMovieMotionHumanManipulate.IParams, "hand">;

  /** Dialling: the right forefinger on each key in turn. */
  dial: Omit<IAutoMovieMotionHumanManipulate.IParams, "hand" | "digit">;

  /**
   * Texting with a thumb: the right thumb on each key of the held phone's
   * screen.
   */
  thumbText: Omit<IAutoMovieMotionHumanManipulate.IParams, "hand" | "digit">;

  /** Write on a staged surface with a held tool. */
  write: IAutoMovieMotionHumanWrite;
  /**
   * Work a held prop: drive its articulations, carry it to a place, take a prop
   * onto it.
   */
  workHeld: IAutoMovieMotionHumanHeldWork.IParams;

  /** Swipe a finger across a touchscreen. */
  swipeTouchscreen: IAutoMovieMotionHumanSwipeTouchscreen;

  /** Tilt a vessel and pour into a staged receiver. */
  pour: IAutoMovieMotionHumanPour.IParams;

  /** Pick up a prop whose support moves. */
  pickUpMoving: IAutoMovieMotionHumanPickUpMoving;

  /** Place a held prop through an aperture. */
  putDownAperture: IAutoMovieMotionHumanPutDownAperture;

  /**
   * Grip a prop seated in a carrier, keeping the grip through an early stand or
   * a draw.
   */
  takeFromCarrier: IAutoMovieMotionHumanPickUp.IParams;

  /** Draw a gripped prop out of its carrier along the carrier's guide. */
  drawFromCarrier: IAutoMovieMotionHumanDrawFromCarrier;

  /** Draw a held violin bow across a string. */
  bowViolin: IAutoMovieMotionHumanBowViolinParams;
  /** Beat a meter's figure with a held baton on the beat clock. */
  conduct: IAutoMovieMotionHumanConduct.IParams;
  /** Draw up a clay wall on a turning wheel with both palms. */
  throwPottery: IAutoMovieMotionHumanThrowPottery.IParams;
  /** Aim, squeeze and sweep an extinguisher whose pin is pulled. */
  extinguish: IAutoMovieMotionHumanFirefight.IExtinguish;
  /** Work a charged hose line as its nozzle operator or backup. */
  hoseLine: IAutoMovieMotionHumanFirefight.IHoseLine;
  /** Beat flames on a lying partner with a held cloth. */
  beatFlames: IAutoMovieMotionHumanFirefight.IBeatFlames;

  /** Raise and play a wind instrument. */
  playWindInstrument: IAutoMovieMotionHumanPlayWindInstrument.IParams;

  /** Fret and play a guitar note. */
  guitarNote: IAutoMovieMotionHumanGuitarNote;

  /** Fret and play a guitar chord. */
  guitarChord: IAutoMovieMotionHumanGuitarChord;

  /** Play a staged piano score. */
  pianoScore: IAutoMovieMotionHumanPianoScore;

  /** Work a staged piano pedal. */
  pianoPedal: IAutoMovieMotionHumanPianoPedal;

  /** Play piano keys and pedals in one performance. */
  pianoPerformance: IAutoMovieMotionHumanPianoPerformance;

  /** Strike a side drum with a held stick. */
  sideDrumStrike: IAutoMovieMotionHumanSideDrumStrike;

  /** Strike a staged cymbal with a held stick. */
  cymbalStrike: IAutoMovieMotionHumanCymbalStrike;
}
