import { createBall, createRacket } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSwing,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/**
 * A moving tennis racket overlaps the displayed ball at its contact marker.
 *
 * Scenarios:
 * 1. Resolve the ball centre from its live object transform at contact.
 * 2. Bring that point into the racket frame and compare it with the string bed dimensions and 60 mm plane allowance.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A moving tennis racket overlaps the displayed ball at its contact marker.
 * @evidence contracts/development/testing.md#independent-expectations Resolve the ball centre from its live object transform at contact.
 * @evidence contracts/development/testing.md#distinguishing-cases Bring that point into the racket frame and compare it with the string bed dimensions and 60 mm plane allowance.
 * @evidence contracts/development/testing.md#execution-ownership Reads public runtime results in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the measured phases and coordinate frames.
 */
export function test_motion_contact_equipment_marker(): void {
  const racket: ReturnType<typeof createRacket> = createRacket({
    kind: "tennis",
  });
  const tennis: ReturnType<typeof createBall> = createBall({ kind: "tennis" });
  const sweet: IAutoMovieVector3 =
    racket.affordance("sweetSpot").frame.translation;
  const head: Readonly<IRacketHead> = {
    length: racket.dimensions.headLength!,
    width: racket.dimensions.headWidth!,
  };
  const tennisCentre: IAutoMovieVector3 =
    tennis.affordance("grip").frame.translation;
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(0);
  const contact = (
    film: IAutoMovieMotionHumanPerformance,
    row: string,
  ): number => {
    const act: IAutoMovieMotionHumanSegment = film
      .segments("a")
      .find((s: IAutoMovieMotionHumanSegment): boolean => s.name === row)!;
    return act.start + (act.plan.contact ?? Number.NaN);
  };
  for (const name of ["m-average"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
    const performer: IAutoMovieMotionHumanPerformance.IInput["performers"][number] =
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      };

    // 1. The forehand.
    try {
      const ballAt: IAutoMovieVector3 = {
        x: -0.35 * stature,
        y: 0.5 * stature,
        z: 0.45 * stature,
      };
      const film: IAutoMovieMotionHumanPerformance = new HumanPerformance({
        seed: "forehand",
        laws: [AutoMovieMotionHumanSwing.HumanSportSwing.forehand],
        performers: [performer],
        props: [
          HumanObject.prop("racket", racket, {
            position: {
              x: -0.1 * stature,
              y: 0.6 * stature,
              z: 0.18 * stature,
            },
            rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
          }),
          HumanObject.prop("ball", tennis, {
            position: Vector3.subtract(ballAt, tennisCentre),
            rotation: Quaternion.identity(),
          }),
        ],
        composition: HumanChain.subject("a")
          .stand({ hold: 0.3 })
          .pickUp({
            prop: "racket",
            handle: "grip",
            use: { tip: "sweetSpot", line: "oblique" },
          })
          .registered("forehand", {
            blade: "racket",
            tip: "sweetSpot",
            edge: "face",
            target: { kind: "prop", subject: "ball", point: "grip" },
          }).node,
      });
      const at: number = contact(film, "forehand");
      const frame: IAutoMovieRigidTransform = film.prop("racket", at);
      // The ball's centre in the racket's own frame.
      const local: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(frame.rotation),
        Vector3.subtract(
          Vector3.add(
            film.prop("ball", contact(film, "forehand")).position,
            Quaternion.rotateVector(
              film.prop("ball", contact(film, "forehand")).rotation,
              tennisCentre,
            ),
          ),
          frame.position,
        ),
      );
      const along: number = local.y - sweet.y;
      if (
        !(
          Math.abs(along) <= head.length / 2 &&
          Math.abs(local.x) <= head.width / 2 &&
          Math.abs(local.z) <= 0.06
        )
      )
        complaints.push(
          `${name} forehand: at the contact the ball's centre lies ${mm(along)} mm along the racket from the sweet spot (the head ${mm(head.length / 2)} mm either way), ${mm(local.x)} mm across (${mm(head.width / 2)} mm) and ${mm(local.z)} mm off the face's plane (60 mm)`,
        );
    } catch (error) {
      complaints.push(
        `${name} forehand: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  TestValidator.equals(
    "the displayed ball overlaps the racket head at the declared marker",
    complaints,
    [],
  );
}

/** Measured size of the physical string bed. */
interface IRacketHead {
  length: number;
  width: number;
}
