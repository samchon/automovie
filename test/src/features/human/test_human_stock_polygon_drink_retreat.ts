import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { HumanHandAttitude } from "../../../../packages/motions/src/posture/internal/HumanHandAttitude";
import { poseBones } from "../../../../packages/motions/src/posture/internal/poseBones";
import { resolveHumanPosture } from "../../../../packages/motions/src/posture/internal/resolveHumanPosture";
import { humanFixtureBody } from "../internal/fixtures/humanFixtureBody";

/**
 * A planned carry's hand adjustment preserves its admitted forearm twist.
 *
 * An explicit wrist flexion remains available while the wrist takes an
 * orientation that also asks for an axial turn. An unplanned carry may use the
 * forearm for that axial turn.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Uses one typed stock rig pose, resolves the requested hand orientation from explicit joint angles and calls the held-attitude owner in its planned and default modes.
 * @evidence contracts/development/testing.md#independent-expectations A pure turn around the elbow-to-wrist axis cannot change the arm's endpoints. The planned forearm must retain its known zero twist and the resulting wrist must move away from neutral. The same request can use forearm twist on the default route.
 * @evidence contracts/development/common.md#meaningful-documentation Names the position and orientation obligations for planned and unplanned carries.
 */
export async function test_human_stock_polygon_drink_retreat(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const rest: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {
      rightUpperArm: [0, 0, 0],
      rightLowerArm: [0, 0, 0],
      rightHand: [0, 0, 0],
    },
    limbs: {},
  };
  const flexed: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(
      body,
      resolveHumanPosture(body, {
        ...rest,
        joints: { ...rest.joints, rightHand: [12, 0, 0] },
      }),
    );
  const wrist: IAutoMovieResolvedBone = flexed.get("rightHand")!;
  const elbow: IAutoMovieResolvedBone = flexed.get("rightLowerArm")!;
  const along: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
    AutoMovieEngineVector3.subtract(wrist.worldPosition, elbow.worldPosition),
  );
  const requested: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
    AutoMovieEngineQuaternion.fromAxisAngle(along, 30),
    wrist.worldRotation,
  );
  const planned: IAutoMovieMotionHumanPosture = HumanHandAttitude.held(
    body,
    rest,
    "right",
    requested,
    undefined,
    undefined,
    true,
  );
  const unconstrained: IAutoMovieMotionHumanPosture = HumanHandAttitude.held(
    body,
    rest,
    "right",
    requested,
  );
  TestValidator.equals(
    "the certified plan keeps all forearm angles",
    planned.joints.rightLowerArm,
    rest.joints.rightLowerArm,
  );
  TestValidator.predicate(
    "the wrist still flexes with its own admitted range",
    Math.abs(planned.joints.rightHand![0]) > 1,
  );
  TestValidator.predicate(
    "an unplanned wrist can use the forearm's twist",
    Math.abs(unconstrained.joints.rightLowerArm![2]) > 1,
  );
  const placed: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(body, resolveHumanPosture(body, planned));
  TestValidator.predicate(
    "planned attitude keeps the wrist and elbow centres",
    AutoMovieEngineVector3.length(
      AutoMovieEngineVector3.subtract(
        placed.get("rightHand")!.worldPosition,
        wrist.worldPosition,
      ),
    ) < 1e-9 &&
      AutoMovieEngineVector3.length(
        AutoMovieEngineVector3.subtract(
          placed.get("rightLowerArm")!.worldPosition,
          elbow.worldPosition,
        ),
      ) < 1e-9,
  );
}
