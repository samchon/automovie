import type { IAutoMovieMotionHumanGesture } from "../everyday/IAutoMovieMotionHumanGesture";
import type { IAutoMovieMotionHumanDance } from "../exercise/IAutoMovieMotionHumanDance";
import type { IAutoMovieMotionHumanExercise } from "../exercise/IAutoMovieMotionHumanExercise";
import type { IAutoMovieMotionHumanGuard } from "../striking/IAutoMovieMotionHumanGuard";
import type { IAutoMovieMotionHumanKick } from "../striking/IAutoMovieMotionHumanKick";
import type { IAutoMovieMotionHumanPunch } from "../striking/IAutoMovieMotionHumanPunch";

/**
 * Open parameters of the drill lexicon family, keyed by each runtime export name.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The drill family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the drill row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
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

  /** Level a held thing at a target, as a weapon or a torch is aimed: the pointing arm. */
  aim: Omit<IAutoMovieMotionHumanGesture.IParams, "kind" | "hold">;

  /** Squats. */
  squats: Omit<IAutoMovieMotionHumanExercise.IParams, "kind">;

  /** Jumping jacks. */
  jumpingJacks: Omit<IAutoMovieMotionHumanExercise.IParams, "kind">;

  /** A sway to music. */
  sway: Omit<IAutoMovieMotionHumanDance.IParams, "kind">;
}
