import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanChain, AutoMovieMotionHumanPerformance } from "@automovie/motions";
import { HumanLimbFit, poseBones } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";

/** A shifted hip swivel interval still admits the mirrored free-leg targets. */
function legs(body: IAutoMovieMotionHumanBody, pose: IAutoMoviePose): void {
  const bones = poseBones(body, pose);
  const foot = bones.get("rightFoot")!;
  const quiet = HumanLimbFit.fit(
    body,
    pose,
    "rightLeg",
    {
      point: foot.worldPosition,
      bend: bones.get("rightLowerLeg")!.worldPosition,
      rotation: foot.worldRotation,
    },
    [],
  );
  const hip: IAutoMovieVector3 = bones.get("rightUpperLeg")!.worldPosition;
  const start: IAutoMovieHumanLimbGoal = {
    point: Vector3.add(hip, { x: 0.55, y: -0.55, z: -0.15 }),
    bend: Vector3.add(hip, { x: 0, y: -0.4, z: 1 }),
    rotation: poseBones(body, quiet.pose).get("rightFoot")!.worldRotation,
  };
  const interval: number = 0.0001;
  for (const side of ["right", "left"] as const) {
    const limb = `${side}Leg` as const;
    const end = `${side}Foot` as const;
    const goal = side === "right" ? start : HumanLimbFit.reflected(start);
    const previous = HumanLimbFit.fit(body, pose, limb, goal, []);
    const prior = previous.seed!;
    const held = poseBones(body, previous.pose).get(end)!.worldRotation;
    const sample = (height: number): IAutoMovieResolvedBone => {
      const point = Vector3.add(goal.point, { x: 0, y: height, z: 0 });
      const cold = HumanLimbFit.fit(
        body,
        pose,
        limb,
        { ...goal, point, rotation: held },
        [],
      );
      const rotation = poseBones(body, cold.pose).get(end)!.worldRotation;
      const fitted = HumanLimbFit.fit(
        body,
        pose,
        limb,
        { ...goal, point, rotation },
        [],
        undefined,
        { ...prior, tolerance: 0.0001 },
      );
      const shown = poseBones(body, fitted.pose).get(end)!;
      TestValidator.predicate(
        `${limb} keeps its branch and meets the admitted ankle target`,
        fitted.seed?.vanished === true &&
          fitted.seed.branch === prior.branch &&
          Vector3.distance(shown.worldPosition, point) <= 1e-6 &&
          Quaternion.angle(shown.worldRotation, rotation) <= 1e-6,
      );
      return shown;
    };
    const before = sample(0.055 - interval);
    const after = sample(0.055 + interval);
    const velocity = Vector3.scale(
      Vector3.subtract(after.worldPosition, before.worldPosition),
      1 / (2 * interval),
    );
    TestValidator.predicate(
      `${limb} keeps the ankle's 1 m/s upward velocity`,
      Vector3.distance(velocity, { x: 0, y: 1, z: 0 }) <= 1e-6,
    );
  }
}

/** An arm's continued fit still refuses the disconnected wrist turn. */
function arm(body: IAutoMovieMotionHumanBody, pose: IAutoMoviePose): void {
  const goal = (
    flexion: number,
    abduction: number,
    twist: number,
  ): IAutoMovieHumanLimbGoal => {
    const controlled = ["rightUpperArm", "rightLowerArm", "rightHand"];
    const bones = poseBones(body, {
      ...pose,
      joints: [
        ...pose.joints.filter((joint) => !controlled.includes(joint.bone)),
        { bone: "rightUpperArm", flexion, abduction, twist: 0 },
        { bone: "rightLowerArm", flexion: 150, abduction: 0, twist },
        { bone: "rightHand", flexion: 0, abduction: 0, twist: 0 },
      ],
    });
    const hand = bones.get("rightHand")!;
    return {
      point: hand.worldPosition,
      bend: bones.get("rightLowerArm")!.worldPosition,
      rotation: hand.worldRotation,
    };
  };
  const first = HumanLimbFit.fit(body, pose, "rightArm", goal(145, 110, 0), []);
  const next = goal(-20, 0, -80);
  const cold = HumanLimbFit.fit(body, pose, "rightArm", next, []);
  const hand = poseBones(body, cold.pose).get("rightHand")!;
  TestValidator.predicate(
    "the arm reaches the next hand turn cold",
    first.seed?.admitted !== undefined &&
      cold.seed?.admitted !== undefined &&
      Vector3.distance(hand.worldPosition, next.point) <= 0.001 &&
      Quaternion.angle(hand.worldRotation, next.rotation!) <= Math.PI / 180,
  );
  TestValidator.predicate(
    "the arm's earlier wrist arc cannot continue to that turn",
    HumanLimbFit.continues(body, pose, "rightArm", next, [], undefined, {
      ...first.seed!,
      tolerance: 0.0001,
    }) === null,
  );
}

/** Continued limb fits follow the constraints their own chain uses. */
export async function test_motions_posture_limb_fit_continuation(): Promise<void> {
  const body = await humanFixtureBody("m-average");
  const performance = new AutoMovieMotionHumanPerformance({
    seed: "leg-witness",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: AutoMovieMotionHumanChain.subject("a").act("stand", { hold: 1 }).node,
  });
  const pose = performance.pose("a", 0);
  arm(body, pose);
  legs(body, pose);
}
