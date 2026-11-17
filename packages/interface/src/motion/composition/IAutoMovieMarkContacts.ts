import type { IAutoMovieContactReceipt } from "../../physics/IAutoMovieContactReceipt";

/** Inputs for drawing the force carried by solved contact steps. */
export namespace IAutoMovieMarkContacts {
  /**
 * Turn the solved contacts acting at one second into inspection marks: one arrow per contact, at the contact point along its normal, as long as the mean force times a stated scale.
 *
 * A receipt acts at `seconds` when the solver measured it: its latest completed step at or before `seconds`, within that step's duration, has a positive finite impulse and no positive separation. The arrow starts at that step's point and runs along its normal, from the first collider toward the second, for `metresPerNewton` times the step's mean force, its impulse over its duration. Geometric receipts, which assert no impulse, draw nothing.
 *
 * The mark has kind `contact`, label `contact force`, colour teal `00c2a8` and path `<body>/<bone>/contact/<receipt id>` of the first collider, in world metres and unanchored.
 *
 * It throws for a scale that is not positive and finite and for an acting step without a positive duration.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains receipt selection, timestamp tolerance and force-to-arrow scale.
 * @evidence contracts/development/design.md#principled-representation Receipt times and sample seconds share a clock; scale is positive finite metres/newton, checked by markAutoMovieContacts, which also rejects nonpositive acting-step duration.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The mark producer borrows solver receipts and creates unanchored world-space arrows; geometric receipts carry no force arrow.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contract reuses contact receipts instead of duplicating solver samples or manufacturing a force for geometric touches.
 */
  export type IProps = {
    /** Borrowed receipts; only solver receipts with samples are drawn. Samples must be ordered by time because lookup scans backwards. Empty input returns no marks. */
    receipts: readonly IAutoMovieContactReceipt[];
    /** Sample time in seconds on the receipts' clock. A step applies from its timestamp (with 1e-9-second lookup tolerance) until, but not including, timestamp plus duration. */
    seconds: number;
    /** Arrow length per newton of mean force, metres/newton; markAutoMovieContacts rejects nonfinite or nonpositive values. */
    metresPerNewton: number;
  };
}
