import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";
import {
  HumanFoot
} from "../../../../../packages/motions/src/posture/internal/HumanFoot";
import {
  poseBones
} from "../../../../../packages/motions/src/posture/internal/poseBones";
import {
  prepareWalkSwingSeams
} from "../../../../../packages/motions/src/actions/internal/prepareWalkSwingSeams";
import {
  resolveHumanPosture
} from "../../../../../packages/motions/src/posture/internal/resolveHumanPosture";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * The free foot inherits the actual contact pose at either swing boundary. In
 * the middle of flight, its original goal and toes stay unchanged.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Swing boundaries inherit the achieved stance foot, while unconstrained flight retains its incoming goal and toes.
 * @evidence contracts/development/testing.md#behavioral-verification Calls swing seam preparation with an out-of-axis leg goal at both endpoints and the middle share.
 * @evidence contracts/development/testing.md#independent-expectations Forward kinematics supplies an independently adjusted ankle and knee for the boundaries. At the middle, the original point, bend, rotation and toes must retain their identity.
 */
export function test_motions_actions_walk_swing_seams(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const base: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { leftToes: [-12, 0, 0] },
    limbs: {},
  };
  const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "leftFoot",
    "leftLowerLeg",
  ]);
  const neutral: ReturnType<typeof poseBones> = poseBones(
    body,
    resolveHumanPosture(body, base),
    undefined,
    requested,
  );
  const ankle = neutral.get("leftFoot")!.worldPosition;
  const goal: IAutoMovieHumanLimbGoal = {
    point: { x: ankle.x, y: ankle.y + 0.04, z: ankle.z + 0.15 },
    bend: { x: ankle.x, y: ankle.y + 0.25, z: ankle.z + 1 },
    rotation: HumanFoot.rotation(120, 25),
  };
  const plant: IAutoMovieHumanLimbGoal = {
    ...goal,
    planted: true,
    contact: HumanFoot.offset(body, "left", "mtp"),
  };
  const tOff: number = 1;
  const tOn: number = 2;
  const at = (seconds: number): IAutoMovieMotionHumanPosture => ({
    ...base,
    limbs: { leftLeg: seconds < tOff || seconds >= tOn ? plant : goal },
  });
  const resolved: IAutoMoviePose = resolveHumanPosture(body, at(tOn));
  const held: ReturnType<typeof poseBones> = poseBones(
    body,
    resolved,
    undefined,
    requested,
  );
  const actual = held.get("leftFoot")!;
  const toe: number =
    resolved.joints.find(({ bone }) => bone === "leftToes")?.flexion ?? 0;
  const prepare = prepareWalkSwingSeams(
    body,
    [{ side: "left", off: tOff, on: tOn }],
    (_side, seconds) => at(seconds),
  );
  TestValidator.predicate(
    "the out-of-axis contact actually adjusts the requested ankle",
    !vclose(actual.worldPosition, goal.point, 1e-3),
  );
  for (const u of [1, 0.5, 0]) {
    const flight: IAutoMovieHumanLimbGoal = { ...goal };
    const joints = { ...base.joints };
    prepare("left", { off: tOff, on: tOn, u }, flight, joints);
    if (u === 0.5) {
      TestValidator.predicate(
        "unconstrained flight retains its original inputs",
        flight.point === goal.point &&
          flight.bend === goal.bend &&
          flight.rotation === goal.rotation &&
          joints.leftToes === base.joints.leftToes,
      );
      continue;
    }
    TestValidator.predicate(
      "the boundary carries the achieved ankle, knee, and toes",
      vclose(flight.point, actual.worldPosition, 1e-9) &&
        vclose(flight.bend, held.get("leftLowerLeg")!.worldPosition, 1e-9) &&
        nclose(joints.leftToes![0], toe, 1e-9) &&
        vclose(
          AutoMovieEngineQuaternion.rotateVector(flight.rotation!, { x: 0, y: 0, z: 1 }),
          AutoMovieEngineQuaternion.rotateVector(actual.worldRotation, { x: 0, y: 0, z: 1 }),
          1e-9,
        ),
    );
  }
}
