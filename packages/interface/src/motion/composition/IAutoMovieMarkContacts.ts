import type { IAutoMovieContactReceipt } from "../../physics/IAutoMovieContactReceipt";

/**
 * Inputs for drawing the force carried by solved contact steps.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Receipt samples and the query share a seconds clock, contact points are world metres, impulses are newton-seconds, arrow scale is metres per newton and the optional clamp is metres. The mark producer admits positive finite scale, clamp and acting-step duration; geometric receipts produce no force arrow.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieMarkContacts contracts used by packages/engine/src/composition/markAutoMovieContacts.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation Receipt samples and the query share a seconds clock, contact points are world metres, impulses are newton-seconds and arrow scale is metres per newton. The mark producer admits positive finite scale and acting-step duration; geometric receipts produce no force arrow. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieMarkContacts contract belongs to interface; packages/engine/src/composition/markAutoMovieContacts.ts uses its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieMarkContacts {
  /**
   * Turn the solved contacts acting at one second into inspection marks: for each contact, one arrow per collider at the contact point, along the force that collider receives, as long as the mean force times a stated scale.
   *
   * A receipt acts at `seconds` when the solver measured it: its latest completed step at or before `seconds`, within that step's duration, has a positive finite impulse and no positive separation. Both arrows start at that step's point and are `metresPerNewton` times the step's mean force, its impulse over its duration, long; the first collider's points against the normal and the second's along it. Geometric receipts, which assert no impulse, draw nothing.
   *
   * Each mark has kind `contact`, label `contact force`, colour teal `00c2a8` and the path `<body>/<bone>/contact/<receipt id>` of the collider it acts on, first collider first, in world metres and unanchored. A collider's mark is flagged when the step states the impulse each side received and that collider received none; a step without that statement is a direct native measurement and is not flagged.
   *
   * With `maximumLength`, an arrow that would be longer keeps its direction, is drawn at that length, and takes kind `contact/clamped`, colour dark teal `007a6a` and a label stating the length and the least force it stands for, so a clamped arrow is never read at its drawn length; `marks=contact` still selects it.
   *
   * It throws for a scale or a maximum length that is not positive and finite and for an acting step without a positive duration.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explains receipt selection, timestamp tolerance, force-to-arrow scale, the per-collider direction, path and flag, and the clamped kind.
   * @evidence contracts/development/design.md#principled-representation Receipt times and sample seconds share a clock; scale is positive finite metres/newton and the optional maximum is positive finite metres, both checked by markAutoMovieContacts, which also rejects nonpositive acting-step duration.
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
    /** Longest drawn arrow, metres; a longer arrow is drawn at this length as `contact/clamped`. Absent, every arrow keeps its scaled length. markAutoMovieContacts rejects nonfinite or nonpositive values. */
    maximumLength?: number;
  };
}
