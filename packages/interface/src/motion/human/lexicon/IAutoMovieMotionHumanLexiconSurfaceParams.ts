import type { IAutoMovieMotionHumanMedium } from "./IAutoMovieMotionHumanMedium";
import type { IAutoMovieMotionHumanPlayground } from "./IAutoMovieMotionHumanPlayground";
import type { IAutoMovieMotionHumanSurface } from "./IAutoMovieMotionHumanSurface";

/**
 * Open inputs for the ice, snow, board, playground and medium-walk laws in the
 * surface lexicon.
 */
export interface IAutoMovieMotionHumanLexiconSurfaceParams {
  /** Travel over ice, optionally turning or coming to a stop. */
  skate: IAutoMovieMotionHumanSurface.ISkateParams;

  /** Deliver from a low flat-foot slide with trailing forefoot support. */
  curlDelivery: IAutoMovieMotionHumanSurface.ICurlDeliveryParams;

  /** Glide over snow on an authored grade. */
  snowGlide: IAutoMovieMotionHumanSurface.ISnowGlideParams;

  /** Step from one support to another, either of which may move. */
  supportStep: IAutoMovieMotionHumanSurface.ISupportStepParams;

  /** Keep a board-relative stance as the board moves. */
  boardRide: IAutoMovieMotionHumanSurface.IBoardRideParams;
  /** The ground push, flight, landing and recovery of a skateboard. */
  skateboardPhrase: IAutoMovieMotionHumanSurface.ISkateboardPhraseParams;

  /** An entry, paddle and transfer to the surfing stance on the authored board. */
  surfboardPhrase: IAutoMovieMotionHumanSurface.ISurfboardPhraseParams;

  /** Pump a swing from its seat with the hands on the chains. */
  swingPump: IAutoMovieMotionHumanPlayground.ISwingPumpParams;

  /** Ride a seesaw seat, pushing off the ground at the low end. */
  seesawRide: IAutoMovieMotionHumanPlayground.ISeesawRideParams;

  /** Run alongside a roundabout with a hand on its grab bar. */
  roundaboutPush: IAutoMovieMotionHumanPlayground.IRoundaboutPushParams;

  /** Walk through water, snow, sand or mud, or into a steady wind. */
  mediumWalk: IAutoMovieMotionHumanMedium.IWalkParams;

  /** Leap off a moving swing seat and land standing. */
  swingLeap: IAutoMovieMotionHumanPlayground.ISwingLeapParams;
}
