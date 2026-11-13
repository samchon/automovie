import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A thrown object's launch and the drag-free path it flies afterwards. Written
 * by the throw's plan (`throwObject`) and read by a catcher and the capture.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the namespace holds, its writer and its readers.
 * @evidence contracts/development/design.md#principled-representation The initial state of a ballistic path and the path as its closed form.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record, one constant and one function.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Plain vectors and seconds; no object or hand is named.
 * @evidence contracts/development/implementation.md#principled-implementation Constant gravity along -Y without drag, the model the throw solves its release velocity in.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One closed-form expression.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The path is the launch's own, with no fitted correction.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace throwObjectLaunch {
  /**
   * A launch: where and when the object leaves the hand and at what velocity.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation The initial state of a drag-free ballistic path.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members read by a catcher and the capture.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Plain vectors and seconds.
   */
  export interface ILaunch {
    /** The release point, world metres. */
    point: IAutoMovieVector3;

    /** The launch velocity, world metres per second. */
    velocity: IAutoMovieVector3;

    /** Seconds since the action's start of the release. */
    seconds: number;

    /** The target point the path passes through, world metres. */
    target: IAutoMovieVector3;
  }

  /** Gravity, metres per second squared along -Y. */
  export const GRAVITY: number = 9.81;

  /**
   * A point of a launch's drag-free path.
   *
   * @param launch The launch.
   * @param seconds Seconds after the release.
   * @returns World metres.
   */
  export function path(launch: ILaunch, seconds: number): IAutoMovieVector3 {
    return {
      x: launch.point.x + launch.velocity.x * seconds,
      y:
        launch.point.y +
        launch.velocity.y * seconds -
        0.5 * GRAVITY * seconds * seconds,
      z: launch.point.z + launch.velocity.z * seconds,
    };
  }
}
