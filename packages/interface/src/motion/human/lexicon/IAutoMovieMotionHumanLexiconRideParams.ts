import type { IAutoMovieMotionHumanBicycleEffort } from "./IAutoMovieMotionHumanBicycleEffort";
import type { IAutoMovieMotionHumanBikeGuide } from "./IAutoMovieMotionHumanBikeGuide";
import type { IAutoMovieMotionHumanBikeTransfer } from "./IAutoMovieMotionHumanBikeTransfer";
import type { IAutoMovieMotionHumanFloatBeside } from "./IAutoMovieMotionHumanFloatBeside";
import type { IAutoMovieMotionHumanHandrimStroke } from "./IAutoMovieMotionHumanHandrimStroke";
import type { IAutoMovieMotionHumanHoldHandles } from "./IAutoMovieMotionHumanHoldHandles";
import type { IAutoMovieMotionHumanLeadHorse } from "./IAutoMovieMotionHumanLeadHorse";
import type { IAutoMovieMotionHumanMounted } from "./IAutoMovieMotionHumanMounted";
import type { IAutoMovieMotionHumanUnseat } from "./IAutoMovieMotionHumanUnseat";
import type { IAutoMovieMotionHumanPolo } from "./IAutoMovieMotionHumanPolo";
import type { IAutoMovieMotionHumanRide } from "./IAutoMovieMotionHumanRide";

/**
 * Open parameters of the ride lexicon family, keyed by each runtime export name.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before planning or resolving a row's fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The ride family is a closed export-name map. Each key uses the law contract directly or projects its open parameters.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the ride row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
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

  /** Walk behind a drawn implement holding its two handles, as a ploughman does. */
  HumanHoldHandles: IAutoMovieMotionHumanHoldHandles;

  /** Slide off a swimming horse to its upstream side and float beside it, holding its mane. */
  HumanFloatBeside: IAutoMovieMotionHumanFloatBeside;

  /** Perform ordered seat figures on a moving carrier, acquiring and releasing named supports. */
  HumanMounted: IAutoMovieMotionHumanMounted;

  /** Leave a moving saddle against one's will: thrown, pulled down, dragged, stepping clear or slumped. */
  HumanUnseat: IAutoMovieMotionHumanUnseat;

  /** Strike a ground ball with a polo mallet from the saddle, forehand or backhand, on either side. */
  HumanPolo: IAutoMovieMotionHumanPolo;
}
