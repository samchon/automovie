import {
  normalizeJointAxes,
  prepareArticulatedRig,
  preparePoseResolution,
  prepareSkeletonPoseResolution,
  validateJointAxesBasis,
} from "@automovie/engine";
import type {
  IAutoMovieArticulatedRig,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../internal/vclose";

/** The two nodes used to track a rotating root and a translated marker. */
type Bone = "root" | "marker";

/**
 * An order-only update invalidates cached joint axes while prepared readers keep their own basis.
 *
 * Scenarios:
 * 1. A source basis edited from implicit order to explicit order invalidates its normalized entry and leaves previous snapshots intact.
 * 2. Prepared articulated and skeleton FK preserve the order across source edits.
 * 3. The literal order admits omitted or distal placement and reports a contradictory declaration on its own field.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the basis cache, prepared rig and refusal scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Reads frozen bases, prepared world frames and validation issues before and after source edits.
 * @evidence contracts/development/testing.md#independent-expectations Starting on +Y, the intrinsic X-Z-Y product of quarter turns acts as Y then Z then X on the marker, taking it to -X. The old proximal product takes it to +X. Optional declarations are checked directly.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers omitted order, explicit order with absent or distal twist placement, and a conflicting proximal placement.
 * @evidence contracts/development/testing.md#execution-ownership One local test reads two rigid nodes and test-owned inputs without a renderer or host.
 */
export function test_kinematics_joint_order_transport(): void {
  const axes: IAutoMovieJointAxes = {
    flexion: { x: 2, y: 0, z: 0 },
    abduction: { x: 0, y: 0, z: 3 },
    twist: { x: 0, y: 4, z: 0 },
  };
  const path: string = "test.axes";
  const legacy: IAutoMovieJointAxes = normalizeJointAxes(axes, path);
  axes.rotationOrder = "flexion-abduction-twist";
  const explicit: IAutoMovieJointAxes = normalizeJointAxes(axes, path);

  TestValidator.predicate(
    "only unchanged admitted axes share the same normalized result",
    legacy.rotationOrder === undefined &&
      explicit.rotationOrder === "flexion-abduction-twist" &&
      explicit !== legacy,
  );

  const rest: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const rig: IAutoMovieArticulatedRig<Bone> = {
    id: "rotation-order",
    bones: [
      { bone: "root", parent: null, axes, rest, limits: null },
      {
        bone: "marker",
        parent: "root",
        axes: legacy,
        rest: { ...rest, translation: { x: 0, y: 1, z: 0 } },
        limits: null,
      },
    ],
  };
  const reader: ReturnType<typeof prepareArticulatedRig<Bone>> =
    prepareArticulatedRig(rig);
  const joints: ReadonlyMap<
    Bone,
    Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist">
  > = new Map([["root", { flexion: 90, abduction: 90, twist: 90 }]]);
  const skeleton: IAutoMovieSkeleton = {
    id: "rotation-order-skeleton",
    bones: [
      { bone: "hips", parent: null, axes, rest, constraint: null },
      {
        bone: "spine",
        parent: "hips",
        rest: rig.bones[1]!.rest,
        constraint: null,
      },
    ],
  };
  const preparedSkeleton: ReturnType<typeof prepareSkeletonPoseResolution> =
    prepareSkeletonPoseResolution(skeleton);
  const operation: ReturnType<typeof preparePoseResolution> =
    preparePoseResolution();
  const pose: IAutoMoviePose = {
    skeleton: skeleton.id,
    root: null,
    joints: [{ bone: "hips", flexion: 90, abduction: 90, twist: 90 }],
  };
  delete axes.rotationOrder;

  TestValidator.predicate(
    "prepared frames and snapshots retain the old declaration after source edits",
    explicit.rotationOrder === "flexion-abduction-twist" &&
      normalizeJointAxes(axes, path).rotationOrder === undefined &&
      vclose(reader.read(joints).get("marker")!.translation, {
        x: -1,
        y: 0,
        z: 0,
      }) &&
      vclose(
        prepareArticulatedRig(rig).read(joints).get("marker")!.translation,
        { x: 1, y: 0, z: 0 },
      ),
  );

  TestValidator.predicate(
    "a prepared skeleton keeps its private basis snapshot",
    vclose(preparedSkeleton.resolve(pose, operation)[1]!.worldPosition, {
      x: -1,
      y: 0,
      z: 0,
    }) &&
      vclose(
        prepareSkeletonPoseResolution(skeleton).resolve(pose, operation)[1]!
          .worldPosition,
        { x: 1, y: 0, z: 0 },
      ),
  );
  TestValidator.predicate(
    "explicit order accepts distal placement",
    validateJointAxesBasis({ ...explicit, twistPlacement: "distal" }, path)
      .length === 0,
  );
  TestValidator.equals(
    "proximal placement conflicts with explicit order",
    [`${path}.twistPlacement`],
    validateJointAxesBasis(
      { ...explicit, twistPlacement: "proximal" },
      path,
    ).map((issue) => issue.path),
  );

}
