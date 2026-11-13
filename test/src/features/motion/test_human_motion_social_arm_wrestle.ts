import { Quaternion } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  HumanSignature,
  HumanSocial,
  type IHumanBody,
  armWrestle,
  seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Two people arm wrestle across a table (#3350): the elbows stay on the
 * table's top, the hands meet over it, and the declared winner pins the
 * other.
 *
 * The average man (a) and the small woman (b) sit face to face, each on a
 * seat at their own popliteal height, their roots 0.45 m apart, so their
 * hips are about 0.65 m apart (first pass: the legs under the table are not
 * arranged, and nothing here reads them); the table's
 * top is 0.27 m above the average man's seat (provisional: a table's top
 * above a chair's seat) and the clasp stands over a point 0.275 m from the average
 * man's root and 0.175 m from the small woman's, each as far from the table
 * as their arm is long. a is declared the winner; the struggle is cut to 1 s.
 *
 * Scenarios:
 * 1. A pin of 85 degrees from upright is refused on the pin with the largest
 *    angle the arms hold with their elbows in place, at least 30 degrees
 *    (provisional); the contest plans at that angle, and both roles' `go`
 *    and `pin` fall on the same second within one 24 Hz frame.
 * 2. At `go` and at `pin` each right elbow joint stands within 30 mm above
 *    or below the table's top (provisional: the joint centre lies inside
 *    the arm, about its half thickness above the surface it rests on).
 * 3. At `go` the two wrists lie within 0.12 m of each other, a clasp's
 *    width (provisional), and at least 0.1 m above the table.
 * 4. At `pin` the loser's wrist stands above the table by its height at
 *    `go` turned through the pin's angle, within 30 mm, and to the winner's
 *    left of the table's point by at least half of what that turn gives.
 * 5. Each pelvis stays within 10 mm of where sitting left it, at `pin` (the
 *    campaign's bound for a supported body, #3358).
 *
 * 6. At `pin` the loser's chest faces at least 5 degrees further toward the
 *    pin's side than at `go` (provisional size): the trunk rolls with the
 *    arm.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Seats two performers, joins them through the public mutual join and reads displayed joints; elbows off the table, hands apart, a pin to the wrong side or a body that leaves its seat fails.
 * @evidence contracts/development/testing.md#independent-expectations The winner and the side of the pin are what arm wrestling is; the 10 mm and the frame are the campaign's; the other bounds are provisional and stated as such.
 * @evidence contracts/development/testing.md#distinguishing-cases Two statures, the two decisive instants, the winner's and the loser's side.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one two-person performance read at two instants; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the stage and the 6 scenarios with their bounds.
 */
export function test_human_motion_social_arm_wrestle(): void {
  const bodies: Record<"a" | "b", IHumanBody> = {
    a: motionHumanBody("m-average"),
    b: motionHumanBody("f-small"),
  };
  const apart: number = 0.45;
  const top: number = seated.popliteal(bodies.a) + 0.27;
  const table: IAutoMovieVector3 = { x: 0, y: top, z: 0.275 };
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(0);
  const sits = (who: "a" | "b"): HumanChain => {
    const behind: number = bodies[who].rest.get("leftFoot")!.z - 0.1;
    return HumanChain.subject(who).sit({
      seat: {
        at: {
          x: 0,
          y: seated.popliteal(bodies[who]),
          z: who === "a" ? behind : apart - behind,
        },
        yaw: who === "a" ? 0 : 180,
        depth: 0.45,
      },
    });
  };

  const build = (pin: number): HumanPerformance =>
    new HumanPerformance({
      seed: "wrestle",
      laws: [armWrestle],
      performers: (["a", "b"] as const).map((subject: "a" | "b") => ({
        subject,
        body: bodies[subject],
        at: { x: 0, y: 0, z: subject === "a" ? 0 : apart },
        yaw: subject === "a" ? 0 : 180,
        proficiency: { level: "trained" as const },
      })),
      composition: HumanChain.mutual(
        HumanSocial.armWrestle,
        { one: sits("a"), other: sits("b") },
        { table, winner: "one", seconds: 1, pin },
      ).node,
    });

  // 1. A pin past an arm's range is refused with the angle it holds, and
  // the contest plans at that angle.
  let angle: number = 85;
  let performance: HumanPerformance;
  try {
    try {
      performance = build(angle);
      complaints.push(
        "a pin of 85 degrees planned, a refusal on the pin expected",
      );
    } catch (error) {
      if (
        !(error instanceof HumanRefusal) ||
        error.axis !== "pin" ||
        error.feasible?.kind !== "range" ||
        error.feasible.maximum === null
      )
        throw error;
      angle = error.feasible.maximum;
      if (!(angle >= 30))
        complaints.push(
          `a pin of 85 degrees is refused with ${angle} degrees as the most, at least 30 expected (${error.message})`,
        );
      performance = build(angle);
    }
  } catch (error) {
    TestValidator.equals(
      "an arm wrestle across a table plans",
      error instanceof Error ? error.message : String(error),
      "",
    );
    return;
  }
  const readers: Record<"a" | "b", HumanSignature.IReader> = {
    a: HumanSignature.of(performance, "a", bodies.a, 0),
    b: HumanSignature.of(performance, "b", bodies.b, 0),
  };
  const instant = (who: "a" | "b", event: string): number => {
    const placed: HumanSegment.ISegment = performance.segments(who)[1]!;
    return (
      placed.start +
      (placed.plan.events.find((e): boolean => e.name === event)?.share ??
        NaN) *
        placed.plan.duration
    );
  };
  for (const event of ["go", "pin"] as const)
    if (!(Math.abs(instant("a", event) - instant("b", event)) <= 1 / 24))
      complaints.push(
        `${event}: the two roles reach it at ${instant("a", event).toFixed(3)} and ${instant("b", event).toFixed(3)} s, one 24 Hz frame apart at most expected`,
      );
  const go: number = instant("a", "go");
  const pin: number = instant("a", "pin");
  const wrist = (who: "a" | "b", seconds: number): IAutoMovieVector3 =>
    HumanSignature.joint(readers[who], seconds, "rightHand");

  // 2. The elbows on the table.
  for (const [label, seconds] of [
    ["go", go],
    ["pin", pin],
  ] as const)
    for (const who of ["a", "b"] as const) {
      const off: number =
        HumanSignature.joint(readers[who], seconds, "rightLowerArm").y - top;
      if (!(Math.abs(off) <= 0.03))
        complaints.push(
          `${who} at ${label}: the elbow joint stands ${mm(off)} mm above the table's top, within 30 mm either way expected (displayed: shoulder to elbow ${mm(Math.hypot(...(["x", "y", "z"] as const).map((k: "x" | "y" | "z"): number => HumanSignature.joint(readers[who], seconds, "rightUpperArm")[k] - HumanSignature.joint(readers[who], seconds, "rightLowerArm")[k])))} mm, the shoulder ${mm(HumanSignature.joint(readers[who], seconds, "rightUpperArm").y - top)} mm and the wrist ${mm(wrist(who, seconds).y - top)} mm above the top)`,
        );
    }

  // 3. The hands together over the table.
  const hands: number = Math.hypot(
    wrist("a", go).x - wrist("b", go).x,
    wrist("a", go).y - wrist("b", go).y,
    wrist("a", go).z - wrist("b", go).z,
  );
  if (!(hands <= 0.12))
    complaints.push(
      `go: the two wrists lie ${mm(hands)} mm apart, within 120 mm expected`,
    );
  for (const who of ["a", "b"] as const)
    if (!(wrist(who, go).y - top >= 0.1))
      complaints.push(
        `${who} at go: the wrist stands ${mm(wrist(who, go).y - top)} mm above the table, at least 100 mm expected`,
      );

  // 4. The loser pinned to the winner's left: a faces +Z, so his left is +X.
  const fallen: IAutoMovieVector3 = wrist("b", pin);
  const stood: number = wrist("b", go).y - top;
  const radians: number = (angle * Math.PI) / 180;
  if (!(Math.abs(fallen.y - top - stood * Math.cos(radians)) <= 0.03))
    complaints.push(
      `pin: the loser's wrist stands ${mm(fallen.y - top)} mm above the table, its ${mm(stood)} mm at go turned ${angle} degrees, ${mm(stood * Math.cos(radians))} mm, within 30 mm expected`,
    );
  if (!(fallen.x - table.x >= 0.5 * stood * Math.sin(radians)))
    complaints.push(
      `pin: the loser's wrist lies ${mm(fallen.x - table.x)} mm to the winner's left of the table's point, at least ${mm(0.5 * stood * Math.sin(radians))} mm expected`,
    );

  // 6. The loser's chest turns toward the pin's side, +X.
  const faces = (seconds: number): number =>
    Quaternion.rotateVector(
      performance.bones("b", seconds).get("chest")!.worldRotation,
      { x: 0, y: 0, z: 1 },
    ).x;
  if (!(faces(pin) - faces(go) >= Math.sin((5 * Math.PI) / 180)))
    complaints.push(
      `pin: the loser's chest faces ${(faces(pin) - faces(go)).toFixed(3)} further toward the pin's side than at go, as the sine of its turn, at least ${Math.sin((5 * Math.PI) / 180).toFixed(3)} (5 degrees) expected`,
    );

  // 5. Still seated.
  for (const who of ["a", "b"] as const) {
    const sat: number = performance.segments(who)[0]!.end;
    const hips: IAutoMovieVector3 = HumanSignature.joint(
      readers[who],
      pin,
      "hips",
    );
    const left: IAutoMovieVector3 = HumanSignature.joint(
      readers[who],
      sat,
      "hips",
    );
    const moved: number = Math.hypot(
      hips.x - left.x,
      hips.y - left.y,
      hips.z - left.z,
    );
    if (!(moved <= 0.01))
      complaints.push(
        `${who} at pin: the pelvis is ${mm(moved)} mm from where sitting left it, within 10 mm expected`,
      );
  }
  TestValidator.equals("an arm wrestle across a table", complaints, []);
}
