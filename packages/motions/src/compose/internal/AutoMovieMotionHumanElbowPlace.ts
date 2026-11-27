import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/*
 * The goal with its elbow placed toward a pole.
 * Parameter body: The body.
 * Parameter posture: The posture the goal is written into, read for the shoulder.
 * Parameter side: The arm.
 * Parameter goal: The arm goal; its `point` is the wrist.
 * Parameter pole: The direction the elbow bends toward given the unit
 * shoulder-to-wrist direction, any vector off that line.
 * Returns: The goal with `bend` at the elbow's place and `elbow: "placed"`.
 */
export function AutoMovieMotionHumanElbowPlace(
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
