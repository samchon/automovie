import type { IAutoMovieMotionHumanCarry } from "../carrying/IAutoMovieMotionHumanCarry";
import type { IAutoMovieMotionHumanThrowObjectParams } from "../throwing/IAutoMovieMotionHumanThrowObjectParams";
import type { IAutoMovieMotionHumanUseTool } from "../tasks/IAutoMovieMotionHumanUseTool";
import type { IAutoMovieMotionHumanWipe } from "../tasks/IAutoMovieMotionHumanWipe";

/**
 * Open parameters of the labour lexicon family, keyed by each runtime export name.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The labour family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the labour row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconLabourParams {
  /** Carry a box in both hands. */
  carryBox: Omit<IAutoMovieMotionHumanCarry.IParams, "how">;

  /** Carry a bag or a case in one hand. */
  carryBag: Omit<IAutoMovieMotionHumanCarry.IParams, "how">;

  /** Carry a load on the hip, as a basket or a child is carried. */
  carryOnHip: Omit<IAutoMovieMotionHumanCarry.IParams, "how">;

  /** Push a cart, a pram or a trolley ahead. */
  pushCart: Omit<IAutoMovieMotionHumanCarry.IParams, "how">;

  /** Haul a heavy load slowly in both hands (the load is a quarter of the body's mass, the most a carry accepts). */
  haul: Omit<IAutoMovieMotionHumanCarry.IParams, "how" | "pace" | "load">;

  /** Drive nails: a hammer swung four times. */
  hammer: Omit<IAutoMovieMotionHumanUseTool.IParams, "tool" | "cycles">;

  /** Saw through a board. */
  saw: Omit<IAutoMovieMotionHumanUseTool.IParams, "tool">;

  /** Stir a pot. */
  stir: Omit<IAutoMovieMotionHumanUseTool.IParams, "tool">;

  /** Drive a screw. */
  screw: Omit<IAutoMovieMotionHumanUseTool.IParams, "tool">;

  /** Scrub a surface: six passes of the cloth. */
  scrub: Omit<IAutoMovieMotionHumanWipe.IParams, "cycles">;

  /** Toss something lightly to a place or a person. */
  toss: Omit<IAutoMovieMotionHumanThrowObjectParams, "style">;

  /** Hurl something overarm. */
  hurl: Omit<IAutoMovieMotionHumanThrowObjectParams, "style">;
}
