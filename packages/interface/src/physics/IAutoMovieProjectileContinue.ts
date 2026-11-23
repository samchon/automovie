import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieProjectile } from "./IAutoMovieProjectile";

/**
 * Authored contact responses and analytical flight, roll or rest continuations on the launch clock.
 */
export namespace IAutoMovieProjectileContinue {
  /**
   * Caller-selected response to a resolved projectile contact.
   *
   * kind separates stick depth in metres, bounce restitution/friction, roll resistance and pass speed loss; coefficients are dimensionless except depth and optional roll radius. projectileContinue applies the chosen analytical response using the contact's world normal; it does not select an outcome from material names or modify the original flight. The producer checks finite nonnegative depth/friction/resistance and restitution/loss in [0,1] on their branch. A supplied bounce-to-roll radius and resistance are both admitted before deciding whether rolling is selected.
   */
  export type Outcome =
    | {
        /** It stops in the struck body. */
        kind: "stick";

        /** How far its point goes on into the body, metres. */
        depth: number;
      }
    | {
        /** It rebounds. */
        kind: "bounce";

        /** Newton's coefficient of restitution of the normal speed, 0 to 1. */
        restitution: number;

        /** Coulomb's friction coefficient of the contact. */
        friction: number;

        /** Roll instead once a rebound rises less than `radius`, at the rolling resistance `resistance`. */
        roll?: {
          /** Finite nonnegative radius in metres used as the strict rebound-height threshold; admitted whenever roll is supplied, even when no roll is selected. */
          radius: number;

          /** Dimensionless finite nonnegative rolling resistance; admitted whenever this bounce supplies roll, before selecting its continuation. */
          resistance: number;
        };
      }
    | {
        /** It rolls on the surface. */
        kind: "roll";

        /** The rolling-resistance coefficient, dimensionless. */
        resistance: number;
      }
    | {
        /** It passes through. */
        kind: "pass";

        /** The share of its speed it loses, 0 to 1. */
        loss: number;
      };

  /**
   * Flight, rolling or resting continuation on the original flight's launch clock.
   *
   * from and until are seconds since that launch; position/origin are world metres, velocity m/s and rolling deceleration m/s². projectileContinue returns a new segment but may retain source gravity, attitude or pose objects. Its at reader can return borrowed rest positions or held rotations, so consumers treat nested values as read-only. A rolling segment omits along-slope gravitational acceleration; until is Infinity only for nonzero speed with zero deceleration. Optional rotation is absent when the source has no attitude.
   */
  export type Segment =
    | {
        /** A new flight, whose own time zero is `from`. */
        kind: "flight";

        /** Start on the original flight's launch clock, seconds; sample at or after this instant. */
        from: number;

        /** Continuation flight with its own time zero at from; retained nested gravity and attitude data must not be mutated. */
        projectile: IAutoMovieProjectile;
      }
    | {
        /** A roll from `origin` until `until`, then at rest. */
        kind: "roll";

        /** Start on the original flight's launch clock, seconds; sample at or after this instant. */
        from: number;

        /** World flight-point position at the start of rolling, metres. */
        origin: IAutoMovieVector3;

        /** Velocity at the roll's start, m/s, along the surface. */
        velocity: IAutoMovieVector3;

        /** Deceleration, m/s². */
        deceleration: number;

        /** Seconds since the launch it comes to rest; Infinity on a frictionless roll. */
        until: number;

        /** Held world attitude from contact; absent if the source flight has no attitude. The continuation does not integrate rolling rotation. */
        rotation?: IAutoMovieQuaternion;
      }
    | {
        /** At rest. */
        kind: "rest";

        /** Start on the original flight's launch clock, seconds; sample at or after this instant. */
        from: number;

        /** World rest point in metres, including authored embedding depth for a stick; not attached to a moving struck body. */
        position: IAutoMovieVector3;

        /** Held world attitude from contact; absent if the source flight has no attitude. The continuation does not integrate rolling rotation. */
        rotation?: IAutoMovieQuaternion;
      };
}
