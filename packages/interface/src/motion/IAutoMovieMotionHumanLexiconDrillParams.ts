import type { IAutoMovieMotionHumanExercise } from "./IAutoMovieMotionHumanExercise";
import type { IAutoMovieMotionHumanDance } from "./IAutoMovieMotionHumanDance";
import type { IAutoMovieMotionHumanGesture } from "./IAutoMovieMotionHumanGesture";
import type { IAutoMovieMotionHumanGuard } from "./IAutoMovieMotionHumanGuard";
import type { IAutoMovieMotionHumanKick } from "./IAutoMovieMotionHumanKick";
import type { IAutoMovieMotionHumanPunch } from "./IAutoMovieMotionHumanPunch";

/**
 * Open parameters of the drill lexicon family, keyed by each runtime export
 * name.
 */
export interface IAutoMovieMotionHumanLexiconDrillParams {
  /** A lead hook. */
  hook: Omit<IAutoMovieMotionHumanPunch.IParams, "technique" | "hand">;

  /** A rear uppercut. */
  uppercut: Omit<IAutoMovieMotionHumanPunch.IParams, "technique" | "hand">;

  /** A front push kick with the lead leg, as a teep or a door kick. */
  frontKick: Omit<IAutoMovieMotionHumanKick.IParams, "technique" | "leg">;

  /** A southpaw guard. */
  southpaw: Omit<IAutoMovieMotionHumanGuard.IParams, "stance">;

  /**
   * Level a held thing at a target, as a weapon or a torch is aimed: the
   * pointing arm.
   */
  aim: Omit<IAutoMovieMotionHumanGesture.IParams, "kind" | "hold">;

  /** Squats. */
  squats: Omit<IAutoMovieMotionHumanExercise.IParams, "kind">;

  /** Jumping jacks. */
  jumpingJacks: Omit<IAutoMovieMotionHumanExercise.IParams, "kind">;

  /** A sway to music. */
  sway: Omit<IAutoMovieMotionHumanDance.IParams, "kind">;
}
