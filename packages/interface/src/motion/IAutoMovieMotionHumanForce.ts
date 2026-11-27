import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanImpulse } from "./IAutoMovieMotionHumanImpulse";
import type { IAutoMovieMotionHumanSustainedForce } from "./IAutoMovieMotionHumanSustainedForce";

/**
 * A force input acting on a performer: an instantaneous impulse or a sustained
 * force over film time. The discriminated records preserve their different
 * physical units and clocks.
 */
export type IAutoMovieMotionHumanForce =
  | IAutoMovieMotionHumanImpulse
  | IAutoMovieMotionHumanSustainedForce;

/** Operation-local contracts supporting IAutoMovieMotionHumanForce. */
export namespace IAutoMovieMotionHumanForce {
  /** The receiver of a hit: its mass and its velocity at the struck point. */
  export interface IReceiver {
    /** Kilograms. */
    mass: number;

    /** World metres per second at the struck point. */
    velocity: IAutoMovieVector3;
  }
}
