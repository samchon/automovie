import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelSeed,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanLimbFit
} from "../../../../../packages/motions/src/posture/internal/HumanLimbFit";
import {
  poseBones
} from "../../../../../packages/motions/src/posture/internal/poseBones";
import {
  resolveHumanPosture
} from "../../../../../packages/motions/src/posture/internal/resolveHumanPosture";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { vclose } from "../../internal/vclose";

/**
 * How near a fitted hand lies to its goal, metres: a millimetre, the goal
 * tolerance an arm's plan is solved to (`HumanArmTrajectoryTerms.TOLERANCE`).
 */
const REACH: number = 1e-3;

/** How far the hand is moved forward and up, metres: well within reach. */
const SHIFT: IAutoMovieVector3 = { x: 0, y: 0.15, z: 0.2 };

/**
 * `HumanLimbFit` places one limb on a goal with the two-bone solver: the end
 * joint at the goal's point, the elbow toward its bend hint; a limb posed at
 * the swivel and branch a fit chose (`seed`, `at`) lands on the same goal in
 * closed form; a goal's mirror image swaps the body's sides (`reflected`).
 *
 * On the average man standing with his arms down, the left hand's goal is its
 * own place moved 0.15 m up and 0.2 m forward.
 *
 * Scenarios:
 *
 * 1. Each limb's chain names its three bones.
 * 2. The fitted left hand lies on the goal within a millimetre, and its seed is
 *    the fitted arm's.
 * 3. The arm posed at that seed lands on the goal within a millimetre.
 * 4. The mirrored goal negates the point's and the bend's x.
 * 5. `resolveHumanPosture` with the goal in the posture fits the same hand.
 *
 * The body is built whole (`humanFixtureBody`): the fit reads the body's
 * prepared limb chains and limb reads, and the resolve its pose rig, topology,
 * ROM projection and settled bones, records only
 * `AutoMovieMotionHumanBody.create` derives from the stored rig and profile.
 */
export async function test_motions_posture_limb_fit(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const standing: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: body.measure.hipHeight, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const pose: IAutoMoviePose = resolveHumanPosture(body, standing);
  const hand = (of: IAutoMoviePose): IAutoMovieVector3 =>
    poseBones(body, of).get("leftHand" satisfies AutoMovieHumanoidBone)!
      .worldPosition;
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    pose,
  );
  const rest: IAutoMovieVector3 = bones.get("leftHand")!.worldPosition;
  const elbow: IAutoMovieVector3 = bones.get("leftLowerArm")!.worldPosition;
  const goal: IAutoMovieHumanLimbGoal = {
    point: {
      x: rest.x + SHIFT.x,
      y: rest.y + SHIFT.y,
      z: rest.z + SHIFT.z,
    },
    bend: { x: elbow.x + 0.1, y: elbow.y, z: elbow.z - 0.1 },
  };

  // 1. Chains.
  TestValidator.equals(
    "an arm's and a leg's chains",
    [HumanLimbFit.chain("leftArm"), HumanLimbFit.chain("rightLeg")],
    [
      { upper: "leftUpperArm", lower: "leftLowerArm", effector: "leftHand" },
      { upper: "rightUpperLeg", lower: "rightLowerLeg", effector: "rightFoot" },
    ],
  );

  // 2. The fit.
  const fitted: IAutoMovieSeededChainFit = HumanLimbFit.fit(
    body,
    pose,
    "leftArm",
    goal,
    ["left", "right"],
  );
  const seed: IAutoMovieSwivelSeed | null = HumanLimbFit.seed(
    body,
    fitted.pose,
    "leftArm",
  );
  TestValidator.predicate(
    "the hand lies on its goal",
    vclose(hand(fitted.pose), goal.point, REACH) && seed !== null,
  );

  // 3. Posed at the seed.
  const posed: ReturnType<typeof HumanLimbFit.at> = HumanLimbFit.at(
    body,
    pose,
    "leftArm",
    goal,
    seed!.swivel,
    seed!.branch,
  );
  TestValidator.predicate(
    "the arm posed at its seed lands on the goal",
    posed !== null && vclose(hand(posed.pose), goal.point, REACH),
  );

  // 4. The mirror image.
  const mirrored: IAutoMovieHumanLimbGoal = HumanLimbFit.reflected(goal);
  TestValidator.predicate(
    "the mirror image negates x",
    vclose(
      mirrored.point,
      { x: -goal.point.x, y: goal.point.y, z: goal.point.z },
      1e-12,
    ) &&
      vclose(
        mirrored.bend,
        { x: -goal.bend.x, y: goal.bend.y, z: goal.bend.z },
        1e-12,
      ),
  );

  // 5. Through the posture.
  TestValidator.predicate(
    "the posture's resolve fits the same hand",
    vclose(
      hand(
        resolveHumanPosture(body, {
          ...standing,
          limbs: { leftArm: goal },
        }),
      ),
      goal.point,
      REACH,
    ),
  );
}
