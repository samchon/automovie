import type { IAutoMovieProjectileState } from "./IAutoMovieProjectileState";

/** The actual fixed Hermite interval containing a projectile query. */
export interface IAutoMovieProjectileDragInterval {
  /** First actual knot second. */
  from: number;
  /** Next actual knot second. */
  to: number;
  /** Position and velocity at the first knot. */
  start: IAutoMovieProjectileState;
  /** Position and velocity at the next knot. */
  end: IAutoMovieProjectileState;
}
