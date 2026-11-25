import type {
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanArm } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";

/**
 * An arm's finger writer follows the shape selected by the current sample.
 *
 * Scenarios:
 *
 * 1. A proximal index joint starting at 15 degrees reaches 10 degrees for a flat
 *    hand at half weight with 5 degrees of extra curl.
 * 2. The same input reaches 52.5 degrees for a fist with its 85-degree target
 *    flexion. A reverse query restores the independent flat sample.
 * 3. A fixed-shape preparation still writes the actual alternate target.
 */
export async function test_unit_motions_compose_arm_move_shapes(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const root: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const rotation: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const start: IAutoMovieMotionHumanPosture = {
    root,
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { leftIndexProximal: [15, 0, 0] },
    limbs: {},
  };
  const inputs: IAutoMovieMotionHumanArmTarget.IMove = {
    body,
    side: "left",
    from: 0,
    to: 1,
    origin: { point: root, rotation },
    weight: (): number => 0.5,
    target: (
      _posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanArmTarget.ITarget => ({
      surface: "wrist",
      shape: seconds < 0.5 ? "flat" : "fist",
      point: { x: 2, y: 0, z: 0 },
      bend: { x: 0, y: 1, z: 0 },
      rotation,
      curl: 5,
      offset: root,
    }),
  };
  const dynamic: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanArm.move(inputs);
  const fixed: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.move({
    ...inputs,
    fixedShape: "flat",
  });
  for (const move of [dynamic, fixed])
    TestValidator.predicate(
      "the sampled target chooses its own writer and preserves current angle",
      move.write(start, 0.25).joints.leftIndexProximal?.[0] === 10 &&
        move.write(start, 0.75).joints.leftIndexProximal?.[0] === 52.5 &&
        move.write(start, 0.25).joints.leftIndexProximal?.[0] === 10 &&
        start.joints.leftIndexProximal?.[0] === 15,
    );
}
