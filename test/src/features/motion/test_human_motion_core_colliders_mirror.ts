import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanColliders,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The body's left colliders are the mirror images of its right ones, point
 * for point and bit for bit, so a left-hand problem mirrored to the right
 * reads the very colliders a right-hand one does.
 *
 * Scenario: on the average man's quiet stance, every placed left segment's
 * shapes, each hull's points in order and each other shape's centre,
 * negated in x, equal its right twin's exactly, with as many shapes and
 * points on both sides.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places the real body's colliders and compares the placed world points; a left hull listed in another order, a reflected turn or a rounding difference between the sides fails.
 * @evidence contracts/development/testing.md#independent-expectations The expectation is the right twin's own placement mirrored here, compared with equality.
 * @evidence contracts/development/testing.md#distinguishing-cases The arm, hand, leg, foot and toe hulls and the phalanges' capsules.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory unit on one prepared body; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the scenario and the exactness asked.
 */
export function test_human_motion_core_colliders_mirror(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const bones = poseBones(
    body,
    resolveHumanPosture(body, stand.posture(body, { x: 0, y: 0, z: 0 }, 0)),
  );
  const placed: IAutoMovieMotionHumanColliders.IPlaced[] =
    HumanColliders.placed(body, bones);
  const world = (
    s: IAutoMovieMotionHumanColliders.IPlaced,
  ): IAutoMovieVector3[][] =>
    s.shapes.map((shape) => {
      const at = (p: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(
          s.pose.position,
          Quaternion.rotateVector(
            s.pose.rotation,
            Vector3.add(
              shape.transform.position,
              Quaternion.rotateVector(shape.transform.rotation, p),
            ),
          ),
        );
      return shape.kind === "hull"
        ? shape.points.map(at)
        : [at({ x: 0, y: 0, z: 0 })];
    });
  const misses: string[] = [];
  let pairs: number = 0;
  for (const left of placed.filter((s): boolean => s.bone.startsWith("left"))) {
    const right: IAutoMovieMotionHumanColliders.IPlaced | undefined =
      placed.find(
        (s): boolean => s.bone === left.bone.replace("left", "right"),
      );
    if (right === undefined) continue;
    ++pairs;
    const l: IAutoMovieVector3[][] = world(left);
    const r: IAutoMovieVector3[][] = world(right);
    const same: boolean =
      l.length === r.length &&
      l.every(
        (points: IAutoMovieVector3[], i: number): boolean =>
          points.length === r[i]!.length &&
          points.every(
            (p: IAutoMovieVector3, k: number): boolean =>
              -p.x === r[i]![k]!.x &&
              p.y === r[i]![k]!.y &&
              p.z === r[i]![k]!.z,
          ),
      );
    if (!same) misses.push(left.bone);
  }
  TestValidator.predicate(
    `every left collider mirrors its right twin bit for bit (${pairs} pairs; off: ${misses.join(", ")})`,
    pairs > 10 && misses.length === 0,
  );
}
