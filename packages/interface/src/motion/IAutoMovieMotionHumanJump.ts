import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanJumpAirborne } from "./IAutoMovieMotionHumanJumpAirborne";
import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";

/**
 * Authoring parameters for jump operations.
 */
export namespace IAutoMovieMotionHumanJump {
  /** Parameters. */
  export interface IParams {
    /**
     * The point to land on, world metres: its height is the landing surface's,
     * the floor's 0, a box's top or a step's.
     */
    to: IAutoMovieVector3;

    /**
     * The prop whose top is landed on, its subject id, so the feet bear on it;
     * the floor when absent.
     */
    on?: string;

    /**
     * Apex height of the flight above take-off, metres; positive; 0.06 hip
     * heights plus a tenth of the jump's length when absent (`jump`,
     * provisional). Gravity decides the flight time: the take-off speed is
     * `sqrt(2 g apex)` and a level landing follows `sqrt(8 apex / g)` later, g
     * 9.80665 m/s2: 0.36 s for a 1 m jump at the reference hip (apex 0.15 m).
     * The push-off (0.3 s, `jump.PUSH`), the absorption (0.3 s, `jump.ABSORB`)
     * and the rise to standing (0.45 s, `jump.RISE`) are provisional and scaled
     * by `manner.pace`; the flight is not.
     */
    apex?: number;

    /**
     * Turns the body makes in flight: somersaults about the axis across the
     * heading (`forward` or `backward`) or about the axis along it (`left` or
     * `right`, a side salto), and twists about the body's long axis, signed by
     * the right-hand rule about up. The performance's staged default follows
     * the authored turn clock and requires a complete net rotation for this
     * feet-first landing. Explicit physical mode solves angular momentum on the
     * composed body, so a tuck can change its rate. Staged turns make no
     * momentum-conservation claim. No turn when absent.
     */
    rotation?: IAutoMovieMotionHumanJumpAirborne.IRotation;

    /**
     * How it is performed: the manner's tempo scales the push-off, the
     * absorption and the rise, never the flight, which gravity fixes; neutral
     * when absent.
     */
    manner?: IAutoMovieMotionManner;
  }
}
