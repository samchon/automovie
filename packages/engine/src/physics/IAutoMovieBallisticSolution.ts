import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A solved launch velocity in world metres/second and strictly positive flight time in seconds for the caller's constant acceleration and speed. Null refusal belongs to launch solvers, not this successful result record.
 *
 * @evidence contracts/common.md#principled-implementation The fields are exactly solveBallisticLaunch and solveMovingLaunch's successful closed-form/intercept output; compileLaunch passes them to projectileAt and the compiled launch.
 * @evidence contracts/common.md#clear-and-simple-design Separates a successful numeric solution from the projectile origin/gravity inputs without duplicating trajectory samples.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record does not guarantee an obstacle-free route or arbitrary-precision discriminant evaluation; solver numeric admission remains authoritative.
 * @evidence contracts/common.md#meaningful-documentation Member comments state velocity magnitude intent, world units, seconds and positive successful flight time.
 * @evidence contracts/performance.md#efficient-algorithms The type has constant-size storage and no algorithm; launch solution and moving-target iteration cost belong to their producers.
 * @evidence contracts/performance.md#reuse-equivalent-work compileLaunch reuses the velocity/time for trajectory and landing evaluation rather than solving again; the type introduces no trajectory cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the result vector/record, with no persistent solver workspace or running simulation task.
 * @author Samchon
 */
export interface IAutoMovieBallisticSolution {
  /** Initial world velocity in metres/second; its magnitude is the requested launch speed within solver precision. */
  velocity: IAutoMovieVector3;

  /** Strictly positive launch-relative seconds until the solved target contact. */
  hitTime: number;
}
