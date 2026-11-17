import type { IAutoMovieMotionHumanCarryHang } from "../handling/IAutoMovieMotionHumanCarryHang";
import type { IAutoMovieMotionHumanPushSled } from "../handling/IAutoMovieMotionHumanPushSled";
import type { IAutoMovieMotionHumanWalkParams } from "../actions/IAutoMovieMotionHumanWalkParams";

/**
 * Open parameters of the sportCarry lexicon family, keyed by each runtime export name.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The sportCarry family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the sportCarry row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconSportCarryParams {
  /** A farmer's walk: a slow walk with the arms still, carrying what both hands took before it (a kettlebell or a dumbbell in each), so the arms hang and do not swing (provisional: no arm swing, as a loaded carry is taught). The composition gives where to. */
  farmersWalk: Omit<IAutoMovieMotionHumanWalkParams, "pace" | "armSwing">;

  /** The loads of a farmer's walk held at the sides with the arms hanging, performed over `farmersWalk`: the composition names the prop in each hand and how long. */
  farmersHold: IAutoMovieMotionHumanCarryHang.IParams;

  /** A sled push: the handles of a pushed load held in both hands through a slow walk, the trunk leaning as measured pushers do at the handles' height (`pushSledStance`). The composition gives the sled and where to. */
  sledPush: IAutoMovieMotionHumanPushSled.IParams;
}
