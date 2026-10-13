import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A colliding body, reduced to what a collision _response_ needs: how heavy it
 * is, how fast it is going, and the material traits that decide whether a hit
 * bounces, embeds, or passes through. This is deliberately abstract: the point
 * (per the project's direction) is to compute a high-level, deterministic
 * _result_ an AI can be handed as a hint, not to run a full rigid-body sim.
 *
 * @author Samchon
 */
export interface IAutoMovieImpactBody {
  /** Mass (kg); larger = harder to move. */
  mass: number;
  /** Linear velocity (world m/s). */
  velocity: IAutoMovieVector3;
  /** Bounciness `[0,1]`: how much closing speed is returned. */
  restitution: number;
  /** Rigidity `[0,1]`: 1 a hard shell, 0 soft flesh. */
  hardness: number;
  /**
   * How easily this body is pierced `[0,1]`: 1 a soft target an arrow sinks
   * into.
   */
  penetrability: number;
}
