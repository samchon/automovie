import { createBall, createGlove } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  quaternionFromAutoMovieBasis,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieComposition,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanThrowCatch,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * A worn glove receives a moving baseball at its displayed pocket.
 *
 * Scenarios:
 * 1. Resolve the displayed ball centre and glove pocket at the same event. Compare their separation with the ball radius to 25 mm.
 * 2. Compare the bare hand and the gloved hand, then request the unworn glove on the opposite side.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A worn glove receives a moving baseball at its displayed pocket.
 * @evidence contracts/development/testing.md#independent-expectations Resolve the displayed ball centre and glove pocket at the same event. Compare their separation with the ball radius to 25 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Compare the bare hand and the gloved hand, then request the unworn glove on the opposite side.
 * @evidence contracts/development/testing.md#execution-ownership Reads public runtime results in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the measured phases and coordinate frames.
 */
export function test_motion_prehension_worn_pocket(): void {
  const ball: ReturnType<typeof createBall> = createBall({ kind: "baseball" });
  const glove: ReturnType<typeof createGlove> = createGlove({
    kind: "fielder",
  });
  const radius: number = ball.affordance("grip").aperture! / 2;
  const thrower: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const distance: number = 2.5;
  // Worn on the left hand: the glove's fingers (+Z) along the hand's (+X at
  // rest), its pocket (+Y) on the palm's side (-Y at rest), its wrist
  // opening at the wrist.
  const turn: IAutoMovieQuaternion = quaternionFromAutoMovieBasis(
    { x: 0, y: 0, z: 1 },
    { x: 0, y: -1, z: 0 },
    { x: 1, y: 0, z: 0 },
  );
  const worn: IAutoMovieRigidTransform = {
    position: Vector3.scale(
      Quaternion.rotateVector(turn, glove.affordance("hand").frame.translation),
      -1,
    ),
    rotation: turn,
  };
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  for (const name of ["m-average"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const at: IAutoMovieVector3 = {
      x: 0,
      y: body.measure.chestHeight,
      z:
        distance -
        AutoMovieMotionHumanThrowCatch.catchObject.REACH *
          (body.measure.upperArm + body.measure.forearm),
    };
    const perform = (
      side: AutoMovieHumanSide,
      gloved: boolean,
    ): IAutoMovieMotionHumanPerformance => {
      const composition: IAutoMovieComposition = {
        kind: "parallel",
        parts: [
          HumanChain.subject("a").act(
            "throwObject",
            {
              target: { kind: "point", at, frame: "world" },
              style: "toss",
              prop: "ball",
            },
            "throw",
          ).node,
          HumanChain.subject("b").catchObject({
            partner: "throw",
            ball: "ball",
            hands: "one",
            hand: side,
            ...(gloved ? { glove: "glove" } : {}),
          }).node,
        ],
      };
      return new HumanPerformance({
        seed: "catch",
        laws: [],
        props: [
          // The opening grip preserves the ball centre from its initial frame.
          {
            ...HumanObject.prop("ball", ball, {
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
            }),
            worn: {
              subject: "a",
              bone: "rightHand",
              offset: {
                position: HumanHand.offset(thrower, "right", "grip").point,
                rotation: { x: 0, y: 0, z: 0, w: 1 },
              },
            },
          },
          {
            ...HumanObject.prop("glove", glove, {
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
            }),
            worn: { subject: "b", bone: "leftHand", offset: worn },
          },
        ],
        performers: [
          {
            subject: "a",
            body: thrower,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          {
            subject: "b",
            body,
            at: { x: 0, y: 0, z: distance },
            yaw: 180,
            proficiency: { level: "trained" },
          },
        ],
        composition,
      });
    };
    const contact = (film: IAutoMovieMotionHumanPerformance): IMeeting => {
      const act: IAutoMovieMotionHumanSegment = film.segments("b")[0]!;
      const local: number = act.plan.contact ?? Number.NaN;
      return {
        at: act.start + local,
        centre: film.prop("ball", act.start + local).position,
      };
    };
    const palm = (
      film: IAutoMovieMotionHumanPerformance,
      seconds: number,
    ): number => {
      const hand: IAutoMovieVector3 = film
        .bones("b", seconds)
        .get("leftHand")!.worldPosition;
      return Vector3.length(Vector3.subtract(hand, contact(film).centre));
    };

    // 1. The gloved catch meets the ball with the pocket.
    let gloved: OptionalPerformance;
    try {
      gloved = perform("left", true);
      const meet: IMeeting = contact(gloved);
      const frame: IAutoMovieRigidTransform = gloved.prop("glove", meet.at);
      const pocket: IAutoMovieVector3 = Vector3.add(
        frame.position,
        Quaternion.rotateVector(
          frame.rotation,
          glove.affordance("pocket").frame.translation,
        ),
      );
      const off: number = Math.abs(
        Vector3.length(Vector3.subtract(pocket, meet.centre)) - radius,
      );
      if (!(off <= 0.025))
        complaints.push(
          `${name}: at the gloved contact the pocket lies ${mm(off)} mm off the ball's surface, within 25 mm expected`,
        );
    } catch (error) {
      complaints.push(
        `${name} gloved: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 2. Bare-handed, the hand meets the ball nearer by the pocket's depth.
    try {
      const bare: IAutoMovieMotionHumanPerformance = perform("left", false);
      if (gloved !== undefined) {
        const depth: number =
          palm(gloved, contact(gloved).at) - palm(bare, contact(bare).at);
        if (!(depth > 0))
          complaints.push(
            `${name}: the gloved hand stands ${mm(-depth)} mm nearer the ball than the bare one, farther by the pocket's depth expected`,
          );
      }
    } catch (error) {
      complaints.push(
        `${name} bare: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 3. A glove the catching hand does not wear is refused.
    try {
      perform("right", true);
      complaints.push(`${name}: a glove on the other hand was caught with`);
    } catch (error) {
      if (!(error instanceof HumanRefusal) || error.axis !== "glove")
        complaints.push(
          `${name}: the other hand's catch failed with ${error instanceof Error ? error.message : String(error)}, a refusal on glove expected`,
        );
    }
  }
  TestValidator.equals(
    "a ball is caught at its size in the worn glove's pocket",
    complaints,
    [],
  );
}

/** Displayed sphere centre and contact time. */
interface IMeeting {
  at: number;
  centre: IAutoMovieVector3;
}
/** A performance may refuse entry before contact. */
type OptionalPerformance = IAutoMovieMotionHumanPerformance | undefined;
