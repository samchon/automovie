import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  crossAnkleOverKnee,
  seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A seated performer rests either ankle across the other knee and sets it
 * back down. The tested geometry follows the ankle-on-knee posture in Jeong
 * et al. (2008), independently of the law's target height and travel curve.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the posture, support retention, and geometry checked in both directions.
 * @evidence contracts/development/testing.md#behavioral-verification Plays the opt-in action after real chair sitting and compares the displayed seat, supporting ankle and raised ankle at contact, hold, release and return.
 * @evidence contracts/development/testing.md#independent-expectations Checks that the ankle is above and horizontally near the opposite knee, the resting foot stays grounded and the seat socket stays in place, without constructing the target or trajectory.
 * @evidence contracts/development/testing.md#distinguishing-cases Opposite raised sides, rest versus recovery, and a standing refusal cover the entry condition and each distinct phase.
 * @evidence contracts/development/testing.md#execution-ownership Performs a registered action through the public chain over an in-memory polygon man.
 */
export function test_human_motion_cross_ankle_over_knee(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const subject: string = "actor";
  const performer: ConstructorParameters<
    typeof HumanPerformance
  >[0]["performers"][number] = {
    body,
    subject,
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
    proficiency: { level: "trained" },
  };
  const chair: IAutoMovieMotionHumanSeated.ISeat = {
    at: {
      x: 0,
      y: seated.popliteal(body),
      z: body.rest.get("leftFoot")!.z - 0.1,
    },
    yaw: 0,
    depth: 0.45,
  };
  const start = (): ReturnType<typeof HumanChain.subject> =>
    HumanChain.subject(subject);

  for (const side of ["right", "left"] as const) {
    const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const performance: HumanPerformance = new HumanPerformance({
      seed: "chair crossing",
      performers: [performer],
      composition: start()
        .sit({ seat: chair })
        .registered("crossAnkleOverKnee", { side, seconds: 1 }).node,
      laws: [crossAnkleOverKnee],
    });
    const crossing: IAutoMovieMotionHumanSegment =
      performance.segments(subject)[1]!;
    const event = (name: string): number =>
      crossing.plan.events.find((entry) => entry.name === name)!.share;
    const contact: number = event("ankleContact");
    const release: number = event("ankleRelease");
    TestValidator.predicate(
      `${side}: the ankle bears for the authored one second`,
      Math.abs((release - contact) * crossing.plan.duration - 1) < 1e-9,
    );
    const middle: number = (contact + release) / 2;
    const sample = (
      share: number,
    ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      performance.bones(
        subject,
        crossing.entryTime + share * crossing.plan.duration,
      );
    const before: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      sample(0);
    const seat = (
      bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    ): IAutoMovieVector3 =>
      resolveAutoMovieHumanoidSurfaces.place(
        body.surfaces.sockets.seat,
        bones.get(body.surfaces.sockets.seat.bone)!,
      ).point;
    const initialSeat: IAutoMovieVector3 = seat(before);
    const initialFoot: IAutoMovieVector3 = before.get(
      `${other}Foot`,
    )!.worldPosition;
    const initialMoving: IAutoMovieVector3 = before.get(
      `${side}Foot`,
    )!.worldPosition;

    const seatContact: IAutoMovieMotionHumanContactWindow | undefined =
      crossing.plan.contacts.find((item) => item.part === "seat");
    const plant: IAutoMovieMotionHumanContactWindow | undefined =
      crossing.plan.contacts.find((item) => item.part === `${other}Foot`);
    TestValidator.predicate(
      `${side}: the seated base and supporting foot retain their established support`,
      crossing.plan.base?.kind === "seated" &&
        crossing.plan.base.seat?.at.y === chair.at.y &&
        seatContact?.from === 0 &&
        seatContact.to === 1 &&
        plant?.kind === "plant" &&
        plant.support.kind === "ground" &&
        plant.from === 0 &&
        plant.to === 1,
    );
    const bearing: IAutoMovieMotionHumanContactWindow | undefined =
      crossing.plan.contacts.find(
        (item) => item.part === `${side}Foot` && item.kind === "bear",
      );
    TestValidator.predicate(
      `${side}: the crossing declares contact with its own other knee during the held phase`,
      bearing?.from === contact &&
        bearing.to === release &&
        bearing.support.kind === "person" &&
        bearing.support.subject === subject &&
        "bone" in bearing.support &&
        bearing.support.bone === `${other}LowerLeg`,
    );
    for (const share of [contact / 2, contact, middle, release, 1]) {
      const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        sample(share);
      TestValidator.predicate(
        `${side}: the seat and grounded foot drift at most 10 mm at ${share}`,
        Vector3.length(Vector3.subtract(initialSeat, seat(bones))) < 0.01 &&
          Vector3.length(
            Vector3.subtract(
              initialFoot,
              bones.get(`${other}Foot`)!.worldPosition,
            ),
          ) < 0.01,
      );
    }
    for (const share of [contact, middle, release]) {
      const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        sample(share);
      const knee: IAutoMovieVector3 = bones.get(
        `${other}LowerLeg`,
      )!.worldPosition;
      const ankle: IAutoMovieVector3 = bones.get(`${side}Foot`)!.worldPosition;
      const raisedKnee: IAutoMovieVector3 = bones.get(
        `${side}LowerLeg`,
      )!.worldPosition;
      TestValidator.predicate(
        `${side}: the raised ankle rests over the carrying knee at ${share}`,
        ankle.y > knee.y + 0.015 &&
          ankle.y < knee.y + 0.15 &&
          Math.hypot(ankle.x - knee.x, ankle.z - knee.z) < 0.035 &&
          Math.abs(raisedKnee.x - knee.x) > 0.12,
      );
    }
    const returned: IAutoMovieVector3 = sample(1).get(
      `${side}Foot`,
    )!.worldPosition;
    TestValidator.predicate(
      `${side}: the lifted foot returns within 10 mm of its original plant`,
      Vector3.length(Vector3.subtract(initialMoving, returned)) < 0.01,
    );
  }

  let refusal: unknown;
  try {
    new HumanPerformance({
      seed: "chair crossing without sitting",
      performers: [performer],
      composition: start().registered("crossAnkleOverKnee", {}).node,
      laws: [crossAnkleOverKnee],
    });
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    "ankle-over-knee crossing refuses a standing entry",
    refusal instanceof HumanRefusal && refusal.axis === "base",
  );
}
