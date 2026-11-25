import type { IAutoMovieMotionEvent } from "../../IAutoMovieMotionEvent";
import type { IAutoMovieMotionHumanContactWindow } from "../law/IAutoMovieMotionHumanContactWindow";

/**
 * Whether what an action declares about its own time is coherent, and whether
 * its named instants fall where its contract says: in a stated order, and at
 * the same film second as a partner's.
 *
 * Everything that reads a plan trusts its declarations: an author cuts at an
 * event, a reaction aligns to one, the foot audit reads the plant windows. A
 * plan whose event lies outside its action, whose two events share a name,
 * whose window ends before it starts or whose decisive instant lies after its
 * end misleads all of them without any pose looking wrong. `faults` reads those
 * declarations against what their owners document; `order` and `shared` read
 * the named instants a law's contract speaks of.
 */
export namespace IAutoMovieMotionHumanAuditTiming {
  /**
   * A placed action as this audit reads it. `HumanPerformance.segments` yields
   * such spans.
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
