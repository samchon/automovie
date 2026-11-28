import type { AutoMovieHumanoidRegion } from "../skeleton/AutoMovieHumanoidRegion";

/**
 * Plan a balance response from the performer's entered pose and support.
 *
 * The impulse is the sum of the impulses on the performer
 * (`IAutoMovieMotionHumanActionContext.forces`) from one pendulum time constant
 * `1 / ω0` before the action's start, the span within which the body has not
 * yet moved by more than its own response, to the start. Its outcome:
 *
 * - **absorb**: the hips travel along the push and come back over the feet as a
 *   critically damped pendulum at the body's own frequency, `x(t) = v t exp(-ω0
 *   t)` with `v` the centre's speed after the impulse, its peak `v / (e ω0)` at
 *   `t = 1 / ω0`; the feet stay planted.
 * - **step**: `stagger`'s capture step at the centre's speed after the impulse,
 *   from the side the impulse comes from (Hof, Gazendam and Sinke 2005; the
 *   step's landing from Maki and McIlroy 1997, as `stagger` cites).
 * - **fall**: `knockdown` from the side the impulse comes from.
 *
 * A performer bearing on a prop starts with velocity relative to the declared
 * bearing frame. The frame's onset acceleration contributes an inertial load
 * over one pendulum time constant. Uniform translation of an unforced quiet
 * stance preserves that stance. An absorb or recovery step follows the declared
 * support.
 *
 * The default automatic outcome uses the available balance. An authored outcome
 * outside the feasible range is refused with that range.
 *
 * First pass: the step outcome lays one capture step, `stagger`'s; the engine's
 * outcome may ask for more, which this law refuses naming the fall instead
 * until the multi-step plan lands (A folds `stagger` into this law's step). The
 * absorb shows no trunk motion beyond the hips' travel; the ankle and hip
 * strategies (Horak and Nashner 1986) are not yet split.
 */
export namespace IAutoMovieMotionHumanPerturb {
  /** Parameters. */
  export interface IParams {
    /**
     * Response outcome, `auto` when absent. The law uses the load and
     * support-relative entry state and refuses an infeasible authored outcome.
     */
    outcome?:
      | "auto"
      | "absorb"
      | "step"
      | "fall"
      | "resist"
      | "yield"
      | "thrown";

    /** The thrower's subject, for a `thrown` outcome. */
    partner?: string;

    /** The thrower's region the body turns over, for a `thrown` outcome. */
    fulcrum?: AutoMovieHumanoidRegion;

    /**
     * The thrown body's region on the fulcrum, for a `thrown` outcome; the
     * abdomen when absent.
     */
    on?: AutoMovieHumanoidRegion;
  }
}
