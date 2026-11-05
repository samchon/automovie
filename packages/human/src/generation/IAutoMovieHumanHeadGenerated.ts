import type { IAutoMovieHumanHermiteCurve } from "../lofting/IAutoMovieHumanHermiteCurve";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanMouth } from "./AutoMovieHumanMouth";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Everything the head adds to a calibration: the chains of the head and the
 * ears with their events and poles, the openings cut from the skin, the eyes
 * seated behind them, the lips' colour boundary, the mouth behind its fissure
 * and the landmarks other parts attach to.
 */
export interface IAutoMovieHumanHeadGenerated {
  /** The head's landmarks on its finished skin, calibration millimetres. */
  landmarks: IAutoMovieHumanBodyCalibration.IHeadLandmarks;

  /** The stature in calibration millimetres, the vertex's height. */
  stature: number;

  /** The head's three chains and the ears' chains. */
  chains: IAutoMovieLoftChain[];

  /** The head's splits at the ears' lower and upper ends, and the ears' own. */
  events: IAutoMovieHumanBodyCalibration.IEvent[];

  /** The poles that close the crown and the ears' free ends. */
  poles: IAutoMovieHumanBodyCalibration.IPole[];

  /** The nostrils, the lid margins and the mouth's fissure. */
  apertures: IAutoMovieHumanLoftAperture[];

  /** The two globes seated behind the lids. */
  eyes: IAutoMovieHumanBodyCalibration.IEye[];

  /** The lips' colour boundary as a closed run of Hermite spans. */
  lips: IAutoMovieHumanHermiteCurve["spans"];

  /** The mouth behind its fissure: teeth, lining and tongue. */
  mouth: AutoMovieHumanMouth.IMouth;
}
