import type { IAutoMovieMotionEvent } from "../../IAutoMovieMotionEvent";
import type { IAutoMovieMotionHumanContactWindow } from "../law/IAutoMovieMotionHumanContactWindow";

/**
 * Whether what an action declares about its own time is coherent, and
 * whether its named instants fall where its contract says: in a stated
 * order, and at the same film second as a partner's.
 *
 * Everything that reads a plan trusts its declarations: an author cuts at an
 * event, a reaction aligns to one, the foot audit reads the plant windows.
 * A plan whose event lies outside its action, whose two events share a name,
 * whose window ends before it starts or whose decisive instant lies after
 * its end misleads all of them without any pose looking wrong. `faults`
 * reads those declarations against what their owners document; `order` and
 * `shared` read the named instants a law's contract speaks of.
 *
 * @evidence contracts/development/common.md#meaningful-documentation start: Where the action's own clock starts, film seconds. entryTime: Where the action takes the body over, film seconds. end: Where it ends, film seconds.
 * @evidence contracts/development/design.md#principled-representation start: Where the action's own clock starts, film seconds. entryTime: Where the action takes the body over, film seconds. end: Where it ends, film seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: audit/AutoMovieMotionHumanAuditTiming.ts (AutoMovieMotionHumanAuditTiming.faults, spans); audit/AutoMovieMotionHumanAuditTiming.ts (AutoMovieMotionHumanAuditTiming.faults, span); audit/AutoMovieMotionHumanAuditTiming.ts (AutoMovieMotionHumanAuditTiming.instant, span); audit/AutoMovieMotionHumanAuditTiming.ts (AutoMovieMotionHumanAuditTiming.order, span); audit/AutoMovieMotionHumanAuditTiming.ts (AutoMovieMotionHumanAuditTiming.shared, a); audit/AutoMovieMotionHumanAuditTiming.ts (AutoMovieMotionHumanAuditTiming.shared, b).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionEvent, IAutoMovieMotionHumanContactWindow identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanAuditTiming {
  /**
   * A placed action as this audit reads it. `HumanPerformance.segments`
   * yields such spans.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit.
   * @evidence contracts/development/design.md#principled-representation The placement in film seconds and the plan's declared shares, as their owners state them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A structural subset of the placed segment; only what the rules read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the event and the contact window; the two optional members are optional on the plan itself.
   */
  export interface ISpan {
    /** The action's name, for findings. */
    name: string;

    /** Where the action's own clock starts, film seconds. */
    start: number;

    /** Where the action takes the body over, film seconds. */
    entryTime: number;

    /** Where it ends, film seconds. */
    end: number;

    /** The part of the plan the audit reads. */
    plan: {
      /** The action's own length, seconds. */
      duration: number;

      /** The named instants, shares of the duration. */
      events: readonly IAutoMovieMotionEvent[];

      /** The declared contact windows, shares of the duration. */
      contacts: readonly IAutoMovieMotionHumanContactWindow[];

      /** Seconds from the start to the decisive instant. */
      contact?: number;

      /** Seconds from the start to the contact a feint pretends. */
      feigned?: number;
    };
  }
}
