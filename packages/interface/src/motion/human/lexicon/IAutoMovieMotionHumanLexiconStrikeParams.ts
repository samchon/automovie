import type { IAutoMovieMotionHumanKick } from "../striking/IAutoMovieMotionHumanKick";
import type { IAutoMovieMotionHumanKnee } from "../striking/IAutoMovieMotionHumanKnee";
import type { IAutoMovieMotionHumanPunch } from "../striking/IAutoMovieMotionHumanPunch";

/**
 * Open parameters of the strike lexicon family, keyed by each runtime export name: the named punches, kicks and knees of #3362.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The strike family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the strike row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconStrikeParams {
  /** A jab: the lead straight. */
  jab: Omit<IAutoMovieMotionHumanPunch.IParams, "technique" | "hand">;

  /** A cross: the rear straight. */
  cross: Omit<IAutoMovieMotionHumanPunch.IParams, "technique" | "hand">;

  /** A hook with the lead hand. */
  leadHook: Omit<IAutoMovieMotionHumanPunch.IParams, "technique" | "hand">;

  /** A hook with the rear hand. */
  rearHook: Omit<IAutoMovieMotionHumanPunch.IParams, "technique" | "hand">;

  /** An uppercut with the lead hand. */
  leadUppercut: Omit<IAutoMovieMotionHumanPunch.IParams, "technique" | "hand">;

  /** An uppercut with the rear hand. */
  rearUppercut: Omit<IAutoMovieMotionHumanPunch.IParams, "technique" | "hand">;

  /** A rear round kick. */
  roundKick: Omit<IAutoMovieMotionHumanKick.IParams, "technique" | "leg">;

  /** A round kick with the lead leg. */
  switchKick: Omit<IAutoMovieMotionHumanKick.IParams, "technique" | "leg">;

  /** A push kick with the lead foot. */
  pushKick: Omit<IAutoMovieMotionHumanKick.IParams, "technique" | "leg">;

  /** A push kick with the rear foot. */
  teep: Omit<IAutoMovieMotionHumanKick.IParams, "technique" | "leg">;

  /** A knee with the lead leg. */
  leadKnee: Omit<IAutoMovieMotionHumanKnee.IParams, "leg">;

  /** A knee with the rear leg. */
  rearKnee: Omit<IAutoMovieMotionHumanKnee.IParams, "leg">;
}