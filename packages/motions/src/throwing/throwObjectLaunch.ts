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
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record, its path, the aimed velocity, and the held prop's grip window and published launch; gravity is the engine's (`AutoMovieGravity`).
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
   * The launch velocity whose drag-free path from a release passes through a
   * target, rising at a given angle: the range equation solved for the speed,
   * `v^2 = g d^2 / (2 cos^2(a) (d tan(a) - h))` over the horizontal distance
   * `d` and the target's height `h` above the release.
   *
   * @param release The release point, world metres.
   * @param target The target point, world metres.
   * @param degrees The release's rise above the horizontal, degrees.
   * @returns The velocity, world metres per second, or undefined when no path at that angle reaches the target (it lies straight above, or above the line the angle rises along).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the equation, its terms and when it has no solution.
   * @evidence contracts/development/implementation.md#principled-implementation The range equation under the engine's standard gravity, the model the flight then follows (`projectileAt`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The distance, the lift, the speed and its components.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unreachable target returns undefined for the caller's refusal, never a clamped speed.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The one aimed launch the throw and the throw-in solve (`throwObject`, `ballSport`).
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function aimed(
    release: IAutoMovieVector3,
    target: IAutoMovieVector3,
    degrees: number,
  ): IAutoMovieVector3 | undefined {
    const dx: number = target.x - release.x;
    const dz: number = target.z - release.z;
    const d: number = Math.hypot(dx, dz);
    const angle: number = (degrees * Math.PI) / 180;
    const lift: number = d * Math.tan(angle) - (target.y - release.y);
    if (!(d > 1e-6 && lift > 0)) return undefined;
    const speed: number = Math.sqrt(
      (AutoMovieGravity.STANDARD * d * d) / (2 * Math.cos(angle) ** 2 * lift),
    );
    return {
      x: (dx / d) * speed * Math.cos(angle),
      y: speed * Math.sin(angle),
      z: (dz / d) * speed * Math.cos(angle),
    };
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
