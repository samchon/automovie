import type { createPell, createSword } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanObject, HumanSword, type IHumanBody } from "@automovie/motions";

/**
 * Where a pell stands for a sword's lunge at it to need a given share of a
 * full lunge, measured from the sword itself.
 *
 * The arm reaches a target `HumanSword.REACH` of its length from the
 * shoulder, and the sword adds its own length from the grip to the point,
 * read from its `grip` and `point` affordances. A full lunge carries the
 * leading foot 0.45 of the stature, the middle of the 0.35 to 0.55 band the
 * blade stroke specs hold it to, and the pelvis 0.55 of that (the striking
 * advance's provisional carry). So a pell whose target lies that reach from
 * the shoulder at rest, carried the asked share of a full lunge's pelvis
 * travel along the line, needs about that share of a full lunge; the stance
 * a performer takes the sword in already stands the shoulder a little ahead,
 * so a share of 1 needs a little less. A lunge travels only as far as its target requires, so a share of 1
 * gives a lunge near its full length and a smaller share a shorter one.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the reach is read from, the lunge's length with its source and what a share means.
 * @evidence contracts/development/implementation.md#principled-implementation The distance is bisected on the pell's own target, placed as the performance places it, against the sword's reach.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One reach, one carry, one bisection.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The sword's length is the archetype's, never a share of the stature.
 * @evidence contracts/development/implementation.md#efficient-algorithms 40 bisections of closed-form geometry.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the blade specs that lunge.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace motionBladeReach {
  /**
   * The pell's place.
   *
   * @param body The lunging body, standing at the origin facing +Z.
   * @param sword The sword in its right hand.
   * @param pell The pell.
   * @param bearing Degrees to the performer's left of straight ahead.
   * @param share The share of a full lunge the target needs, in (0, 1].
   * @returns The pell's place, its target facing the performer.
   */
  export function lunge(
    body: IHumanBody,
    sword: ReturnType<typeof createSword>,
    pell: ReturnType<typeof createPell>,
    bearing: number,
    share: number,
  ): { at: IAutoMovieVector3; yaw: number } {
    const stature: number = body.measure.stature;
    const reach: number =
      HumanSword.REACH * (body.measure.upperArm + body.measure.forearm) +
      Vector3.length(
        Vector3.subtract(
          sword.affordance("point").frame.translation,
          sword.affordance("grip").frame.translation,
        ),
      );
    const shoulder: IAutoMovieVector3 = body.rest.get("rightUpperArm")!;
    const radians: number = (bearing * Math.PI) / 180;
    const line: IAutoMovieVector3 = {
      x: Math.sin(radians),
      y: 0,
      z: Math.cos(radians),
    };
    const place = (
      distance: number,
    ): { at: IAutoMovieVector3; yaw: number } => ({
      at: Vector3.scale(line, distance),
      yaw: bearing + 180,
    });
    const carried: IAutoMovieVector3 = Vector3.add(
      shoulder,
      Vector3.scale(line, share * 0.55 * 0.45 * stature),
    );
    const apart = (distance: number): number => {
      const where: { at: IAutoMovieVector3; yaw: number } = place(distance);
      return Vector3.length(
        Vector3.subtract(
          Vector3.add(
            where.at,
            Quaternion.rotateVector(
              HumanObject.frame(where).rotation,
              pell.affordance("target").frame.translation,
            ),
          ),
          carried,
        ),
      );
    };
    let near: number = 0;
    let far: number = 5;
    for (let i: number = 0; i < 40; i++) {
      const mid: number = (near + far) / 2;
      if (apart(mid) < reach) near = mid;
      else far = mid;
    }
    return place(far);
  }
}
