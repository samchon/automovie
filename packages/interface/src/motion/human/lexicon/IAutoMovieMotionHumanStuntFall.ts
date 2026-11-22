/**
 * Staged stunt falls: tumbling down a staircase over its treads, or the
 * controlled seat slide, and a high fall from a ledge onto a pad or the
 * ground. Register `HumanStuntFall.stuntFall` to use it.
 *
 * A tumble reads the named stair prop's steps and slides down them on the
 * back and sides with Coulomb friction, each contact on a tread's nosing,
 * ending lying on the floor below; a flight too short for a tumble is
 * refused, and the seat slide needs only one step. A high fall leaves the
 * ledge, flies ballistically turning to lie flat on its back, and lands on
 * the named pad's top, which yields, or on the ground in a collapse; a pad
 * the flight does not reach is refused. A descender slows the descent to
 * its final speed instead.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both falls, what each reads and the refusals.
 * @evidence contracts/development/design.md#principled-representation A discriminated union on kind; each names the props and the few controls its fall takes, in metres per second.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One registered vocabulary entry; planStuntFall in motions is the only consumer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Heights, treads and pads come from the props.
 */
export namespace IAutoMovieMotionHumanStuntFall {
  /**
   * How a high fall leaves the ledge: a step off forward, a tip backward or
   * a throw outward.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three take-offs.
   * @evidence contracts/development/design.md#principled-representation A closed choice of take-off velocity.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the high fall.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted values are declared here directly.
   */
  export type Exit = "step" | "tip" | "thrown";

  /**
   * Tumble down a staircase, or slide down it on the seat.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member and default.
   * @evidence contracts/development/design.md#principled-representation The stair prop and whether the fall is the controlled seat slide.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fields the tumble reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The treads come from the prop's steps.
   */
  export interface IStairs {
    /** Discriminant: a stair fall. */
    kind: "stairs";

    /** Subject of the fixed stair prop. */
    stairs: string;

    /** A controlled slide on the seat instead of a tumble; a tumble when absent. */
    slide?: boolean;
  }

  /**
   * Fall from a ledge onto a pad or the ground.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, unit and default.
   * @evidence contracts/development/design.md#principled-representation The take-off, the optional pad, and the optional descender's final speed in metres per second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fields the high fall reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The drop and the pad's top come from the scene.
   */
  export interface IHigh {
    /** Discriminant: a high fall. */
    kind: "high";

    /** How the body leaves the ledge; `step` when absent. */
    exit?: Exit;

    /** Subject of the pad or airbag landed on; the ground when absent. */
    pad?: string;

    /** Id of the pad's top surface affordance; `surface` when absent. */
    top?: string;

    /** A descender's final speed, metres per second; a free fall when absent. */
    descender?: number;
  }

  /**
   * Parameters: a stair fall or a high fall.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; planStuntFall owns the geometry refusals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the variants and the admission owners.
   * @evidence contracts/development/design.md#principled-representation A closed discriminated union on kind.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The variants planStuntFall dispatches on.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Alternatives are separated by kind rather than optional fields.
   */
  export type IParams = IStairs | IHigh;
}
