import type { IAutoMovieMotionHumanCarry } from "../carrying/IAutoMovieMotionHumanCarry";
import type { IAutoMovieMotionHumanHoldInfant } from "../tasks/IAutoMovieMotionHumanHoldInfant";
import type { IAutoMovieMotionHumanLongTool } from "../tasks/IAutoMovieMotionHumanLongTool";
import type { IAutoMovieMotionHumanUseTool } from "../tasks/IAutoMovieMotionHumanUseTool";
import type { IAutoMovieMotionHumanWipe } from "../tasks/IAutoMovieMotionHumanWipe";
import type { IAutoMovieMotionHumanThrowObjectParams } from "../throwing/IAutoMovieMotionHumanThrowObjectParams";

/**
 * Open parameters of the labour lexicon family, keyed by each runtime export name.
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

  /** Chop or split overhead with an axe onto a block or a log. */
  chop: Omit<IAutoMovieMotionHumanLongTool.IParams, "stroke">;

  /** Chop level into a standing trunk. */
  sideChop: Omit<IAutoMovieMotionHumanLongTool.IParams, "stroke">;

  /** Swing a sledgehammer or a pickaxe down at the ground. */
  sledge: Omit<IAutoMovieMotionHumanLongTool.IParams, "stroke">;

  /** Dig with a shovel and throw each load aside. */
  dig: Omit<IAutoMovieMotionHumanLongTool.IParams, "stroke">;

  /** Rake or hoe the ground toward oneself. */
  rake: Omit<IAutoMovieMotionHumanLongTool.IParams, "stroke">;

  /** Cradle an infant across the front, its head in the holding arm's crook. */
  cradleInfant: Omit<IAutoMovieMotionHumanHoldInfant.IParams, "hold">;

  /** Hold an infant against the shoulder and pat its back. */
  burpInfant: Omit<IAutoMovieMotionHumanHoldInfant.IParams, "hold">;

  /** Feed a cradled infant from a bottle in the other hand. */
  feedInfant: Omit<IAutoMovieMotionHumanHoldInfant.IParams, "hold">;
}
