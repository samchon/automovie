/**
 * A parachute jump from a named edge: the exit, the belly-to-earth freefall in
 * the arch with an optional track and turn, the deployment at an authored
 * altitude, the canopy flight steered by the toggles with a flare before the
 * ground, and the landing in a parachute landing fall or on the feet. Register
 * `HumanSkydive.skydive` to use it.
 *
 * Altitudes are metres above the ground the jump lands on. A deployment too low
 * for the canopy to open and slow the body before the flare is refused with the
 * altitude named.
 */
export namespace IAutoMovieMotionHumanSkydive {
  /** How the jump lands: the five-point parachute landing fall, or on the feet. */
  export type Landing = "plf" | "standUp";

  /** One toggle pull under the canopy. */
  export interface IToggle {
    /** Seconds after the canopy has opened. */
    at: number;

    /** The toggle pulled; the canopy turns toward it. */
    side: "left" | "right";

    /**
     * Seconds the toggle is held down. No natural value is defined: choose it
     * for the beat (provisional, missing).
     */
    hold: number;
  }

  /** Parameters. */
  export interface IParams {
    /** Subject of the aircraft, roof or cliff left. */
    from: string;

    /** Id of its edge, a `ledge` affordance stood at. */
    edge: string;

    /** The altitude the canopy is deployed at, metres above the landing ground. */
    deploy: number;

    /**
     * A forward glide in freefall, metres per second over the ground; none when
     * absent. No natural value is defined: choose it for the beat (provisional,
     * missing).
     */
    track?: number;

    /**
     * A freefall turn, degrees per second, positive to the left; none when
     * absent. No natural value is defined: choose it for the beat (provisional,
     * missing).
     */
    turn?: number;

    /**
     * Toggle pulls under the canopy, in time order without overlap; none when
     * absent.
     */
    toggles?: IToggle[];

    /** The landing; `plf` when absent. */
    landing?: Landing;
  }
}
