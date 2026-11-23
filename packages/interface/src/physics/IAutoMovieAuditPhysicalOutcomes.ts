import type { IAutoMovieContactReceipt } from "./IAutoMovieContactReceipt";

/**
 * Authored contact/fall promises, observation callbacks and failures for auditPhysicalOutcomes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation An authored contact or miss to compare with measured shape-pair episodes. One unsatisfied contact, miss or fall promise, or an unplanned measured episode.
 * @evidence contracts/development/design.md#principled-representation The finite nonnegative film second and tolerance define an inclusive timing window; shape lists are nonempty and names are nonblank. kind selects the failure meaning; seconds uses the film clock and missDistance uses metres or null for a fall.
 * @evidence contracts/development/design.md#minimal-and-owned-surface auditPhysicalOutcomes borrows this promise and requires matching body, shape and observation-source identities. auditPhysicalOutcomes allocates mutable findings for its caller; actionId links a promise or the unexpected receipt.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts admitPhysicalOutcomes checks the promise; a solver promise additionally needs a positive measured impulse at contact, so a geometric overlap alone cannot satisfy it. A finding reports evidence rather than changing the performance; an empty findings array means only the supplied promises and receipts passed.
 */
export namespace IAutoMovieAuditPhysicalOutcomes {
  /**
   * An authored contact or miss to compare with measured shape-pair episodes.
   *
   * The finite nonnegative film second and tolerance define an inclusive timing window; shape lists are nonempty and names are nonblank. auditPhysicalOutcomes borrows this promise and requires matching body, shape and observation-source identities. admitPhysicalOutcomes checks the promise; a solver promise additionally needs a positive measured impulse at contact, so a geometric overlap alone cannot satisfy it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation An authored contact or miss to compare with measured shape-pair episodes.
   * @evidence contracts/development/design.md#principled-representation The finite nonnegative film second and tolerance define an inclusive timing window; shape lists are nonempty and names are nonblank.
   * @evidence contracts/development/design.md#minimal-and-owned-surface auditPhysicalOutcomes borrows this promise and requires matching body, shape and observation-source identities.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts admitPhysicalOutcomes checks the promise; a solver promise additionally needs a positive measured impulse at contact, so a geometric overlap alone cannot satisfy it.
   */
  export interface IAction {
    /** Screenplay action id. */
    id: string;

    /** Planned contact/miss second. */
    seconds: number;

    /** Allowed absolute timing error, seconds. */
    tolerance: number;

    /** Attacking scene body. */
    actor: string;

    /** Receiving scene body. */
    target: string;

    /** Allowed striking collider ids. */
    actorShapes: string[];

    /** Allowed receiving collider ids. */
    targetShapes: string[];

    /** A planned hit/block or a planned miss. */
    expected: "contact" | "miss";

    /** Required observation source. */
    source: "geometric" | "solver";
  }

  /**
   * One unsatisfied contact, miss or fall promise, or an unplanned measured episode.
   *
   * kind selects the failure meaning; seconds uses the film clock and missDistance uses metres or null for a fall. auditPhysicalOutcomes allocates mutable findings for its caller; actionId links a promise or the unexpected receipt. A finding reports evidence rather than changing the performance; an empty findings array means only the supplied promises and receipts passed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation One unsatisfied contact, miss or fall promise, or an unplanned measured episode.
   * @evidence contracts/development/design.md#principled-representation kind selects the failure meaning; seconds uses the film clock and missDistance uses metres or null for a fall.
   * @evidence contracts/development/design.md#minimal-and-owned-surface auditPhysicalOutcomes allocates mutable findings for its caller; actionId links a promise or the unexpected receipt.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A finding reports evidence rather than changing the performance; an empty findings array means only the supplied promises and receipts passed.
   */
  export interface IFinding {
    /** Owning action or unexpected receipt id. */
    actionId: string;

    /** Failure category. */
    kind:
      | "missed-contact"
      | "unexpected-contact"
      | "unplanned-contact"
      | "wrong-fall";

    /** Planned or observed film second. */
    seconds: number;

    /** Actual geometric surface gap, metres; null for a fall. */
    missDistance: number | null;

    /** Human-readable measured failure. */
    message: string;
  }

  /**
   * Authored outcome promises and independent observations for a synchronous audit.
   *
   * All event times use the same nonnegative film-second clock; an absent observedFalls entry means that body has no observed fall. The audit borrows arrays and calls missDistance only for a missing contact and allowUnplanned only for unused receipts; callback errors propagate and callbacks are not retained. admitPhysicalOutcomes validates windows, identities and receipt authority; missDistance must return a finite value. Empty populations are allowed and do not prove an unobserved performance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Authored outcome promises and independent observations for a synchronous audit.
   * @evidence contracts/development/design.md#principled-representation All event times use the same nonnegative film-second clock; an absent observedFalls entry means that body has no observed fall.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The audit borrows arrays and calls missDistance only for a missing contact and allowUnplanned only for unused receipts; callback errors propagate and callbacks are not retained.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts admitPhysicalOutcomes validates windows, identities and receipt authority; missDistance must return a finite value. Empty populations are allowed and do not prove an unobserved performance.
   */
  export interface IInput {
    /** Screenplay contact/miss requirements. */
    actions: IAutoMovieAuditPhysicalOutcomes.IAction[];

    /** Measured geometric or solved episodes. */
    contacts: IAutoMovieContactReceipt[];

    /** Required falls. */
    falls: {
      /** Nonblank authored fall identity copied to a wrong-fall finding. */
      id: string;

      /** Nonblank scene body key looked up in observedFalls. */
      body: string;

      /** Expected first fall on the shared film clock, finite nonnegative seconds. */
      seconds: number;

      /** Finite nonnegative permitted absolute timing difference, seconds; equality passes. */
      tolerance: number;
    }[];

    /** First observed fall per scene body. */
    observedFalls: Record<string, number>;

    /** Synchronous surface-gap measurement in metres for a missing contact. Return a finite value; the action is borrowed, exceptions abort the audit, and the callback is not retained.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Specifies the missDistance callback or sampling contract, including its clock and ownership obligations.
     */
    missDistance: (action: IAutoMovieAuditPhysicalOutcomes.IAction) => number;

    /** Synchronous exemption for an unmatched borrowed receipt, such as floor support. True suppresses its unplanned-contact finding; exceptions propagate and the callback is not retained.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Specifies the allowUnplanned callback or sampling contract, including its clock and ownership obligations.
     */
    allowUnplanned: (receipt: IAutoMovieContactReceipt) => boolean;
  }
}
