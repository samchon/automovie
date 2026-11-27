import type { IAutoMovieMotionTarget } from "./IAutoMovieMotionTarget";

/**
 * A struck body thrown clear of the floor by a blast or a jerk-back, then
 * landing on its back.
 *
 * The stunt rigs are the air ram, which catapults a performer away from a
 * blast, and the ratchet pull, a cabled jerk-back whose pressure sets how far
 * and how high the performer is thrown (stunt practice; Wikipedia, Air ram,
 * https://en.wikipedia.org/wiki/Air_ram). The author gives the throw as the
 * distance the body's root travels over the ground and the height its flight
 * rises above take-off. The root then flies the ballistic path those give under
 * standard gravity: it leaves the floor at `takeoff`, rises and falls to the
 * height it lies at, and lands at `land`. A named wall in the path stops the
 * flight on its face at `impact`, and the body slides down it to sit against
 * it. A jerk-back folds the hips around the pulled pelvis before the feet
 * leave; a blast extends the body away from the source. The body turns over in
 * the air onto its back and lands into the knockdown's supine lie.
 */
export namespace IAutoMovieMotionHumanThrown {
  /** The stunt rig that throws the body. */
  export type Rig = "blast" | "jerkBack";

  /** Parameters. */
  export interface IParams {
    /** The rig; `blast` when absent. */
    rig?: Rig;

    /**
     * Where the blast went off or the cable pulls from: the body is thrown away
     * from a blast and toward a pull.
     */
    target: IAutoMovieMotionTarget;

    /**
     * How far the body's root travels over the ground, metres; positive. The
     * ground speed is this over the flight time, which `height` fixes: a 0.5 m
     * height is airborne about 0.64 s.
     */
    distance: number;

    /**
     * How high the root rises above its take-off height, metres; positive. The
     * root rises and falls under standard gravity, so the flight lasts about `2
     * sqrt(2 h / g)`: 0.64 s at 0.5 m, 0.9 s at 1 m.
     */
    height: number;

    /**
     * How long the body lies after landing, seconds; 1 when absent; see
     * {@link IAutoMovieMotionHumanKnockdown.IParams.seconds}.
     */
    hold?: number;

    /**
     * A wall in the flight's path, a point on its face: the flight stops on it,
     * the impact is the action's hit, and the body slides down it to sit on the
     * floor; none when absent.
     */
    wall?: IAutoMovieMotionTarget;
  }
}
