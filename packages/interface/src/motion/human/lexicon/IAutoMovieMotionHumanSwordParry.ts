import type { IAutoMovieMotionHumanSword } from "./IAutoMovieMotionHumanSword";

/**
 * The parry of blade work: the strong of the blade brought across an
 * incoming blade where its attack is stopped.
 *
 * A parry answers an attack the author declared `parried` (`HumanSword`),
 * named by its anchor. It reads the attacker's blade at the attack's
 * decisive instant, where that blade stands stopped, and puts its own blade
 * across it there: point up for a high line and down for a low one, on the
 * defender's side, the two centre lines `HumanSword.GAP` apart. The parry
 * waits in the hold it was entered in for as long as puts its meeting
 * (`stroke`) on the attack's decisive instant, so a parry that starts in
 * time meets its attack; `sync` with `align: "stroke"` starts it in time.
 * With no attack named it closes a line as a drill.
 *
 * It meets the attacking blade on its weak and, while the arm cannot hold
 * its own blade across it there, slides the meeting back along that blade
 * (`SLIDE`), where the stopped blade stands farther from the defender. A
 * blade to meet that lies beyond the arm is refused. First pass: the meeting
 * is where the stopped attack stands, so a parry does not beat the attacking
 * blade aside, and a bind is not planned.
 *
 * @evidence contracts/development/common.md#meaningful-documentation against: The anchor of the cut or thrust it meets; a drill to `line` when absent. line: The line closed when it answers no attack; `highOutside` when absent. hold: Seconds the blades stay together after they meet: a beat leaves at once, a bind stays; 0.15 when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#principled-representation against: The anchor of the cut or thrust it meets; a drill to `line` when absent. line: The line closed when it answers no attack; `highOutside` when absent. hold: Seconds the blades stay together after they meet: a beat leaves at once, a bind stays; 0.15 when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanSwordParry.ts (HumanSwordParry.meet, context); lexicon/HumanSwordParry.ts (HumanSwordParry.parry, context); lexicon/HumanSwordParry.ts (HumanSwordParry.meet); lexicon/HumanSwordParry.ts (HumanSwordParry.parry).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanSwordParry.meet.
 */
export namespace IAutoMovieMotionHumanSwordParry {
  /**
   * The line a parry closes when it answers no attack: high or low, on the blade hand's side (`outside`) or across the body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The line a parry closes when it answers no attack: high or low, on the blade hand's side (`outside`) or across the body.
   * @evidence contracts/development/design.md#principled-representation Closed choices "highOutside", "highInside", "lowOutside", "lowInside" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanSwordParry.ts (HumanSwordParry.meet).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanSwordParry.meet.
   */
  export type Opening =
    | "highOutside"
    | "highInside"
    | "lowOutside"
    | "lowInside";

  /**
   * Where the parry meets: the drill's line, or the attacker's stopped blade read through the attack's anchor, `weak` of its length back from its point. Parameters of a parry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation against: The anchor of the cut or thrust it meets; a drill to `line` when absent. line: The line closed when it answers no attack; `highOutside` when absent. hold: Seconds the blades stay together after they meet: a beat leaves at once, a bind stays; 0.15 when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
   * @evidence contracts/development/design.md#principled-representation against: The anchor of the cut or thrust it meets; a drill to `line` when absent. line: The line closed when it answers no attack; `highOutside` when absent. hold: Seconds the blades stay together after they meet: a beat leaves at once, a bind stays; 0.15 when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanSwordParry.ts (HumanSwordParry.meet, context); lexicon/HumanSwordParry.ts (HumanSwordParry.parry, context); lexicon/HumanSwordParry.ts (HumanSwordParry.meet); lexicon/HumanSwordParry.ts (HumanSwordParry.parry).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanSwordParry.Opening identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IParry extends IAutoMovieMotionHumanSword.IWield {
    /** The anchor of the cut or thrust it meets; a drill to `line` when absent. */
    against?: string;

    /** The line closed when it answers no attack; `highOutside` when absent. */
    line?: IAutoMovieMotionHumanSwordParry.Opening;

    /** Seconds the blades stay together after they meet: a beat leaves at once, a bind stays; 0.15 when absent.
     * Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    hold?: number;
  }
}
