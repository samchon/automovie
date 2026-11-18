import type { IAutoMovieMotionHumanOperate } from "../affordance/IAutoMovieMotionHumanOperate";

/**
 * Open parameters of the revolver lexicon family, keyed by each runtime export name: a revolver's handling of #3488.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The revolver family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the revolver row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconRevolverParams {
  /** Cock the hammer with the thumb. */
  cock: IAutoMovieMotionHumanOperate.IParams;

  /** Fan the hammer with the other palm. */
  fanHammer: IAutoMovieMotionHumanOperate.IParams;

  /** Open the loading gate. */
  openGate: IAutoMovieMotionHumanOperate.IParams;

  /** Load a cartridge into the chamber at the gate. */
  loadChamber: IAutoMovieMotionHumanOperate.IParams;

  /** Close the loading gate. */
  closeGate: IAutoMovieMotionHumanOperate.IParams;
}