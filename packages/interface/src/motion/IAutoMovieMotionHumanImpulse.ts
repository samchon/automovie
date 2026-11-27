import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanForceSite } from "./AutoMovieHumanForceSite";

/**
 * An impulse delivered to a performer at a film instant, in world newton
 * seconds. Hit conversion and reaction laws exchange this record without
 * changing its force application site.
 */
export interface IAutoMovieMotionHumanImpulse {
  /** The discriminator. */
  kind: "impulse";

  /** The person it acts on. */
  subject: string;

  /** Where it acts. */
  at: AutoMovieHumanForceSite;

  /** Film seconds. */
  seconds: number;

  /** World newton seconds, on the body. */
  impulse: IAutoMovieVector3;
}
