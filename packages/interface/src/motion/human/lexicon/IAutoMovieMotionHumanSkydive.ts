/**
 * A parachute jump from a named edge: the exit, the belly-to-earth freefall
 * in the arch with an optional track and turn, the deployment at an
 * authored altitude, the canopy flight steered by the toggles with a flare
 * before the ground, and the landing in a parachute landing fall or on the
 * feet. Register `HumanSkydive.skydive` to use it.
 *
 * Altitudes are metres above the ground the jump lands on. A deployment
 * too low for the canopy to open and slow the body before the flare is
 * refused with the altitude named.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the phases, the altitude frame and the refusal.
 * @evidence contracts/development/design.md#principled-representation The exit edge, the freefall's track and turn, the deployment altitude, the toggle pulls by time and side and the landing.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One registered vocabulary entry; planSkydive in motions is the only consumer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The exit height comes from the edge; speeds follow from the stated terminal and canopy speeds.
 */
export namespace IAutoMovieMotionHumanSkydive {
  /**
   * How the jump lands: the five-point parachute landing fall, or on the feet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both landings.
   * @evidence contracts/development/design.md#principled-representation A closed choice.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the landing.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted values are declared here directly.
   */
  export type Landing = "plf" | "standUp";

  /**
   * One toggle pull under the canopy.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member and unit.
   * @evidence contracts/development/design.md#principled-representation When the pull starts after the canopy opens, which toggle and how long it is held.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the canopy turn reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The turn rate is the canopy's.
   */
  export interface IToggle {
    /** Seconds after the canopy has opened. */
    at: number;

    /** The toggle pulled; the canopy turns toward it. */
    side: "left" | "right";

    /** Seconds the toggle is held down. No natural value is defined: choose it for the beat (provisional, missing). */
    seconds: number;
  }

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, unit and default.
   * @evidence contracts/development/design.md#principled-representation The exit's prop and edge, the deployment altitude in metres, the freefall's track speed and turn rate, the toggles and the landing.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fields planSkydive reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The exit height and the landing ground come from the scene.
   */
  export interface IParams {
    /** Subject of the aircraft, roof or cliff left. */
    from: string;

    /** Id of its edge, a `ledge` affordance stood at. */
    edge: string;

    /** The altitude the canopy is deployed at, metres above the landing ground. */
    deploy: number;

    /** A forward glide in freefall, metres per second over the ground; none when absent. No natural value is defined: choose it for the beat (provisional, missing). */
    track?: number;

    /** A freefall turn, degrees per second, positive to the left; none when absent. No natural value is defined: choose it for the beat (provisional, missing). */
    turn?: number;

    /** Toggle pulls under the canopy, in time order without overlap; none when absent. */
    toggles?: IToggle[];

    /** The landing; `plf` when absent. */
    landing?: Landing;
  }
}
