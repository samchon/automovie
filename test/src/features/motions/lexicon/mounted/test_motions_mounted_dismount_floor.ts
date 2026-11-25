import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanFoot,
  poseBones,
  prepareMountOffFloor,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { vclose } from "../../../internal/vclose";

/**
 * A dismount's right foot turns about one material contact from touchdown to
 * standing, including when its requested touchdown ankle has shifted.
 *
 * Scenarios:
 * 1. The landing goal takes the final stance's fixed ball position.
 * 2. Mid-stance retains that contact while the foot is turning.
 * 3. The full leg reconstructs the contact with the prepared knee branch.
 */
export async function test_motions_mounted_dismount_floor(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const ready: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { rightUpperLeg: [25, 0, 0], rightLowerLeg: [55, 0, 0] },
    limbs: {},
  };
  const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "rightLowerLeg",
    "rightFoot",
  ]);
  const readyBones: ReturnType<typeof poseBones> = poseBones(
    body,
    resolveHumanPosture(body, ready),
    undefined,
    requested,
  );
  const foot: IAutoMovieResolvedBone = readyBones.get("rightFoot")!;
  const contact: IAutoMovieVector3 = HumanFoot.offset(body, "right", "mtp");
  const landing: IAutoMovieHumanLimbGoal = {
    point: foot.worldPosition,
    bend: readyBones.get("rightLowerLeg")!.worldPosition,
    rotation: foot.worldRotation,
    planted: true,
    contact,
  };
  const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 1, y: 0, z: 0 },
    12,
  );
  const touchdown: IAutoMovieHumanLimbGoal = {
    ...landing,
    point: Vector3.add(landing.point, { x: 0.045, y: 0, z: 0 }),
    rotation: Quaternion.multiply(turn, foot.worldRotation),
  };
  const anchor: IAutoMovieVector3 = Vector3.add(
    landing.point,
    Quaternion.rotateVector(foot.worldRotation, contact),
  );
  const first: number = 2;
  const last: number = first + 1 / 64;
  const read: prepareMountOffFloor.Read = prepareMountOffFloor(
    body,
    "right",
    first,
    last,
    (t: number): IAutoMovieMotionHumanPosture => ({
      ...ready,
      limbs: { rightLeg: t < last ? touchdown : landing },
    }),
  );

  const rotations: IAutoMovieQuaternion[] = [];
  for (const seconds of [first, (first + last) / 2, last]) {
    const planted: prepareMountOffFloor.IPlaced = read(seconds);
    const goal: IAutoMovieHumanLimbGoal | undefined = planted.goal;
    TestValidator.predicate(
      "the prepared contact stays on its fixed ball with a hinged knee",
      goal?.seed !== undefined &&
        goal.rotation !== undefined &&
        vclose(
          Vector3.add(goal.point, Quaternion.rotateVector(goal.rotation, contact)),
          anchor,
          1e-9,
        ),
    );
    rotations.push(goal!.rotation!);
    const displayed: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture(body, {
        ...ready,
        joints: { ...ready.joints, ...planted.joints },
        limbs: { rightLeg: goal! },
      }),
      undefined,
      requested,
    );
    const actual: IAutoMovieResolvedBone = displayed.get("rightFoot")!;
    TestValidator.predicate(
      "the reconstructed foot stays on the contact within 1 mm",
      Vector3.distance(
        Vector3.add(
          actual.worldPosition,
          Quaternion.rotateVector(actual.worldRotation, contact),
        ),
        anchor,
      ) < 0.001,
    );
  }
  const toe: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  TestValidator.predicate(
    "touchdown and standing have distinct foot turns",
    Vector3.distance(
      Quaternion.rotateVector(rotations[0]!, toe),
      Quaternion.rotateVector(rotations[2]!, toe),
    ) > 0.05,
  );
}
