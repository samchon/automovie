import type { IAutoMovieMotionHumanDive } from "../floor/IAutoMovieMotionHumanDive";
import type { IAutoMovieMotionHumanCollapse } from "../reaction/IAutoMovieMotionHumanCollapse";

/**
 * Open parameters of the floorFall lexicon family, keyed by each runtime export name.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The floorFall family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the floorFall row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconFloorFallParams {
  /** A goalkeeper's dive to the left: off the feet to the side, landing on the side with the hip and the lower hand on the floor. */
  goalkeeperDiveLeft: Omit<IAutoMovieMotionHumanDive.IParams, "kind" | "side">;

  /** A goalkeeper's dive to the right. */
  goalkeeperDiveRight: Omit<IAutoMovieMotionHumanDive.IParams, "kind" | "side">;

  /** A sliding tackle: leaning back onto the hip and sliding forward with the lead leg reaching ahead. */
  slidingTackle: Omit<IAutoMovieMotionHumanDive.IParams, "kind">;

  /** A staged collapse forward, sideways, backward or in place, limp or protective, for a faint or a fatal hit. */
  collapse: IAutoMovieMotionHumanCollapse.IParams;
}
