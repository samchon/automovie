import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanChainCore } from "../chain/IAutoMovieMotionHumanChainCore";
import type { IAutoMovieMotionHumanFormation } from "./IAutoMovieMotionHumanFormation";

/**
 * A change of formation, planned as each member's own travel from its old slot
 * to its new one: a wheel, a column deploying into line, a square, a line
 * opening or closing order, a crowd re-forming.
 *
 * The target formation is data (`IAutoMovieMotionHumanFormation`); the
 * manoeuvre adds the four choices that decide it, each a small closed union:
 * how members take the new slots (`assign`), what way each goes (`path`), who
 * steps off when after the word (`order`), and what each rank does on arrival
 * (`arrive`). A drill is a row of those four (`HUMAN_MANOEUVRES`). Each
 * member's part is then appended to its chain as the vocabulary's travel synced
 * to the word (`HumanManoeuvre.append`), so the cuts, refusals and verdicts are
 * the march's and the stand's.
 */
export interface IAutoMovieMotionHumanManoeuvre {
  /** The formation the members stand in. */
  from: IAutoMovieMotionHumanFormation;

  /** The formation they form. */
  to: IAutoMovieMotionHumanFormation;

  /** A drill by name, or the four choices directly. */
  rule:
    | IAutoMovieMotionHumanManoeuvre.Row
    | IAutoMovieMotionHumanManoeuvre.IRule;

  /** The word of execution, or any instant the members step off after. */
  on: IAutoMovieMotionHumanChainCore.ISync;

  /**
   * The film second of the word, for the plan's own checks of the ways in time;
   * the sync places the parts.
   */
  at: number;

  /**
   * The travel: the drill's march or quick time, double time, a walk or a run;
   * `march` when absent.
   */
  gait?: "march" | "double" | "walk" | "run";

  /**
   * A wheel's pivot flank: its left or right file of the front rank, or the
   * front's centre; `left` when absent.
   */
  pivot?: "left" | "right" | "centre";
}

/**
 * Contracts used by HumanManoeuvre.plan, HumanManoeuvre.append, flanked,
 * travelSpeeds.
 */
export namespace IAutoMovieMotionHumanManoeuvre {
  /** The drills `HUMAN_MANOEUVRES` holds. */
  export type Row =
    | "wheel"
    | "deploy"
    | "ploy"
    | "square"
    | "extend"
    | "close"
    | "face"
    | "free";

  /** The four choices that decide a manoeuvre. */
  export interface IRule {
    /** Keep member order, or the least total distance (Kuhn 1955). */
    assign: "order" | "nearest";

    /**
     * About the pivot, slanting to the new place, by the flank (along the
     * target's front to the member's file, then up into its place), direct, a
     * turn only, or the way the crowd's steering pass gives
     * (`HumanCrowd.steer`).
     */
    path: "arc" | "oblique" | "flank" | "straight" | "inPlace" | "steered";

    /**
     * Who steps off first after the word: all together, the farthest first, the
     * nearest first, or the front rank first.
     */
    order: "together" | "farFirst" | "nearFirst" | "byRank";

    /**
     * What each rank does on arrival: the front, the rear or every rank stands
     * or kneels; stands when absent.
     */
    arrive?: Readonly<
      Partial<Record<"front" | "rear" | "all", "stand" | "kneel">>
    >;
  }

  /** One member's share of a manoeuvre. */
  export interface IPart {
    /** The member's index. */
    member: number;

    /** Its new slot. */
    slot: number;

    /** Seconds after the word it steps off, before its own latency. */
    delay: number;

    /** Its way, from its old slot to its new one, world metres. */
    via: readonly IAutoMovieVector3[];

    /** Its heading on arrival, degrees. */
    face: number;

    /** What it does on arrival. */
    arrive: "stand" | "kneel";

    /**
     * The place it keeps on the way: its slot of a wheel's turning formation
     * (`manoeuvreWheel`), so its step shortens with its radius, or its place on
     * its straight way at the unit's pace, the slowest member's, so a block
     * keeps together; it travels its way at its own pace when absent (a steered
     * way, a turn in place).
     */
    station?: IAutoMovieMotionHumanFormation.IStation;
  }
}
