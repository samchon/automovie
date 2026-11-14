import { createSword } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanBlade,
  HumanChain,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * An exchange of blades between two people is composed of three actions: a
 * cut the author declares parried, the defender's parry of it, and the
 * defender's riposte. The parry's blade meets the attacker's blade at the
 * attack's decisive instant, and the riposte's point finds the attacker.
 *
 * Two blades that meet touch: their centre lines pass within the motion
 * campaign's 15 mm contact bound of each other. Two instants that meet fall
 * in one frame at 24 Hz.
 *
 * One film keeps the test near a minute: each sword is taken for its use
 * once, which costs about 20 s of planning. The average man attacks the
 * small woman, so the cut comes down and the riposte goes up; the order
 * reversed is owed to a second film and is not pinned here.
 *
 * Scenarios, with the average man and the small woman 1.4 m apart (a
 * sword's distance: a thrust needs room before the shoulder), each taking
 * an arming sword:
 * 1. The attacker's descending cut at the defender's left shoulder is
 *    declared parried; the defender's parry names it and is synced by its
 *    `stroke` to the cut's contact. The parry's `stroke` falls within a
 *    frame of the cut's decisive instant.
 * 2. At that instant the two blades' centre lines, from guard to point,
 *    pass within 15 mm of each other.
 * 3. The parried cut stops short: its point stays more than 15 mm from the
 *    shoulder it was aimed at.
 * 4. The defender's riposte follows the parry, and at its decisive instant
 *    its point is within 15 mm of the attacker's sternum.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the two-person performance through the public chain, sync and props and reads the displayed swords; blades that do not meet, a parry off its instant, a parried cut that lands or a riposte that misses fails.
 * @evidence contracts/development/testing.md#independent-expectations The meeting is measured between the two displayed swords' own guard and point contacts; the bounds are the campaign's contact bound and the film's frame; nothing is read from a plan's geometry.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite build, the taller attacking; the attack's outcome, the meeting and the answer are separate assertions. Replay under one seed is the blade seed test's.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one film: each sword is taken for its use once, which is the costly part; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the composition, the bounds and the 4 scenarios.
 */
export function test_human_motion_blade_exchange(): void {
  const FRAME: number = 1 / 24;
  const sword: ReturnType<typeof createSword> = createSword({
    kind: "armingSword",
  });
  const tip: IAutoMovieVector3 = sword.affordance("point").frame.translation;
  const complaints: string[] = [];
  const placed = (
    frame: IHumanProp.IFrame,
    local: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    Vector3.add(frame.position, Quaternion.rotateVector(frame.rotation, local));
  const apart = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Vector3.length(Vector3.subtract(a, b));

  // The least distance between two segments, by sampling both at 5 mm steps.
  const between = (
    a: readonly [IAutoMovieVector3, IAutoMovieVector3],
    b: readonly [IAutoMovieVector3, IAutoMovieVector3],
  ): number => {
    let least: number = Infinity;
    for (let i: number = 0; i <= 200; i++)
      for (let k: number = 0; k <= 200; k++)
        least = Math.min(
          least,
          apart(
            Vector3.lerp(a[0], a[1], i / 200),
            Vector3.lerp(b[0], b[1], k / 200),
          ),
        );
    return least;
  };

  // A sword's distance: nearer, a thrust has no room before the shoulder.
  const APART: number = 1.4;
  for (const names of [["m-average", "f-small"]] as const) {
    const bodies: Record<"a" | "b", IHumanBody> = {
      a: motionHumanBody(names[0]),
      b: motionHumanBody(names[1]),
    };
    const label: string = `${names[0]} attacking ${names[1]}`;
    const stand = (subject: "a" | "b", blade: string): HumanChain =>
      HumanChain.subject(subject)
        .stand({ seconds: 0.3 })
        .pickUp({
          prop: blade,
          handle: "grip",
          use: { tip: "point", line: "oblique" },
        });
    const film: HumanPerformance = new HumanPerformance({
      seed: "exchange",
      laws: Object.values(HumanBlade),
      performers: (["a", "b"] as const).map((subject) => ({
        subject,
        body: bodies[subject],
        at: { x: 0, y: 0, z: subject === "a" ? 0 : APART },
        yaw: subject === "a" ? 0 : 180,
        proficiency: { level: "trained" as const },
      })),
      props: (["a", "b"] as const).map((subject) => {
        // Each sword lies level before its owner's right hand, point ahead.
        const stature: number = bodies[subject].measure.stature;
        const facing: number = subject === "a" ? 1 : -1;
        return HumanObject.prop(`sword-${subject}`, sword, {
          position: {
            x: -0.1 * stature * facing,
            y: 0.6 * stature,
            z: (subject === "a" ? 0 : APART) + 0.18 * stature * facing,
          },
          rotation: Quaternion.multiply(
            Quaternion.fromAxisAngle(
              { x: 0, y: 1, z: 0 },
              subject === "a" ? 0 : 180,
            ),
            Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
          ),
        });
      }),
      composition: stand("a", "sword-a")
        .registered(
          "cut",
          {
            blade: "sword-a",
            target: { kind: "person", subject: "b", region: "shoulderLeft" },
            outcome: "parried",
          },
          "attack",
        )
        .stand({ seconds: 2 })
        .with(
          stand("b", "sword-b")
            .stand({ seconds: 3 })
            .registered("parry", { blade: "sword-b", against: "attack" })
            .sync({ of: "attack", align: "stroke" })
            .registered("riposte", {
              blade: "sword-b",
              target: { kind: "person", subject: "a", region: "sternum" },
            }),
        ).node,
    });
    const named = (subject: string, name: string): HumanSegment.ISegment =>
      film
        .segments(subject)
        .find((s: HumanSegment.ISegment): boolean => s.name === name)!;
    const instant = (segment: HumanSegment.ISegment, event: string): number =>
      segment.start +
      (segment.plan.events.find((e): boolean => e.name === event)?.share ??
        Number.NaN) *
        segment.plan.duration;
    const blade = (
      subject: "a" | "b",
      seconds: number,
    ): readonly [IAutoMovieVector3, IAutoMovieVector3] => {
      const frame: IHumanProp.IFrame = film.prop(`sword-${subject}`, seconds);
      return [frame.position, placed(frame, tip)];
    };
    const region = (
      subject: "a" | "b",
      name: "shoulderLeft" | "sternum",
      seconds: number,
    ): IAutoMovieVector3 =>
      HumanSignature.region(
        HumanSignature.of(film, subject, bodies[subject], 0),
        name,
        seconds,
      );

    // 1. The parry's stroke on the cut's decisive instant.
    const cut: HumanSegment.ISegment = named("a", "cut");
    const parry: HumanSegment.ISegment = named("b", "parry");
    const met: number = cut.start + (cut.plan.contact ?? Number.NaN);
    const closed: number = instant(parry, "stroke");
    if (!(Math.abs(closed - met) <= FRAME))
      complaints.push(
        `${label}: the parry closes at ${closed.toFixed(3)} s, within a frame of the cut's decisive instant at ${met.toFixed(3)} s expected`,
      );

    // 2. The blades meet.
    const gap: number = between(blade("a", met), blade("b", met));
    if (!(gap <= 0.015))
      complaints.push(
        `${label}: at the cut's decisive instant the two blades pass ${(gap * 1000).toFixed(1)} mm apart, 15 mm at most expected`,
      );

    // 3. The parried cut does not land.
    const stopped: number = between(blade("a", met), [
      region("b", "shoulderLeft", met),
      region("b", "shoulderLeft", met),
    ]);
    if (!(stopped > 0.015))
      complaints.push(
        `${label}: the parried cut's blade is ${(stopped * 1000).toFixed(1)} mm from the shoulder it was aimed at, more than 15 mm expected`,
      );

    // 4. The riposte finds the attacker.
    const riposte: HumanSegment.ISegment = named("b", "riposte");
    const struck: number = riposte.start + (riposte.plan.contact ?? Number.NaN);
    const missed: number = apart(
      blade("b", struck)[1],
      region("a", "sternum", struck),
    );
    if (!(missed <= 0.015))
      complaints.push(
        `${label}: the riposte's point is ${(missed * 1000).toFixed(1)} mm from the attacker's sternum at its decisive instant, 15 mm at most expected`,
      );
    if (!(riposte.entryTime >= closed - 1e-6))
      complaints.push(
        `${label}: the riposte begins at ${riposte.entryTime.toFixed(3)} s, before the parry closes at ${closed.toFixed(3)} s`,
      );
  }
  TestValidator.equals("blades meet in an exchange", complaints, []);
}
