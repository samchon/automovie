import type { IAutoMovieMotionHumanPolo } from "./IAutoMovieMotionHumanPolo";
import type { IAutoMovieMotionHumanRide } from "./IAutoMovieMotionHumanRide";
import type { IAutoMovieMotionHumanBicycleEffort } from "./IAutoMovieMotionHumanBicycleEffort";
import type { IAutoMovieMotionHumanBikeGuide } from "./IAutoMovieMotionHumanBikeGuide";
import type { IAutoMovieMotionHumanBikeTransfer } from "./IAutoMovieMotionHumanBikeTransfer";
import type { IAutoMovieMotionHumanBoard } from "./IAutoMovieMotionHumanBoard";
import type { IAutoMovieMotionHumanClasp } from "./IAutoMovieMotionHumanClasp";
import type { IAutoMovieMotionHumanDrape } from "./IAutoMovieMotionHumanDrape";
import type { IAutoMovieMotionHumanFloatBeside } from "./IAutoMovieMotionHumanFloatBeside";
import type { IAutoMovieMotionHumanHandrimStroke } from "./IAutoMovieMotionHumanHandrimStroke";
import type { IAutoMovieMotionHumanHoldHandles } from "./IAutoMovieMotionHumanHoldHandles";
import type { IAutoMovieMotionHumanLanceCouch } from "./IAutoMovieMotionHumanLanceCouch";
import type { IAutoMovieMotionHumanLasso } from "./IAutoMovieMotionHumanLasso";
import type { IAutoMovieMotionHumanLeadHorse } from "./IAutoMovieMotionHumanLeadHorse";
import type { IAutoMovieMotionHumanLunge } from "./IAutoMovieMotionHumanLunge";
import type { IAutoMovieMotionHumanMounted } from "./IAutoMovieMotionHumanMounted";
import type { IAutoMovieMotionHumanRoman } from "./IAutoMovieMotionHumanRoman";
import type { IAutoMovieMotionHumanSabre } from "./IAutoMovieMotionHumanSabre";
import type { IAutoMovieMotionHumanTrick } from "./IAutoMovieMotionHumanTrick";
import type { IAutoMovieMotionHumanUnseat } from "./IAutoMovieMotionHumanUnseat";

/**
 * Open parameters of the ride lexicon family, keyed by each runtime export
 * name.
 */
export interface IAutoMovieMotionHumanLexiconRideParams {
  /** Ride a moving support, seated on it. */
  ride: IAutoMovieMotionHumanRide.IParams;

  /** Push a wheelchair through its handrims. */
  HumanHandrimStroke: IAutoMovieMotionHumanHandrimStroke;

  /** Rise to the pedals, then return to the bicycle saddle. */
  HumanBicycleEffort: IAutoMovieMotionHumanBicycleEffort;

  /** Transfer between ground support and a staged bicycle. */
  HumanBikeTransfer: IAutoMovieMotionHumanBikeTransfer;

  /** Wheel a rolling bicycle by hand, walking beside it. */
  HumanBikeGuide: IAutoMovieMotionHumanBikeGuide;
  /** Hold a horse's moving lead rope in one hand over an authored walk. */
  HumanLeadHorse: IAutoMovieMotionHumanLeadHorse;

  /**
   * Lunge a horse from the circle's centre, turning on the spot with the line
   * in one hand and the whip in the other, changing hands at a change of rein.
   */
  HumanLunge: IAutoMovieMotionHumanLunge;

  /** Walk behind a drawn implement holding its two handles, as a ploughman does. */
  HumanHoldHandles: IAutoMovieMotionHumanHoldHandles;

  /**
   * Slide off a swimming horse to its upstream side and float beside it,
   * holding its mane.
   */
  HumanFloatBeside: IAutoMovieMotionHumanFloatBeside;

  /**
   * Perform ordered seat figures on a moving carrier, acquiring and releasing
   * named supports.
   */
  HumanMounted: IAutoMovieMotionHumanMounted;

  /**
   * Leave a moving saddle against one's will: thrown, pulled down, dragged,
   * stepping clear or slumped.
   */
  HumanUnseat: IAutoMovieMotionHumanUnseat;

  /**
   * Strike a ground ball with a polo mallet from the saddle, forehand or
   * backhand, on either side.
   */
  HumanPolo: IAutoMovieMotionHumanPolo.IPolo;

  /**
   * Board a moving carrier's seat at speed, from the ground, a height or
   * another carrier.
   */
  HumanBoard: IAutoMovieMotionHumanBoard;

  /**
   * Hold on to a partner's bone or another prop's contact while keeping one's
   * own support.
   */
  HumanClasp: IAutoMovieMotionHumanClasp;

  /** Lie limp across a saddle, carried. */
  HumanDrape: IAutoMovieMotionHumanDrape;

  /** Perform trick-riding figures on a moving horse's trick saddle. */
  HumanTrick: IAutoMovieMotionHumanTrick;

  /** Stand with one foot on each of two horses moving side by side. */
  HumanRoman: IAutoMovieMotionHumanRoman;

  /** Swing, throw and dally a lariat from the saddle at a moving animal. */
  HumanLasso: IAutoMovieMotionHumanLasso;

  /**
   * Carry a cavalry sabre at the slope from the saddle and bring it to the
   * engage at the charge.
   */
  HumanSabre: IAutoMovieMotionHumanSabre;

  /**
   * Couch a lance from the saddle, lower its point onto a tent peg or a ring at
   * the gallop and carry it off.
   */
  HumanLanceCouch: IAutoMovieMotionHumanLanceCouch;
}
