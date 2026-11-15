import { Quaternion } from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanObstacle } from "./HumanObstacle";
import type { IHumanProp } from "./IHumanProp";

/**
 * Obstacles that move: a carriage, a horse, a running man, each a footprint
 * in its own frame carried by its motion (`HumanObstacle.IObstacle.motion`).
 *
 * `footprint` and `at` place one at a film second, so a path judged by
 * `HumanObstacle.blocking` against obstacles placed at that second meets
 * them where they are then; the crowd's steering reads their motion
 * directly. `prop` makes a prop that moves by itself (a ridden horse, a
 * drawn carriage) such an obstacle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a moving obstacle is, how it is placed and who reads it.
 * @evidence contracts/development/design.md#principled-representation A rigid placement on the floor plan of a footprint in the obstacle's own frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three functions: the placed footprint, the placed obstacle, a moving prop as an obstacle.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A still obstacle is returned as it is, so nothing about one changes.
 */
export namespace HumanObstacleMotion {
  /**
   * An obstacle's footprint in the world at a film second: as given for a
   * still one, placed by its motion for a moving one.
   *
   * @param obstacle The obstacle.
   * @param seconds Film seconds.
   * @returns The footprint's corners in order, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both cases.
   * @evidence contracts/development/implementation.md#principled-implementation A rigid placement on the floor plan: the own frame's x is the left of a body facing its heading, `(cos h, -sin h)`, and its z ahead, `(sin h, cos h)`, heading 0 facing +Z.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch and one map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A still obstacle returns its own footprint.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the corners.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function footprint(
    obstacle: HumanObstacle.IObstacle,
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both cases.
   * @evidence contracts/development/implementation.md#principled-implementation The placed footprint, every other field kept.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One spread.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the corners.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function at(
    obstacle: HumanObstacle.IObstacle,
    seconds: number,
  ): HumanObstacle.IObstacle {
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each part is read from and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The shadow of convex colliders is the hull of their corners, outlined by `HumanObstacle.object` at the prop's own origin; the heading is the rotated +Z's direction on the floor plan.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reuses `object` on the prop at its own origin, then adds the motion.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No box is assumed: a prop without colliders is refused.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms As `object`, once per prop.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The footprint is computed once; the motion is the prop's own.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds the prop's motion for as long as the obstacle is held.
   */
  export function prop(prop: IHumanProp): HumanObstacle.IObstacle {
    const motion: IHumanProp["motion"] = prop.motion;
    if (motion === undefined)
      throw new Error(
        `The prop ${prop.subject} has no motion: a still prop is an obstacle by HumanObstacle.object`,
      );
    const still: HumanObstacle.IObstacle = HumanObstacle.object(
      prop.subject,
      {
        shapes: (): IAutoMoviePhysicalProfile.IShape[] => [
          ...(prop.shapes ?? []),
        ],
      },
      { at: { x: 0, y: 0, z: 0 }, yaw: 0 },
    );
    return {
      ...still,
      motion: (
        seconds: number,
      ): { position: IAutoMovieVector3; yaw: number } => {
        const frame: IHumanProp.IFrame = motion.call(prop, seconds);
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
