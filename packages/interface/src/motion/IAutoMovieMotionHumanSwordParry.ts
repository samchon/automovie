import type { IAutoMovieMotionHumanSword } from "./IAutoMovieMotionHumanSword";

/**
 * The parry of blade work: the strong of the blade brought across an incoming
 * blade where its attack is stopped.
 *
 * A parry answers an attack the author declared `parried` (`HumanSword`), named
 * by its anchor. It reads the attacker's blade at the attack's decisive
 * instant, where that blade stands stopped, and puts its own blade across it
 * there: point up for a high line and down for a low one, on the defender's
 * side, the two centre lines `HumanSword.GAP` apart. The parry waits in the
 * hold it was entered in for as long as puts its meeting (`stroke`) on the
 * attack's decisive instant, so a parry that starts in time meets its attack;
 * `sync` with `align: "stroke"` starts it in time. With no attack named it
 * closes a line as a drill.
 *
 * It meets the attacking blade on its weak and, while the arm cannot hold its
 * own blade across it there, slides the meeting back along that blade
 * (`SLIDE`), where the stopped blade stands farther from the defender. A blade
 * to meet that lies beyond the arm is refused. The meeting is where the stopped
 * attack stands. An attack declared `taken` ends where it was stopped, the
 * parry carries its blade aside while the blades stay together, and a taken
 * blade (`ITaken`) follows it. First pass: a blade not taken is not beaten
 * aside.
 */
export namespace IAutoMovieMotionHumanSwordParry {
  /**
   * The line a parry closes when it answers no attack: high or low, on the
   * blade hand's side (`outside`) or across the body.
   */
  export type Opening =
    | "highOutside"
    | "highInside"
    | "lowOutside"
    | "lowInside";

  /**
   * Where the parry meets: the drill's line, or the attacker's stopped blade
   * read through the attack's anchor, `weak` of its length back from its point.
   * Parameters of a parry.
   */
  export interface IParry extends IAutoMovieMotionHumanSword.IWield {
    /** The anchor of the cut or thrust it meets; a drill to `line` when absent. */
    against?: string;

    /** The line closed when it answers no attack; `highOutside` when absent. */
    line?: IAutoMovieMotionHumanSwordParry.Opening;

    /**
     * Seconds the blades stay together after they meet, at least 0: a beat
     * leaves at once, a bind stays; as long as the stopped attack stays where
     * it was met when absent, none for a drill.
     */
    hold?: number;
  }

  /**
   * Parameters of a taken blade: the attacker's blade, stopped and taken by a
   * parry, kept on the parrying blade while that parry carries it aside, then
   * held where it was left.
   */
  export interface ITaken extends IAutoMovieMotionHumanSword.IWield {
    /** The anchor of the parry that took the blade. */
    against: string;

    /**
     * The anchor of the action whose end it is held to; that parry's own end
     * when absent.
     */
    until?: string;
  }
}
