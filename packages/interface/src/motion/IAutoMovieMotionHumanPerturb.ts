import type { AutoMovieHumanoidRegion } from "../skeleton/AutoMovieHumanoidRegion";

/**
 * One perturbation law whose response follows from the forces on its performer:
 * the body absorbs an impulse within its base, catches it with capture steps,
 * or falls, as the engine's balance outcome decides from the impulse, the
 * body's mass and its support (`resolveAutoMovieBalanceOutcome`), or as the
 * author fixes the outcome.
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
 * An author's outcome the impulse cannot produce is refused with the impulse
 * range that would produce it, never clamped; with no impulse on the performer
 * the outcome is an absorb of nothing, a still stance.
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
     * The outcome: decided by the impulse (`auto`), or fixed by the author and
     * refused when the impulse cannot produce it; `auto` when absent.
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
