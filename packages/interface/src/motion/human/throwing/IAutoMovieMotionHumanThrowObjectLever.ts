/**
 * The throw's lever: the arm from the shoulder to the hand, lengthened by an
 * implement the hand holds (a sling, an atlatl), turning as one rigid lever at
 * the release.
 *
 * At the release the arm and the implement move as one rigid body: a velocity
 * shared by every point along the lever from the shoulder to the working point,
 * plus a turn about the shoulder, `v(p) = u + w x (p - s)`. The implement keeps
 * the grip the hand holds it by, so its working point lies where the release's
 * hand rotation puts it (no wrist turn beyond its range is asked), and the
 * launch is aimed from there. The turn is the least one that carries the launch
 * velocity's part square to the line from the shoulder to the working point, `w
 * = (r x v) / |r|^2`, and the shared velocity its part along that line, so the
 * working point leaves with the launch velocity while the hand, nearer the
 * shoulder, moves only as fast as the lever there: the implement's gain.
 * Through the carry the hand turns at `w`. With no implement the working point
 * is the grip, and the hand carries the launch velocity unturned, the throw as
 * it was.
 *
 * A thrown prop keeps the lever's angular velocity in flight, so a knife's spin
 * (`ITurns`) is the lever's rate, rounded by the act to the nearest whole
 * number of half turns over the flight to the target, at least one, so the
 * stand-off decides how the point arrives ({@link spin}).
 */
export namespace IAutoMovieMotionHumanThrowObjectLever {
  /**
   * A spin the act chooses: the lever's rate rounded to whole half turns over
   * the flight to the target ({@link spin}).
   */
  export interface ITurns {
    /** Turns chosen by the act. */
    kind: "turns";
  }

  /** An implement held in the throwing hand. */
  export interface IImplement {
    /**
     * The implement's subject id, held in the throwing hand at the throw's
     * entry.
     */
    prop: string;

    /** The affordance the thrown prop rides: an atlatl's spur, a sling's pouch. */
    point: string;
  }
}
