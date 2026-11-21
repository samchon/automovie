import type { IAutoMovieMotionHumanPour } from "../affordance/IAutoMovieMotionHumanPour";
import type { IAutoMovieMotionHumanPlayWindInstrument } from "../daily/IAutoMovieMotionHumanPlayWindInstrument";
import type { IAutoMovieMotionHumanSwipeTouchscreen } from "../everyday/IAutoMovieMotionHumanSwipeTouchscreen";
import type { IAutoMovieMotionHumanDrawFromCarrier } from "../handling/IAutoMovieMotionHumanDrawFromCarrier";
import type { IAutoMovieMotionHumanGuitarChord } from "../handling/IAutoMovieMotionHumanGuitarChord";
import type { IAutoMovieMotionHumanGuitarNote } from "../handling/IAutoMovieMotionHumanGuitarNote";
import type { IAutoMovieMotionHumanManipulate } from "../handling/IAutoMovieMotionHumanManipulate";
import type { IAutoMovieMotionHumanPianoPedal } from "../handling/IAutoMovieMotionHumanPianoPedal";
import type { IAutoMovieMotionHumanPianoPerformance } from "../handling/IAutoMovieMotionHumanPianoPerformance";
import type { IAutoMovieMotionHumanPianoScore } from "../handling/IAutoMovieMotionHumanPianoScore";
import type { IAutoMovieMotionHumanPickUp } from "../handling/IAutoMovieMotionHumanPickUp";
import type { IAutoMovieMotionHumanPickUpMoving } from "../handling/IAutoMovieMotionHumanPickUpMoving";
import type { IAutoMovieMotionHumanPutDownAperture } from "../handling/IAutoMovieMotionHumanPutDownAperture";
import type { IAutoMovieMotionHumanWrite } from "../handling/IAutoMovieMotionHumanWrite";
import type { IAutoMovieMotionHumanHeldWork } from "../handling/IAutoMovieMotionHumanHeldWork";
import type { IAutoMovieMotionHumanBowViolinParams } from "../music/IAutoMovieMotionHumanBowViolinParams";
import type { IAutoMovieMotionHumanCymbalStrike } from "../tasks/IAutoMovieMotionHumanCymbalStrike";
import type { IAutoMovieMotionHumanSideDrumStrike } from "../tasks/IAutoMovieMotionHumanSideDrumStrike";

/**
 * Open parameters of the manipulate lexicon family, keyed by each runtime export name.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before planning or resolving a row's fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The manipulate family is a closed export-name map. Each key uses the law contract directly or projects its open parameters.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the manipulate row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconManipulateParams {
  /** The keyed contact sequence itself, for a production that names its own contacts. */
  sequence: IAutoMovieMotionHumanManipulate.IParams;

  /** Touch typing: a text on a keyboard, both hands, each letter by the digit the home-row chart assigns. */
  type: Omit<IAutoMovieMotionHumanManipulate.IParams, "side">;

  /** Two-finger typing: a text on a keyboard, each key pressed by the forefinger of the hand on its side, `typeText`'s act as a row of the keyed sequence (#3361). */
  typeTwoFinger: Omit<
    IAutoMovieMotionHumanManipulate.IParams,
    "side" | "digit"
  >;

  /** Playing a keyboard instrument: both hands, each note's digit by the fingering that keeps the hands still unless the score names it. */
  play: Omit<IAutoMovieMotionHumanManipulate.IParams, "side">;

  /** Fretting a guitar: the left hand's digits on the fret sites, the fingering keeping the hand still (Handrix's outcome, ElKoura and Singh 2003). */
  fret: Omit<IAutoMovieMotionHumanManipulate.IParams, "side">;

  /** Strumming or plucking: the right hand's digits across the string sites. */
  strum: Omit<IAutoMovieMotionHumanManipulate.IParams, "side">;

  /** Dialling: the right forefinger on each key in turn. */
  dial: Omit<IAutoMovieMotionHumanManipulate.IParams, "side" | "digit">;

  /** Texting with a thumb: the right thumb on each key of the held phone's screen. */
  thumbText: Omit<IAutoMovieMotionHumanManipulate.IParams, "side" | "digit">;

  /** Write on a staged surface with a held tool. */
  write: IAutoMovieMotionHumanWrite;
  /** Work a held prop: drive its articulations, carry it to a place, take a prop onto it. */
  workHeld: IAutoMovieMotionHumanHeldWork.IParams;

  /** Swipe a finger across a touchscreen. */
  swipeTouchscreen: IAutoMovieMotionHumanSwipeTouchscreen;

  /** Tilt a vessel and pour into a staged receiver. */
  pour: IAutoMovieMotionHumanPour.IParams;

  /** Pick up a prop whose support moves. */
  pickUpMoving: IAutoMovieMotionHumanPickUpMoving;

  /** Place a held prop through an aperture. */
  putDownAperture: IAutoMovieMotionHumanPutDownAperture;

  /** Grip a prop seated in a carrier, keeping the grip through an early stand or a draw. */
  takeFromCarrier: IAutoMovieMotionHumanPickUp.IParams;

  /** Draw a gripped prop out of its carrier along the carrier's guide. */
  drawFromCarrier: IAutoMovieMotionHumanDrawFromCarrier;

  /** Draw a held violin bow across a string. */
  bowViolin: IAutoMovieMotionHumanBowViolinParams;

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
