import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { humanLimbGoalWorld } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/** Rounding of a rigid transform, metres. */
const ROUNDING: number = 1e-12;

/**
 * `humanLimbGoalWorld` carries a goal riding a bone into the world: its point
 * and bend by `P + R p` of the bone's posed frame, its rotation composed after
 * the bone's (`R q`), and its own-bone colliders (`clearanceOn`) placed the
 * same way after its world ones; a goal on no bone is returned as it is. A goal
 * on a bone of the limb's own chain, or on a bone the rig lacks, is refused.
 *
 * The body is built whole (`humanFixtureBody`) only for the call; the bone's
 * frame is supplied by `readAuthored`.
 *
 * Scenarios, the chest posed at (0, 1.3, 0) turned 90 degrees about +Y:
 *
 * 1. A left arm goal on the chest at (0.1, 0, 0.2), bend (0, 0.1, 0), rotation the
 *    identity: (0.2, 1.3, −0.1), (0, 1.4, 0) and the chest's turn; its
 *    attachment dropped.
 * 2. Its own-bone collider at (0, 0, 0.3) lands at (0.3, 1.3, 0) after the world
 *    one it already keeps clear of.
 * 3. A goal on no bone is returned; on the left forearm or a bone the reading
 *    lacks it is refused.
 */
export async function test_unit_motions_posture_limb_goal_world(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const pose: IAutoMoviePose = { joints: [] };
  const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    90,
  );
  const agree = (q: IAutoMovieQuaternion): boolean =>
    Math.abs(q.x * turn.x + q.y * turn.y + q.z * turn.z + q.w * turn.w) >
    1 - ROUNDING;
  const read = (): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    new Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>([
      [
        "chest",
        {
          bone: "chest",
          localRotation: turn,
          worldPosition: { x: 0, y: 1.3, z: 0 },
          worldRotation: turn,
        },
      ],
    ]);
  const segment = (z: number): IAutoMovieMotionHumanColliders.IPlaced => ({
    bone: "head",
    pose: {
      position: { x: 0, y: 0, z },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    shapes: [],
  });
  const goal: IAutoMovieHumanLimbGoal = {
    point: { x: 0.1, y: 0, z: 0.2 },
    bend: { x: 0, y: 0.1, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    on: "chest",
    clear: [segment(5)],
    clearanceOn: { clear: [segment(0.3)], rests: [] },
  };

  // 1. Carried to the world.
  const world: IAutoMovieHumanLimbGoal = humanLimbGoalWorld(
    body,
    pose,
    "leftArm",
    goal,
    read,
  );
  TestValidator.predicate(
    "the goal in the world",
    vclose(world.point, { x: 0.2, y: 1.3, z: -0.1 }, ROUNDING) &&
      vclose(world.bend, { x: 0, y: 1.4, z: 0 }, ROUNDING) &&
      agree(world.rotation!) &&
      world.on === undefined &&
      world.clearanceOn === undefined,
  );

  // 2. Colliders.
  TestValidator.predicate(
    "the own-bone collider after the world one",
    world.clear!.length === 2 &&
      world.clear![0]!.pose.position.z === 5 &&
      vclose(
        world.clear![1]!.pose.position,
        { x: 0.3, y: 1.3, z: 0 },
        ROUNDING,
      ) &&
      world.rests!.length === 0,
  );

  // 3. No bone and refusals.
  const free: IAutoMovieHumanLimbGoal = { point: goal.point, bend: goal.bend };
  TestValidator.predicate(
    "a free goal kept, own and missing bones refused",
    humanLimbGoalWorld(body, pose, "leftArm", free, read) === free &&
      throwsError(
        (): unknown =>
          humanLimbGoalWorld(
            body,
            pose,
            "leftArm",
            { ...free, on: "leftLowerArm" },
            read,
          ),
        "its own chain",
      ) &&
      throwsError(
        (): unknown =>
          humanLimbGoalWorld(
            body,
            pose,
            "leftArm",
            { ...free, on: "head" },
            read,
          ),
        "rig lacks",
      ),
  );
}
