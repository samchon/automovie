import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanObstacle,
  IAutoMovieMotionHumanProp,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanObstacle } from "./HumanObstacle";

/**
 * Obstacles that move: a carriage, a horse, a running man, each a footprint
 * in its own frame carried by its motion (`HumanObstacle.IObstacle.motion`).
 *
 * `footprint` and `at` place one at a film second, so a path judged by
 * `HumanObstacle.blocking` against obstacles placed at that second meets
 * them where they are then; the crowd's steering reads their motion
 * directly. `prop` makes a prop that moves by itself (a ridden horse, a
 * drawn carriage) such an obstacle.
 */
export namespace HumanObstacleMotion {
  /**
   * An obstacle's footprint in the world at a film second: as given for a
   * still one, placed by its motion for a moving one.
   *
   * @param obstacle The obstacle.
   * @param seconds Film seconds.
   * @returns The footprint's corners in order, world metres.
   */
  export function footprint(
    obstacle: IAutoMovieMotionHumanObstacle,
    seconds: number,
  ): readonly IAutoMovieVector3[] {
    if (obstacle.motion === undefined) return obstacle.footprint;
    const placed: { position: IAutoMovieVector3; yaw: number } =
      obstacle.motion(seconds);
    const h: number = (placed.yaw * Math.PI) / 180;
    const cos: number = Math.cos(h);
    const sin: number = Math.sin(h);
    return obstacle.footprint.map(
      (c: IAutoMovieVector3): IAutoMovieVector3 => ({
        x: placed.position.x + c.x * cos + c.z * sin,
        y: 0,
        z: placed.position.z - c.x * sin + c.z * cos,
      }),
    );
  }

  /**
   * An obstacle as it stands at a film second: a still obstacle with the
   * footprint its motion gives it then; a still one as it is.
   *
   * @param obstacle The obstacle.
   * @param seconds Film seconds.
   * @returns The still obstacle.
   */
  export function at(
    obstacle: IAutoMovieMotionHumanObstacle,
    seconds: number,
  ): IAutoMovieMotionHumanObstacle {
    if (obstacle.motion === undefined) return obstacle;
    return {
      subject: obstacle.subject,
      footprint: footprint(obstacle, seconds),
      bottom: obstacle.bottom,
      top: obstacle.top,
      ...(obstacle.apertures === undefined
        ? {}
        : { apertures: obstacle.apertures }),
    };
  }

  /**
   * A prop that moves by itself (`IHumanProp.motion`) as a moving obstacle:
   * its footprint is the floor-plan hull of its colliders in its own frame,
   * as `HumanObstacle.object` outlines an object, its heights theirs, and
   * its motion the prop's position with the heading its rotation gives +Z.
   *
   * @param prop The prop, with colliders and a motion.
   * @returns The obstacle.
   * @throws {Error} When the prop has no motion or no colliders, or they cover no area of the floor plan.
   */
  export function prop(
    prop: IAutoMovieMotionHumanProp,
  ): IAutoMovieMotionHumanObstacle {
    const motion: IAutoMovieMotionHumanProp["motion"] = prop.motion;
    if (motion === undefined)
      throw new Error(
        `The prop ${prop.subject} has no motion: a still prop is an obstacle by HumanObstacle.object`,
      );
    const still: IAutoMovieMotionHumanObstacle = HumanObstacle.object(
      prop.subject,
      {
        shapes: (): IAutoMoviePhysicalShape[] => [...(prop.shapes ?? [])],
      },
      { at: { x: 0, y: 0, z: 0 }, yaw: 0 },
    );
    return {
      ...still,
      motion: (
        seconds: number,
      ): { position: IAutoMovieVector3; yaw: number } => {
        const frame: IAutoMovieRigidTransform = motion.call(prop, seconds);
        const ahead: IAutoMovieVector3 = Quaternion.rotateVector(
          frame.rotation,
          { x: 0, y: 0, z: 1 },
        );
        return {
          position: frame.position,
          yaw: (Math.atan2(ahead.x, ahead.z) * 180) / Math.PI,
        };
      },
    };
  }
}
