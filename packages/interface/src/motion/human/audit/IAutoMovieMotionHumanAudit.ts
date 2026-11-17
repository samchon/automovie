import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";
import type { IAutoMovieMotionHumanAuditTangle } from "./IAutoMovieMotionHumanAuditTangle";

/**
 * The generic audit of a displayed human motion: every check that holds for
 * any action whatever it means to do, read from the displayed bones alone.
 *
 * - `tangle`: no part of the body passes into another part of it.
 * - `floor`: no collider sinks below the floor.
 * - `slip`, `lift`: a foot declared planted stays where it stands, on the floor.
 * - `jump`, `reversal`, `speed`: every joint centre travels a continuous path
 *   with no out-and-back spike and no impossible speed.
 * - `balance`: while both feet alone bear the body, its extrapolated centre
 *   of mass stays over them.
 *
 * Each check has a limit; a reading above its limit is a finding. A limit of
 * `null` leaves the check unread, for an action a check does not apply to (a
 * fall is meant to lose its balance). What an action intends (which hand
 * reaches where, at which beat) is not the audit's: that is pinned by the
 * action's own tests.
 *
 * @evidence contracts/development/common.md#meaningful-documentation rate: Grid samples per second; 24 by default. limits: Limits that replace the defaults. measures: Every check's reading; absent for a check left unread.
 * @evidence contracts/development/design.md#principled-representation rate: Grid samples per second; 24 by default. limits: Limits that replace the defaults. measures: Every check's reading; absent for a check left unread.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.run, options); audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.run, return); audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.describe, report); audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.describe, f); audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.LIMITS); audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.CHECKS).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanAuditMeasure, IAutoMovieMotionHumanAuditTangle.IPair identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanAudit {
  /**
   * The name of a check.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The name of a check.
   * @evidence contracts/development/design.md#principled-representation Closed choices "tangle", "floor", "slip", "lift", "jump", "reversal", "speed", "balance" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.LIMITS); audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.CHECKS).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.
   */
  export type Check =
    | "tangle"
    | "floor"
    | "slip"
    | "lift"
    | "jump"
    | "reversal"
    | "speed"
    | "balance";

  /**
   * The largest reading each check allows; `null` leaves a check unread.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The largest reading each check allows; `null` leaves a check unread.
   * @evidence contracts/development/design.md#principled-representation Closed choices null distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.run).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanAudit.Check identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type ILimits = Record<IAutoMovieMotionHumanAudit.Check, number | null>;

  /**
   * Audit one person of a motion. How an audit is run.
   *
   * @evidence contracts/development/common.md#meaningful-documentation rate: Grid samples per second; 24 by default. limits: Limits that replace the defaults.
   * @evidence contracts/development/design.md#principled-representation rate: Grid samples per second; 24 by default. limits: Limits that replace the defaults.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.run, options).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanAudit.ILimits identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IOptions {
    /** Grid samples per second; 24 by default. */
    rate?: number;

    /** Limits that replace the defaults. */
    limits?: Partial<IAutoMovieMotionHumanAudit.ILimits>;
  }

  /**
   * A reading above its limit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation check: The check that read it. limit: The limit it exceeds.
   * @evidence contracts/development/design.md#principled-representation check: The check that read it. limit: The limit it exceeds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.describe, f); audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.run).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanAudit.Check identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IFinding extends IAutoMovieMotionHumanAuditMeasure {
    /** The check that read it. */
    check: IAutoMovieMotionHumanAudit.Check;

    /** The limit it exceeds. */
    limit: number;
  }

  /**
   * Audit one person of a motion. What an audit read.
   *
   * @evidence contracts/development/common.md#meaningful-documentation measures: Every check's reading; absent for a check left unread.
   * @evidence contracts/development/design.md#principled-representation measures: Every check's reading; absent for a check left unread.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.run, return); audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.describe, report); audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.run); audit/HumanVerdicts.ts (HumanVerdicts.of).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanAudit.Check, IAutoMovieMotionHumanAuditMeasure, IAutoMovieMotionHumanAuditTangle.IPair, IAutoMovieMotionHumanAudit.IFinding identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IReport {
    /** Every check's reading; absent for a check left unread. */
    measures: Partial<
      Record<
        IAutoMovieMotionHumanAudit.Check,
        IAutoMovieMotionHumanAuditMeasure
      >
    >;

    /** Every pair of body parts that passed into each other, deepest first; empty when `tangle` is unread. */
    pairs: IAutoMovieMotionHumanAuditTangle.IPair[];

    /** The readings above their limits, in check order. */
    findings: IAutoMovieMotionHumanAudit.IFinding[];
  }
}
