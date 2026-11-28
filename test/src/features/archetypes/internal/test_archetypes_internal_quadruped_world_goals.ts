import {
  QuadrupedPoseAngles
} from "../../../../../packages/archetypes/src/animals/quadruped/QuadrupedPoseAngles";
import { AutoMovieEngineQuaternion, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../internal/qclose";
import { vclose } from "../../internal/vclose";

/** Allows frame decomposition and a rigid joint reconstruction. */
const GOAL_ROUNDING: number = 128 * Number.EPSILON;

/**
 * World directions survive the carried parent and large finite magnitudes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines a carried neck's world direction, rotation goal, scaled finite input and zero-vector refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Lowers actual direction and rotation goals on a prepared two-bone rig with a 90 degree root yaw. Measures the emitted world neck direction at unit and maximum finite inputs.
 * @evidence contracts/development/testing.md#independent-expectations The normalized world diagonal is `(1/sqrt(2), 1/sqrt(2), 0)` at either scale. An identity rotation goal cancels the carried yaw, and a zero vector has no direction.
 */
export function test_archetypes_internal_quadruped_world_goals(): void {
  const neutral: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const axes: IAutoMovieJointAxes = {
    flexion: { x: 1, y: 0, z: 0 },
    abduction: { x: 0, y: 0, z: 1 },
    twist: { x: 0, y: 1, z: 0 },
  };
  const rig: Parameters<typeof QuadrupedPoseAngles>[0] = {
    id: "world neck target",
    bones: [
      { bone: "trunk", parent: null, rest: neutral, axes, limits: null },
      {
        bone: "neck",
        parent: "trunk",
        rest: { ...neutral, translation: { x: 0, y: 1, z: 0 } },
        axes,
        limits: null,
      },
    ],
  };
  const root: IAutoMovieTransform = {
    ...neutral,
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
  };
  const lower = QuadrupedPoseAngles(rig, AutoMovieEngineKinematics.prepareArticulatedRig(rig));
  for (const scale of [1, Number.MAX_VALUE]) {
    const aimed = lower(
      root,
      undefined,
      new Map([
        [
          "neck",
          { kind: "direction", direction: { x: scale, y: scale, z: 0 } },
        ],
      ]),
    );
    const facing = AutoMovieEngineQuaternion.rotateVector(aimed.frames.get("neck")!.rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    TestValidator.predicate(
      "a carried neck reaches the authored world plane diagonal",
      vclose(facing, { x: Math.SQRT1_2, y: Math.SQRT1_2, z: 0 }, GOAL_ROUNDING),
    );
  }
  const aligned = lower(
    root,
    undefined,
    new Map([["neck", { kind: "rotation", rotation: neutral.rotation }]]),
  );
  TestValidator.predicate(
    "a world rotation target cancels the carried yaw",
    qclose(
      aligned.frames.get("neck")!.rotation,
      neutral.rotation,
      GOAL_ROUNDING,
    ),
  );
  TestValidator.error("a zero vector has no goal direction", (): unknown =>
    lower(
      root,
      undefined,
      new Map([
        ["neck", { kind: "direction", direction: neutral.translation }],
      ]),
    ),
  );
}
