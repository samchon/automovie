import {
  AutoMovieGravity,
  type IAutoMovieProjectile,
  projectileAt,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";

/**
 * A thrown object's launch and the drag-free path it flies afterwards. Written
 * by the throw's plan (`throwObject`) and read by a catcher and the capture.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the namespace holds, its writer and its readers.
 * @evidence contracts/development/design.md#principled-representation The initial state of a ballistic path and the path as its closed form.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record, its path, and the held prop's grip window and published launch; gravity is the engine's (`AutoMovieGravity`).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Plain vectors and seconds; no object or hand is named.
 * @evidence contracts/development/implementation.md#principled-implementation Constant gravity along -Y without drag, the model the throw solves its release velocity in, read from the engine's one flight (`projectileAt`).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation to the engine's flight.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The path is the launch's own, with no fitted correction.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The flight's closed form is the engine's `projectileAt`, not a second copy (#3470).
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

  /**
   * The grip window that carries a thrown prop in the throwing hand from the
   * throw's start to its release; none for an empty-handed throw.
   *
   * @param prop The thrown prop, or undefined.
   * @param side The throwing hand.
   * @param release The release's share of the throw.
   * @returns The window, or none.
   */
  export function held(
    prop: string | undefined,
    side: "left" | "right",
    release: number,
  ): IHumanContactWindow[] {
    return prop === undefined
      ? []
      : [
          {
            part: `${side}Hand`,
            kind: "grip",
            from: 0,
            to: release,
            support: { kind: "prop", subject: prop },
          },
        ];
  }

  /**
   * The launch a throw publishes for its prop (`IHumanActionPlan.launches`),
   * the same release point and velocity the catcher reads; none for an
   * empty-handed throw.
   *
   * @param prop The thrown prop, or undefined.
   * @param attitude How it turns in flight; its release rotation kept when absent.
   * @param launch The throw's launch.
   * @returns The published launches.
   */
  export function launches(
    prop: string | undefined,
    attitude: IAutoMovieProjectile.Attitude | undefined,
    launch: ILaunch,
  ): IHumanActionPlan.ILaunch[] {
    return prop === undefined
      ? []
      : [
          {
            prop,
            seconds: launch.seconds,
            point: launch.point,
            velocity: launch.velocity,
            ...(attitude === undefined ? {} : { attitude }),
          },
        ];
  }

  /**
   * A point of a launch's drag-free path.
   *
   * @param launch The launch.
   * @param seconds Seconds after the release.
   * @returns World metres.
   */
  export function path(launch: ILaunch, seconds: number): IAutoMovieVector3 {
    return projectileAt(
      {
        origin: launch.point,
        velocity: launch.velocity,
        gravity: AutoMovieGravity.DOWN,
      },
      seconds,
    ).position;
  }
}
