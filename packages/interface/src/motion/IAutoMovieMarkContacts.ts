import type { IAutoMovieContactReceipt } from "../physics/IAutoMovieContactReceipt";
import type { IAutoMoviePhysicalOwnershipEvent } from "../physics/IAutoMoviePhysicalOwnershipEvent";

/** Inputs for drawing the force carried by solved contact steps. */
export namespace IAutoMovieMarkContacts {
  /**
   * Turn the solved contacts acting at one second into inspection marks: for
   * each contact, one arrow per collider at the contact point, along the force
   * that collider receives, as long as the mean force times a stated scale.
   *
   * A receipt acts at `seconds` when the solver measured it: its latest
   * completed step at or before `seconds`, within that step's duration, has a
   * positive finite impulse and no positive separation. Both arrows start at
   * that step's point and are `metresPerNewton` times the step's mean force,
   * its impulse over its duration, long; the first collider's points against
   * the normal and the second's along it. Geometric receipts, which assert no
   * impulse, draw nothing.
   *
   * Each mark has kind `contact`, label `contact force`, colour teal `00c2a8`
   * and the path `<body>/<bone>/contact/<receipt id>` of the collider it acts
   * on, first collider first, in world metres and unanchored. A collider's mark
   * is flagged when `ownership` shows its segment dynamic at the step and the
   * step states that it received none of the solved impulse, as when an
   * exaggerated mode's response rounds it to zero. A static or kinematic side
   * never receives a compliant impulse, so its stated zero is not flagged;
   * without `ownership` no mark is flagged.
   *
   * With `maximumLength`, an arrow that would be longer keeps its direction, is
   * drawn at that length, and takes kind `contact/clamped`, colour dark teal
   * `007a6a` and a label stating the length and the least force it stands for,
   * so a clamped arrow is never read at its drawn length; `marks=contact` still
   * selects it.
   *
   * It throws for a scale or a maximum length that is not positive and finite
   * and for an acting step without a positive duration.
   */
  export type IProps = {
    /**
     * Borrowed receipts; only solver receipts with samples are drawn. Samples
     * must be ordered by time because lookup scans backwards. Empty input
     * returns no marks.
     */
    receipts: readonly IAutoMovieContactReceipt[];
    /**
     * Sample time in seconds on the receipts' clock. A step applies from its
     * timestamp (with 1e-9-second lookup tolerance) until, but not including,
     * timestamp plus duration.
     */
    seconds: number;
    /**
     * Arrow length per newton of mean force, metres/newton;
     * markAutoMovieContacts rejects nonfinite or nonpositive values.
     */
    metresPerNewton: number;
    /**
     * Longest drawn arrow, metres; a longer arrow is drawn at this length as
     * `contact/clamped`. Absent, every arrow keeps its scaled length.
     * markAutoMovieContacts rejects nonfinite or nonpositive values.
     */
    maximumLength?: number;
    /**
     * Borrowed ownership history of the same cache or playback, in producer
     * order; a side is dynamic at a step when its segment's latest event at or
     * before the step (with 1e-9-second tolerance) is `dynamic`. A segment
     * without history, such as the floor, is static. Absent, no mark is
     * flagged.
     */
    ownership?: readonly IAutoMoviePhysicalOwnershipEvent[];
  };
}
