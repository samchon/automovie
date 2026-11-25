import type { IAutoMovieMotionHumanRest } from "../everyday/IAutoMovieMotionHumanRest";
import type { IAutoMovieMotionHumanSelfAction } from "../touch/IAutoMovieMotionHumanSelfAction";

/**
 * Open parameters of the stance lexicon family, keyed by each runtime export
 * name.
 */
export interface IAutoMovieMotionHumanLexiconStanceParams {
  /** Arms crossed on the chest. */
  armsCrossed: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** Hands on the hips. */
  handsOnHips: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** Hands in the pockets. */
  handsInPockets: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** Parade rest: the hands clasped behind the back. */
  paradeRest: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** The hands clasped in front. */
  handsClasped: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** The hands behind the head. */
  handsBehindHead: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** The thinker: the chin on one hand, the other arm supporting its elbow. */
  thinking: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** A victory raise of the arms. */
  victory: Omit<IAutoMovieMotionHumanSelfAction.IParams, "kind">;

  /** A fist pump. */
  fistPump: Omit<IAutoMovieMotionHumanSelfAction.IParams, "kind">;

  /** A stretch on waking or after sitting long. */
  bigStretch: Omit<IAutoMovieMotionHumanSelfAction.IParams, "kind">;

  /** A roll of a stiff neck. */
  neckRoll: Omit<IAutoMovieMotionHumanSelfAction.IParams, "kind">;
}
