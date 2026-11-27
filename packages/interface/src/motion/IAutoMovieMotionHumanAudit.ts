import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";
import type { IAutoMovieMotionHumanAuditTangle } from "./IAutoMovieMotionHumanAuditTangle";

/**
 * The generic audit of a displayed human motion: every check that holds for any
 * action whatever it means to do, read from the displayed bones alone.
 *
 * - `tangle`: no part of the body passes into another part of it.
 * - `floor`: no collider sinks below the floor.
 * - `slip`, `lift`: a foot declared planted stays where it stands, on the floor.
 * - `jump`, `reversal`, `speed`: every joint centre travels a continuous path
 *   with no out-and-back spike and no impossible speed.
 * - `balance`: while both feet alone bear the body, its extrapolated centre of
 *   mass stays over them.
 *
 * Each check has a limit; a reading above its limit is a finding. A limit of
 * `null` leaves the check unread, for an action a check does not apply to (a
 * fall is meant to lose its balance). What an action intends (which hand
 * reaches where, at which beat) is not the audit's: that is pinned by the
 * action's own tests.
 */
export namespace IAutoMovieMotionHumanAudit {
  /** The name of a check. */
  export type Check =
    | "tangle"
    | "floor"
    | "slip"
    | "lift"
    | "jump"
    | "reversal"
    | "speed"
    | "balance";

  /** The largest reading each check allows; `null` leaves a check unread. */
  export type ILimits = Record<IAutoMovieMotionHumanAudit.Check, number | null>;

  /** Audit one person of a motion. How an audit is run. */
  export interface IOptions {
    /** Grid samples per second; 24 by default. */
    rate?: number;

    /** Limits that replace the defaults. */
    limits?: Partial<IAutoMovieMotionHumanAudit.ILimits>;
  }

  /** A reading above its limit. */
  export interface IFinding extends IAutoMovieMotionHumanAuditMeasure {
    /** The check that read it. */
    check: IAutoMovieMotionHumanAudit.Check;

    /** The limit it exceeds. */
    limit: number;
  }

  /** Audit one person of a motion. What an audit read. */
  export interface IReport {
    /** Every check's reading; absent for a check left unread. */
    measures: Partial<
      Record<
        IAutoMovieMotionHumanAudit.Check,
        IAutoMovieMotionHumanAuditMeasure
      >
    >;

    /**
     * Every pair of body parts that passed into each other, deepest first;
     * empty when `tangle` is unread.
     */
    pairs: IAutoMovieMotionHumanAuditTangle.IPair[];

    /** The readings above their limits, in check order. */
    findings: IAutoMovieMotionHumanAudit.IFinding[];
  }
}
