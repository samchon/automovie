import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A solved launch velocity in world metres/second and strictly positive flight time in seconds for the caller's constant acceleration and speed. Null refusal belongs to launch solvers, not this successful result record.
 *
 * @evidence contracts/development/design.md#principled-representation The fields are exactly solveBallisticLaunch and solveMovingLaunch's successful closed-form/intercept output; compileLaunch passes them to projectileAt and the compiled launch.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Separates a successful numeric solution from the projectile origin/gravity inputs without duplicating trajectory samples.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record does not guarantee an obstacle-free route or arbitrary-precision discriminant evaluation; solver numeric admission remains authoritative.
 * @evidence contracts/development/common.md#meaningful-documentation Member comments state velocity magnitude intent, world units, seconds and positive successful flight time.
 */
export interface IAutoMovieBallisticSolution {
  /** Initial world velocity in metres/second; its magnitude is the requested launch speed within solver precision. */
  velocity: IAutoMovieVector3;

  /** Strictly positive launch-relative seconds until the solved target contact. */
  hitTime: number;
}
