import type { IAutoMovieClip } from "../core/IAutoMovieClip";
import type { IAutoMovieMotion } from "../motion/IAutoMovieMotion";

/**
 * Data and callback contracts shared by the CameraClearanceSampleTimes
 * operations.
 */
export namespace IAutoMovieCameraClearanceSampleTimes {
  /**
   * Build the clearance sample clock of one shot: a function from a take's
   * camera motion to the strictly increasing shot-local seconds at which that
   * take must be inspected.
   *
   * The clock is the endpoint-inclusive fixed clock of `sampleRate` over
   * `duration`, refined by every key time of every actor motion, object clip
   * and the take's camera clip that falls strictly inside the shot, repeated
   * per cycle for a looping sequence. Each interval stays within one key
   * segment. Under admitted motion inputs, linear, step and named
   * non-overshooting easing keep translation and scale within their endpoint
   * ranges; quaternion rotation follows an arc instead of that chord and needs
   * the evaluator's separate rotation bound. This clock refuses `cubicBezier`
   * actor easing, `cubicspline` clip tracks and an open loop seam on a channel
   * the bound reads. It does not certify the evaluator's normalized-lerp or
   * changing-scale limits.
   *
   * The actor/object part is computed once and each take adds its camera
   * boundaries. Unboundable motion/clip interpolation or seams throw Error at
   * the corresponding call; a loop cycle count must also be a non-negative safe
   * integer so incrementing its enumeration index can progress. This
   * representability gate is not a workload budget, and representable
   * populations can still exhaust host resources.
   */
  export type IProps = {
    /** Shot length in seconds. */
    duration: number;

    /** Fixed-clock samples per second, finite and positive. */
    sampleRate: number;

    /** Actor motion per node; its root translation and scale move obstacles. */
    motions: Readonly<Record<string, IAutoMovieMotion>>;

    /** Object clips whose node channels move obstacles. */
    objectMotions: readonly IAutoMovieClip[];
  };
}
