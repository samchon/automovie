import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  motionHumanElbowPlace
} from "../../../../../packages/motions/src/compose/internal/motionHumanElbowPlace";
import {
  motionHumanElbowPole
} from "../../../../../packages/motions/src/compose/internal/motionHumanElbowPole";
import {
  poseBones
} from "../../../../../packages/motions/src/posture/internal/poseBones";
import {
  resolveHumanPosture
} from "../../../../../packages/motions/src/posture/internal/resolveHumanPosture";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";

/** Rounding of the law of cosines and a normalization, metres. */
const ROUNDING: number = 1e-9;

/**
 * An arm's elbow placed toward a pole: `motionHumanElbowPlace` puts
 * the bend where the upper arm and the forearm meet over the shoulder-to-goal
 * line by the law of cosines, on the side the pole points across that line,
 * marked `placed`; `motionHumanElbowPole` puts the pole out along the
 * olecranon, `POLE` of the forearm from the elbow, opposite to where flexing
 * the elbow `FLEX` degrees carries the hand.
 *
 * The body is built whole (`humanFixtureBody`) for the arm's measures and rig.
 *
 * Scenarios, the average man standing, his left wrist's goal 0.45 m ahead of
 * the shoulder and 0.2 m down, the pole straight up:
 *
 * 1. The bend lies an upper arm from the shoulder and a forearm from the goal,
 *    above the shoulder-to-goal line, and is marked placed.
 * 2. A goal past the arm's reach is placed at the line, the arm straight.
 * 3. The pole lies `POLE` of the elbow-to-wrist length from the elbow, against the
 *    hand's travel as the elbow flexes.
 */
export async function test_motions_compose_elbow_place(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const standing: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: body.measure.hipHeight, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    resolveHumanPosture(body, standing),
  );
  const shoulder: IAutoMovieVector3 = bones.get("leftUpperArm")!.worldPosition;
  const goal: IAutoMovieHumanLimbGoal = {
    point: AutoMovieEngineVector3.add(shoulder, { x: 0, y: -0.2, z: 0.45 }),
    bend: shoulder,
  };
  const up = (): IAutoMovieVector3 => ({ x: 0, y: 1, z: 0 });

  // 1. The law of cosines.
  const placed: IAutoMovieHumanLimbGoal = motionHumanElbowPlace(
    body,
    standing,
    "left",
    goal,
    up,
  );
  const line: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
    AutoMovieEngineVector3.subtract(goal.point, shoulder),
  );
  const out: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(placed.bend, shoulder);
  TestValidator.predicate(
    "the elbow between the bones, toward the pole",
    nclose(AutoMovieEngineVector3.length(out), body.measure.upperArm, ROUNDING) &&
      nclose(
        AutoMovieEngineVector3.distance(placed.bend, goal.point),
        body.measure.forearm,
        ROUNDING,
      ) &&
      AutoMovieEngineVector3.dot(
        AutoMovieEngineVector3.subtract(out, AutoMovieEngineVector3.scale(line, AutoMovieEngineVector3.dot(out, line))),
        { x: 0, y: 1, z: 0 },
      ) > 0 &&
      placed.elbow === "placed",
  );

  // 2. Out of reach.
  const far: IAutoMovieHumanLimbGoal = motionHumanElbowPlace(
    body,
    standing,
    "left",
    { ...goal, point: AutoMovieEngineVector3.add(shoulder, { x: 0, y: 0, z: 2 }) },
    up,
  );
  TestValidator.predicate(
    "past reach, the elbow on the line",
    nclose(
      AutoMovieEngineVector3.distance(
        far.bend,
        AutoMovieEngineVector3.add(shoulder, { x: 0, y: 0, z: body.measure.upperArm }),
      ),
      0,
      1e-3,
    ),
  );

  // 3. The pole.
  const elbow: IAutoMovieVector3 = bones.get("leftLowerArm")!.worldPosition;
  const wrist: IAutoMovieVector3 = bones.get("leftHand")!.worldPosition;
  const pole: IAutoMovieVector3 = motionHumanElbowPole(
    body,
    standing,
    "leftLowerArm",
    "leftHand",
    wrist,
    elbow,
  );
  const flexed: IAutoMovieVector3 = poseBones(
    body,
    resolveHumanPosture(body, {
      ...standing,
      joints: { leftLowerArm: [motionHumanElbowPole.FLEX, 0, 0] },
    }),
  ).get("leftHand")!.worldPosition;
  TestValidator.predicate(
    "the pole out along the olecranon",
    nclose(
      AutoMovieEngineVector3.distance(pole, elbow),
      motionHumanElbowPole.POLE * AutoMovieEngineVector3.distance(wrist, elbow),
      ROUNDING,
    ) &&
      AutoMovieEngineVector3.dot(
        AutoMovieEngineVector3.subtract(pole, elbow),
        AutoMovieEngineVector3.subtract(flexed, wrist),
      ) < 0,
  );
}
