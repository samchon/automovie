import type { IAutoMovieMotionHumanOperate } from "../affordance/IAutoMovieMotionHumanOperate";
import type { IAutoMovieMotionHumanPickUp } from "../handling/IAutoMovieMotionHumanPickUp";
import type { IAutoMovieMotionHumanPutDown } from "../handling/IAutoMovieMotionHumanPutDown";
import type { IAutoMovieMotionHumanRelease } from "../throwing/IAutoMovieMotionHumanRelease";
import type { IAutoMovieMotionHumanWeaponPresent } from "./IAutoMovieMotionHumanWeaponPresent";

/**
 * Open parameters of the archery lexicon family, keyed by each runtime export name: archery's rows of #3487.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The archery family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the archery row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconArcheryParams {
  /** Take an arrow by its shaft. */
  takeArrow: Omit<IAutoMovieMotionHumanPickUp.IParams, "handle">;

  /** Set the arrow's nock on the bow's string. */
  nockArrow: IAutoMovieMotionHumanPutDown.IParams;

  /** Hold the bow out in one hand on the line from the face to the target. */
  presentBow: Omit<IAutoMovieMotionHumanWeaponPresent.IPresent, "anchor" | "hands" | "from" | "tip" | "edge" | "extended">;

  /** Draw the string back to the anchor, over `presentBow`. */
  drawBow: IAutoMovieMotionHumanOperate.IParams;

  /** Let the string go: the nocked arrow flies at the bow's speed. */
  loose: IAutoMovieMotionHumanRelease.IParams;

  /** Span a crossbow by its string or its crank. */
  spanCrossbow: IAutoMovieMotionHumanOperate.IParams;

  /** Hold the crossbow to the cheek on the line to the target. */
  presentCrossbow: Omit<IAutoMovieMotionHumanWeaponPresent.IPresent, "anchor">;

  /** Press the crossbow's trigger. */
  shootCrossbow: IAutoMovieMotionHumanWeaponPresent.IWield;
}