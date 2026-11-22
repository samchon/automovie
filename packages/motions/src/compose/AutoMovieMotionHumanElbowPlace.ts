import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * An arm goal's elbow placed by the law (`elbow: "placed"`): a goal's
 * `bend` alone is a preference the hand's rotation outranks, so a nearly
 * straight arm may take either branch from one sample to the next. Placed,
 * the fit starts from the elbow the law names and keeps it where it is
 * legal. The place is closed form: where the upper arm and the forearm meet
 * between the posed shoulder and the goal's wrist, bent toward a pole the
 * law gives (the law of cosines in their plane).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States why the elbow is placed and how the place is found.
 * @evidence contracts/development/design.md#principled-representation The goal's own `elbow` contract with its `bend` as the place.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One writer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The segment lengths and the shoulder are the body's own.
 */
export namespace AutoMovieMotionHumanElbowPlace {
  /**
   * The goal with its elbow placed toward a pole.
   *
   * @param body The body.
   * @param posture The posture the goal is written into, read for the shoulder.
   * @param side The arm.
   * @param goal The arm goal; its `point` is the wrist.
   * @param pole The direction the elbow bends toward given the unit shoulder-to-wrist direction, any vector off that line.
   * @returns The goal with `bend` at the elbow's place and `elbow: "placed"`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The law of cosines in the plane of the shoulder-wrist line and the pole.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Shoulder, plane, place.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A wrist beyond the arm's reach places the elbow on the straight line.
   * @evidence contracts/development/implementation.md#efficient-algorithms One shoulder FK and constant arithmetic.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The pose reader.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    goal: IAutoMovieHumanLimbGoal,
    pole: (along: IAutoMovieVector3) => IAutoMovieVector3,
  ): IAutoMovieHumanLimbGoal {
    const bone: AutoMovieHumanoidBone =
      side === "left" ? "leftUpperArm" : "rightUpperArm";
    const shoulder: IAutoMovieVector3 = poseBones(
      body,
      resolveHumanPosture(body, { ...posture, limbs: {} }),
      undefined,
      new Set<AutoMovieHumanoidBone>([bone]),
    ).get(bone)!.worldPosition;
    const upper: number = body.measure.upperArm;
    const fore: number = body.measure.forearm;
    const line: IAutoMovieVector3 = Vector3.subtract(goal.point, shoulder);
    const d: number = Math.min(upper + fore - 1e-6, Vector3.length(line));
    const u: IAutoMovieVector3 =
      Vector3.length(line) > 1e-9
        ? Vector3.normalize(line)
        : { x: 0, y: -1, z: 0 };
    const toward: IAutoMovieVector3 = pole(u);
    const across: IAutoMovieVector3 = Vector3.subtract(
      toward,
      Vector3.scale(u, Vector3.dot(toward, u)),
    );
    const w: IAutoMovieVector3 =
      Vector3.length(across) > 1e-9 ? Vector3.normalize(across) : across;
    const cosine: number = Math.max(
      -1,
      Math.min(1, (upper * upper + d * d - fore * fore) / (2 * upper * d)),
    );
    return {
      ...goal,
      bend: Vector3.add(
        shoulder,
        Vector3.add(
          Vector3.scale(u, upper * cosine),
          Vector3.scale(w, upper * Math.sqrt(1 - cosine * cosine)),
        ),
      ),
      elbow: "placed",
    };
  }
}
