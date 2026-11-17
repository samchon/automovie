/**
 * The throw's lever: the arm from the shoulder to the hand, lengthened by an
 * implement the hand holds (a sling, an atlatl), turning as one rigid lever
 * at the release (#3490).
 *
 * At the release the arm and the implement move as one rigid body: a
 * velocity shared by every point along the lever from the shoulder to the
 * working point, plus a turn about the shoulder, `v(p) = u + w x (p - s)`.
 * The implement keeps the grip the hand holds it by, so its working point
 * lies where the release's hand rotation puts it (no wrist turn beyond its
 * range is asked), and the launch is aimed from there. The turn is the
 * least one that carries the launch velocity's part square to the line
 * from the shoulder to the working point, `w = (r x v) / |r|^2`, and the
 * shared velocity its part along that line, so the working point leaves
 * with the launch velocity while the hand, nearer the shoulder, moves only
 * as fast as the lever there: the implement's gain. Through the carry the
 * hand turns at `w`. With no implement the working point is the grip, and
 * the hand carries the launch velocity unturned, the throw as it was.
 *
 * A thrown prop keeps the lever's angular velocity in flight, so a knife's
 * spin (`ITurns`) is the lever's rate, rounded by the act to the nearest
 * whole number of half turns over the flight to the target, at least one,
 * so the stand-off decides how the point arrives ({@link spin}).
 *
 * @evidence contracts/development/common.md#meaningful-documentation kind: Turns chosen by the act. prop: The implement's subject id, held in the throwing hand at the throw's entry. point: The affordance the thrown prop rides: an atlatl's spur, a sling's pouch.
 * @evidence contracts/development/design.md#principled-representation kind: Turns chosen by the act. prop: The implement's subject id, held in the throwing hand at the throw's entry. point: The affordance the thrown prop rides: an atlatl's spur, a sling's pouch.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: throwing/throwObjectLever.ts (throwObjectLever.of, props); throwing/throwObject.ts (throwObject.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in throwObjectLever.of.
 */
export namespace IAutoMovieMotionHumanThrowObjectLever {
  /**
   * A spin the act chooses: the lever's rate rounded to whole half turns
   * over the flight to the target ({@link spin}).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the act derives.
   * @evidence contracts/development/design.md#principled-representation One tag beside the engine's attitudes, resolved to a `spin` before the launch is published.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The tag alone.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The author types no rate or axis.
   */
  export interface ITurns {
    /** Turns chosen by the act. */
    kind: "turns";
  }

  /**
   * An implement held in the throwing hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning.
   * @evidence contracts/development/design.md#principled-representation A held prop and the affordance of its working point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members read by `of`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No implement kind is named; the point is the archetype's affordance id.
   */
  export interface IImplement {
    /** The implement's subject id, held in the throwing hand at the throw's entry. */
    prop: string;

    /** The affordance the thrown prop rides: an atlatl's spur, a sling's pouch. */
    point: string;
  }
}
