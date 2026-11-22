import type { IAutoMovieMotionHumanSword } from "./IAutoMovieMotionHumanSword";

/**
 * The guards of blade work: the blade taken from where the hand holds it to
 * a named guard and kept there.
 *
 * A guard is named by where the hilt is held, the tradition-neutral names
 * of the swordplay campaign (#3202, decision 8). Its pose is a row of
 * `GUARDS`: the hilt's place from the blade hand's shoulder in arm lengths,
 * the way the blade points and the way its true edge faces, so one row fits
 * every body and every blade. The action ends in the guard: what follows is
 * entered from it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation guard: The guard; `middle` when absent. duration: Seconds, at least the 0.5 s (provisional) the guard takes to set; 1 when absent. Inclusive minimum: 0. Unit: "s".
 * @evidence contracts/development/design.md#principled-representation guard: The guard; `middle` when absent. duration: Seconds, at least the 0.5 s (provisional) the guard takes to set; 1 when absent. Inclusive minimum: 0. Unit: "s".
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanSwordGuard.ts (HumanSwordGuard.guard, context); lexicon/HumanSwordGuard.ts (HumanSwordGuard.GUARDS); lexicon/HumanSwordGuard.ts (HumanSwordGuard.guard).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanSwordGuard.guard.
 */
export namespace IAutoMovieMotionHumanSwordGuard {
  /**
   * A guard, named by where the hilt is held.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A guard, named by where the hilt is held.
   * @evidence contracts/development/design.md#principled-representation Closed choices "high", "shoulder", "middle", "low", "ox", "hanging", "tail" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanSwordGuard.ts (HumanSwordGuard.GUARDS); lexicon/HumanSwordGuard.ts (HumanSwordGuard.guard).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanSwordGuard.GUARDS.
   */
  export type Guard =
    | "high"
    | "shoulder"
    | "middle"
    | "low"
    | "ox"
    | "hanging"
    | "tail";

  /**
   * Parameters of a guard.
   *
   * @evidence contracts/development/common.md#meaningful-documentation guard: The guard; `middle` when absent. duration: Seconds, at least the 0.5 s (provisional) the guard takes to set; 1 when absent. Inclusive minimum: 0. Unit: "s".
   * @evidence contracts/development/design.md#principled-representation guard: The guard; `middle` when absent. duration: Seconds, at least the 0.5 s (provisional) the guard takes to set; 1 when absent. Inclusive minimum: 0. Unit: "s".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanSwordGuard.ts (HumanSwordGuard.guard, context); lexicon/HumanSwordGuard.ts (HumanSwordGuard.guard).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanSwordGuard.Guard identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IParams extends IAutoMovieMotionHumanSword.IWield {
    /** The guard; `middle` when absent. */
    guard?: IAutoMovieMotionHumanSwordGuard.Guard;

    /** Seconds, at least the 0.5 s (provisional) the guard takes to set; 1 when absent. */
    duration?: number;
  }
}
