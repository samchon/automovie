import { HUMANOID_JOINT_AXES, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  createHumanBody,
} from "@automovie/motions";
import {
  HumanJacobian,
  HumanPosturePreparation,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../internal/motionHumanBody";
import { vclose } from "../../../internal/vclose";

/**
 * A hip chart's ordered joint axes agree with the displayed foot derivative and
 * belong to the prepared posture's rig identity.
 *
 * Scenarios:
 *
 * 1. Each flexion-first hip variable predicts the derivative of the same material
 *    point on a posed foot.
 * 2. Changing only the live joint order returns an issued bone observation to cold
 *    resolution.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the physical point, axes and isolated rig edit.
 * @evidence contracts/development/testing.md#behavioral-verification Compares each real kinematic derivative with a central difference of displayed forward kinematics, then changes just the source metadata.
 * @evidence contracts/development/testing.md#independent-expectations Central differences perturb the posed leg at a fixed articulation. Prepared rig source equivalence requires the same rotation convention even when the vectors and axis ranges agree.
 * @evidence contracts/development/testing.md#distinguishing-cases Uses three nonzero hip angles and all three coordinate disturbances. The standalone limb Jacobian test checks the unchanged legacy chart.
 * @evidence contracts/development/testing.md#execution-ownership Uses a separate in-memory body assembled from genuine polygon geometry. The shared fixture is borrowed without mutation.
 */
export function test_motion_dynamics_clinical_jacobian(): void {
  const source: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const bone: IAutoMovieBone = source.skeleton.bones.find(
    (value: IAutoMovieBone): boolean => value.bone === "rightUpperLeg",
  )!;
  const basis: IAutoMovieJointAxes | undefined =
    bone.axes ?? HUMANOID_JOINT_AXES.rightUpperLeg;
  if (basis === undefined) throw new Error("The right hip has no joint axes");
  const hip: IAutoMovieBone = {
    ...bone,
    axes: { ...basis, rotationOrder: "flexion-abduction-twist" },
  };
  const body: IAutoMovieMotionHumanBody = createHumanBody(
    {
      ...source.skeleton,
      bones: source.skeleton.bones.map(
        (def: IAutoMovieBone): IAutoMovieBone => (def === bone ? hip : def),
      ),
    },
    source.profile,
  );
  const standing: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const posture = (
    angles: readonly [number, number, number],
  ): IAutoMovieMotionHumanPosture => ({
    ...standing,
    limbs: {},
    joints: { ...standing.joints, rightUpperLeg: angles },
  });
  const angles: [number, number, number] = [65, 15, 28];
  const current: IAutoMovieMotionHumanPosture = posture(angles);
  const shown = poseBones(body, resolveHumanPosture(body, current));
  const foot: IAutoMovieResolvedBone = shown.get("rightFoot")!;

  // Offset from the foot joint so the material point also reads axial twist.
  const local: IAutoMovieVector3 = { x: 0.03, y: -0.04, z: 0.07 };
  const point = (value: IAutoMovieResolvedBone): IAutoMovieVector3 =>
    Vector3.add(
      value.worldPosition,
      Quaternion.rotateVector(value.worldRotation, local),
    );
  const motions = HumanJacobian(
    body,
    current,
    shown,
    ([0, 1, 2] as const).map((axis) => ({
      kind: "angle",
      bone: "rightUpperLeg",
      axis,
    })),
  );
  for (const axis of [0, 1, 2] as const) {
    const h: number = 0.001;
    const before: [number, number, number] = [...angles];
    const after: [number, number, number] = [...angles];
    before[axis] -= h;
    after[axis] += h;
    const sample = (values: typeof angles): IAutoMovieVector3 =>
      point(
        poseBones(body, resolveHumanPosture(body, posture(values))).get(
          "rightFoot",
        )!,
      );
    const expected: IAutoMovieVector3 = Vector3.scale(
      Vector3.subtract(sample(after), sample(before)),
      1 / (2 * h),
    );
    TestValidator.predicate(
      `clinical hip axis ${axis} differentiates the displayed foot point`,
      vclose(
        HumanJacobian.velocity(motions[axis]!, "rightFoot", point(foot)),
        expected,
        1e-6,
      ),
    );
  }

  let reads: number = 0;
  const raw: IAutoMovieMotionHumanPosture = {
    root: current.root,
    yaw: current.yaw,
    pitch: current.pitch,
    roll: current.roll,
    limbs: current.limbs,
    get joints(): IAutoMovieMotionHumanPosture["joints"] {
      ++reads;
      return current.joints;
    },
  };
  const prepared: HumanPosturePreparation.IPrepared =
    HumanPosturePreparation.prepare(body, raw);
  const requested = new Set(["rightFoot"] as const);
  reads = 0;
  const reused = HumanPosturePreparation.bones(prepared, requested);
  TestValidator.predicate(
    "the issued source reads the foot without re-reading authored joints",
    reads === 0 && vclose(point(reused.get("rightFoot")!), point(foot), 1e-9),
  );

  body.skeleton.bones.find(
    (def: IAutoMovieBone): boolean => def.bone === hip.bone,
  )!.axes = basis;
  const fallback = HumanPosturePreparation.bones(prepared, requested);
  const coldRead: boolean = reads > 0;
  const expected = poseBones(
    body,
    resolveHumanPosture(body, raw),
    undefined,
    requested,
  );
  TestValidator.predicate(
    "changing only the live joint order re-resolves the authored joints",
    coldRead &&
      vclose(
        point(fallback.get("rightFoot")!),
        point(expected.get("rightFoot")!),
        1e-9,
      ),
  );
}
