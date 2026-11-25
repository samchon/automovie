import type { IAutoMoviePoseResolution } from "../../../pose/IAutoMoviePoseResolution";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";

/**
 * The course of the hips along a heading that keeps a body's extrapolated
 * centre of mass on a target while its feet move.
 *
 * A step moves the base of support, and the body stays balanced through it when
 * its extrapolated centre of mass, the centre plus its velocity over the
 * inverted pendulum's eigenfrequency `w = sqrt(g / l)` (Hof, Gazendam and Sinke
 * 2005, J Biomech 38:1; `l` 1.34 hip heights), stays inside the base. Asking
 * that point to be on a target `T(t)` is the first-order equation `c' = w (T -
 * c)` for the centre `c`: the centre follows the target the way a low-pass
 * filter follows its input, with the time constant `1 / w`, about a third of a
 * second. The centre therefore trails a foot that steps away and arrives after
 * it lands, which is what a stepping body does.
 *
 * `solve` integrates that equation on a time grid, exactly for a target held
 * over each step, and at every knot finds the hips' place at which the solved
 * posture's whole-body centre of mass (the engine's segmental model through
 * {@link HumanBalance.support}) stands on the filtered centre. The law reads the
 * course back by a cubic through the knots.
 */
export namespace IAutoMovieMotionHumanCourse {
  /** What a course is solved from. */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The heading the course runs along, degrees about +Y. */
    yaw: number;

    /**
     * The posture at a second with the hips a distance along the heading,
     * metres.
     */
    posture: (
      seconds: number,
      along: number,
      resolution?: IAutoMoviePoseResolution.ISource,
    ) => IAutoMovieMotionHumanPosture;

    /**
     * Where the extrapolated centre of mass is asked at a second, world metres
     * along the heading.
     */
    target: (seconds: number) => number;

    /** The span's first second. */
    from: number;

    /** The span's last second. */
    to: number;

    /** The hips' place at the span's first second, metres along the heading. */
    start: number;
  }
}
