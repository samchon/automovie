import { createExerciseMat } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanWorkout,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";

import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * A performer settles on one knee, approaches the floor, holds a plank, presses
 * once on the same palms and toes, then stands. The first supported frame of
 * the press uses the plank's actual contact locations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the movement, supports, two proportions and refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads from the public film across every action entry, measures the displayed position of each retained support during the press and checks the planned release.
 * @evidence contracts/development/testing.md#independent-expectations Closed ground contacts at the authored transition, measured wrist and toe tolerances, body-relative shoulder excursion and unchanged relaxed wrist offset supply the test's answers.
 * @evidence contracts/development/testing.md#distinguishing-cases A small and large body, a lowered entry, a same-support handback and a misspelled target on an actual prop.
 * @evidence contracts/development/testing.md#execution-ownership Runs two complete authored takes and one refusal through HumanPerformance with no renderer or external state.
 */
export function test_motion_workout_continuous_workout(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const findings: string[] = [];
  const laws = [
    AutoMovieMotionHumanWorkout.HumanSportWorkout.plank,
    AutoMovieMotionHumanWorkout.HumanSportWorkout.pushUp,
  ];
  for (const specimen of ["f-small", "m-large"] as const) {
    try {
      const body = motionHumanBody(specimen);
      const cast = {
        subject: "actor",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" as const },
      };
      const floor = HumanChain.subject(cast.subject)
        .stand({ hold: 0.25 })
        .kneel({ kind: "one", hold: 0.25, rise: false })
        .registered("plank", { hold: 0.3, stay: true });
      const fail = (label: string, observed: unknown): void => {
        findings.push(`${specimen} ${label}: ${JSON.stringify(observed)}`);
      };
      const film = new HumanPerformance({
        seed: "athletics-floor-flow",
        laws,
        props: [],
        performers: [cast],
        composition: floor
          .registered("pushUp", { count: 1 })
          .stand({ hold: 0.25 }).node,
      });
      const read = HumanSignature(film, cast.subject, body, 0);
      const [standing, kneel, plank, press, recover] = film.segments(
        cast.subject,
      );
      if (
        standing?.name !== "stand" ||
        kneel?.name !== "kneel" ||
        plank?.name !== "plank" ||
        press?.name !== "pushUp" ||
        recover?.name !== "stand"
      ) {
        fail(
          "action order",
          film.segments(cast.subject).map((item) => item.name),
        );
        continue;
      }
      const joint = (
        time: number,
        id: AutoMovieHumanoidBone,
      ): IAutoMovieVector3 => HumanSignature.joint(read, time, id);
      const distance = (
        from: number,
        to: number,
        id: AutoMovieHumanoidBone,
      ): number =>
        Vector3.length(Vector3.subtract(joint(from, id), joint(to, id)));
      const contact = (
        segment: IAutoMovieMotionHumanSegment,
        part: IAutoMovieMotionHumanContactWindow["part"],
        share: number,
      ): boolean =>
        segment.plan.contacts.some(
          (window) =>
            window.part === part &&
            window.support.kind === "ground" &&
            window.from <= share &&
            share <= window.to,
        );
      const frame: number = 1 / 120;
      const loweredEntry: number = distance(
        plank.start - frame,
        plank.start + 0.125,
        "hips",
      );
      if (!(loweredEntry < 0.02 && contact(kneel, "rightLowerLeg", 1)))
        fail("plank enters from the held kneel", loweredEntry);
      const workStart: number = press.start;
      const aroundPress: number = distance(
        workStart - frame,
        workStart + 0.125,
        "hips",
      );
      if (!(aroundPress < 0.02))
        fail("press entry pelvis movement", aroundPress);
      const bottom = press.plan.events.find(
        (event) => event.name === "bottom1",
      );
      const release = press.plan.events.find(
        (event) => event.name === "release",
      );
      if (bottom === undefined || release === undefined) {
        fail(
          "press phase names",
          press.plan.events.map((event) => event.name),
        );
        continue;
      }
      const bottomAt: number = press.start + bottom.share * press.plan.duration;
      for (const [part, bone, tolerance] of [
        ["leftHand", "leftHand", 0.01],
        ["rightHand", "rightHand", 0.01],
        ["leftFoot", "leftToes", 0.005],
        ["rightFoot", "rightToes", 0.005],
      ] as const) {
        if (
          !contact(plank, part, 1) ||
          !contact(press, part, 0) ||
          !contact(press, part, bottom.share)
        )
          fail(
            `${part} support through the entry and press`,
            press.plan.contacts,
          );
        for (const time of [workStart + frame, workStart + 0.125, bottomAt]) {
          const slip: number = distance(workStart - frame, time, bone);
          if (!(slip <= tolerance))
            fail(`${bone} slide at ${time.toFixed(3)} s`, slip);
        }
        if (contact(press, part, (release.share + 1) / 2))
          fail(`${part} releases during the rise`, release.share);
      }
      const shoulderDrop: number =
        joint(workStart, "leftUpperArm").y - joint(bottomAt, "leftUpperArm").y;
      if (!(shoulderDrop >= body.measure.upperArm / 2))
        fail("shoulder descent", shoulderDrop);
      const armOffset = (time: number): IAutoMovieVector3 =>
        Vector3.subtract(joint(time, "rightHand"), joint(time, "hips"));
      const quietArms: number = Vector3.length(
        Vector3.subtract(
          armOffset(recover.start - frame),
          armOffset(recover.start + 0.125),
        ),
      );
      if (
        !(
          quietArms < 0.03 &&
          contact(press, "leftFoot", 1) &&
          contact(press, "rightFoot", 1) &&
          contact(recover, "leftFoot", 1) &&
          contact(recover, "rightFoot", 1)
        )
      )
        fail("return to the standing support and arm posture", quietArms);

      if (specimen === "f-small") {
        const mat = HumanObject.prop(
          "mat",
          createExerciseMat({ kind: "yoga" }),
          {
            at: { x: 0, y: 0, z: 3 },
            yaw: 0,
          },
        );
        let refusal: unknown;
        try {
          void new HumanPerformance({
            seed: "athletics-floor-flow",
            laws,
            props: [mat],
            performers: [cast],
            composition: floor.registered("pushUp", {
              count: 1,
              on: { prop: mat.subject, affordance: "missing" },
            }).node,
          });
        } catch (error) {
          refusal = error;
        }
        if (
          !(
            refusal instanceof HumanRefusal &&
            refusal.kind === "parameter" &&
            refusal.axis === "on" &&
            refusal.value === "missing"
          )
        )
          fail("missing support target is refused", String(refusal));
      }
    } catch (error: unknown) {
      checks.check(
        `${String(specimen)}: ${everydayTake.describe(error)}`,
        false,
      );
    }
  }
  checks.equals(
    "continuous floor support and controlled recovery",
    findings,
    [],
  );
  checks.assert("workout continuous workout");
}
