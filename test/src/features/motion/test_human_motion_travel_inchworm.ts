import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPerformance, IAutoMovieMotionHumanSegment, IAutoMovieMotionHumanSignature, AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain, HumanPerformance, HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * An inchworm walks the hands out to a plank and the feet in to the hands,
 * and stands up again further on.
 *
 * Scenarios, the average man and the small woman, each doing one cycle
 * from standing:
 * 1. At `plank1`, the body is straight: the hip joints' middle lies within
 *    40 mm of the line from the ankles' middle to the shoulders' (a
 *    provisional reading of the cue "a straight line from the shoulders to
 *    the heels"); and the wrists stand under the shoulders, their middles
 *    apart along the floor by at most a tenth of the arm (the cue "hands
 *    under the shoulders").
 * 2. At `plank1` and at `folded1`, each foot's lowest sole socket lies
 *    within 15 mm of the floor (the campaign's bound for a contact).
 * 3. At `folded1`, the hips are the body's peak: the hip joints' middle
 *    stands at least 0.1 m higher than the shoulders' (a pike).
 * 4. At the end, the body stands again: the hip joints' middle within 30 mm
 *    of its starting height, and the ankles' middle at least 0.3 m further
 *    along the heading than it started (a provisional reading of "it
 *    travels").
 * 5. From `down` to `rising`, at every thirtieth of a second, at least
 *    three of the four limbs bear (a plant window open): one limb moves at
 *    a time.
 * 6. Every limb steps, and each step `<limb>Liftoff<n>` comes before its
 *    `<limb>Touchdown<n>`; a hand touches down by `plank1`, a foot after it
 *    and by `folded1`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the inchworm through the public chain and reads the displayed joints and soles at its events; a bent plank, hands ahead of or behind the shoulders, feet afloat, hips under the shoulders in the fold, or a body that does not travel or stand up again fails.
 * @evidence contracts/development/testing.md#independent-expectations Each check is a cue of the exercise read on the body's own joints, or the campaign's contact bound; the 40 mm, the tenth of the arm and the 0.3 m are provisional readings stated as such.
 * @evidence contracts/development/testing.md#distinguishing-cases The plank, the fold, standing again, the limbs that bear between them and the order of every step, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds two performances in memory, reading four instants of each, the plan's windows at every thirtieth of a second and its events.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 6 scenarios with their bounds.
 */
export function test_human_motion_travel_inchworm(): void {
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    let performance: IAutoMovieMotionHumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "inchworm",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a").crawl({
          kind: "inchworm",
          cycles: 1,
        }).node,
      });
    } catch (error) {
      complaints.push(
        `${name}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      body,
      0,
    );
    const [worm]: readonly IAutoMovieMotionHumanSegment.ISegment[] = performance.segments("a");
    const event = (label: string): number =>
      worm!.start +
      (worm!.plan.events.find(
        (e: { name: string }): boolean => e.name === label,
      )?.share ?? NaN) *
        worm!.plan.duration;
    const middle = (
      t: number,
      bone: "UpperLeg" | "LowerLeg" | "UpperArm" | "Foot" | "Toes" | "Hand",
    ): IAutoMovieVector3 =>
      mid(
        HumanSignature.joint(reader, t, `left${bone}` as AutoMovieHumanoidBone),
        HumanSignature.joint(
          reader,
          t,
          `right${bone}` as AutoMovieHumanoidBone,
        ),
      );

    // The posture at an instant, printed with a finding: the middles of
    // the toes' joints, the ankles, the knees, the hips, the shoulders and the wrists,
    // (z, y) in mm.
    const posture = (t: number): string =>
      (["Toes", "Foot", "LowerLeg", "UpperLeg", "UpperArm", "Hand"] as const)
        .map((bone): string => {
          const p: IAutoMovieVector3 = middle(t, bone);
          return `${bone} (${(p.z * 1000).toFixed(0)}, ${(p.y * 1000).toFixed(0)})`;
        })
        .join(" ");

    // 1. The plank.
    const plank: number = event("plank1");
    const ankles: IAutoMovieVector3 = middle(plank, "Foot");
    const shoulders: IAutoMovieVector3 = middle(plank, "UpperArm");
    const hips: IAutoMovieVector3 = middle(plank, "UpperLeg");
    const bow: number = offLine(ankles, shoulders, hips);
    if (!(bow <= 0.04))
      complaints.push(
        `${name} plank: the hips lie ${(bow * 1000).toFixed(1)} mm off the line from the ankles to the shoulders, at most 40 mm expected; ${posture(plank)}`,
      );
    const wrists: IAutoMovieVector3 = middle(plank, "Hand");
    const arm: number = body.measure.upperArm + body.measure.forearm;
    const under: number = Math.hypot(
      wrists.x - shoulders.x,
      wrists.z - shoulders.z,
    );
    if (!(under <= 0.1 * arm))
      complaints.push(
        `${name} plank: the wrists are ${(under * 1000).toFixed(1)} mm along the floor from under the shoulders, at most ${(100 * arm).toFixed(1)} mm expected`,
      );

    // 2. The feet on the floor.
    const folded: number = event("folded1");
    for (const [what, t] of [
      ["plank", plank],
      ["fold", folded],
    ] as const)
      for (const side of ["left", "right"] as const) {
        const sole: number = HumanSignature.sole(reader, t, side).y;
        if (!(Math.abs(sole) <= 0.015))
          complaints.push(
            `${name} ${what}: the ${side} sole is at ${(sole * 1000).toFixed(1)} mm, within 15 mm of the floor expected; ${posture(t)}; standing ${posture(worm!.start)}; plank ${posture(plank)}`,
          );
      }

    // 3. The fold.
    const peak: number =
      middle(folded, "UpperLeg").y - middle(folded, "UpperArm").y;
    if (!(peak >= 0.1))
      complaints.push(
        `${name} fold: the hips stand ${(peak * 1000).toFixed(1)} mm over the shoulders, at least 100 mm expected`,
      );

    // 4. Standing again, further on.
    const end: number = worm!.end - 1e-3;
    const risen: number =
      middle(end, "UpperLeg").y - middle(worm!.start, "UpperLeg").y;
    if (!(Math.abs(risen) <= 0.03))
      complaints.push(
        `${name} end: the hips stand ${(risen * 1000).toFixed(1)} mm from their starting height, within 30 mm expected`,
      );
    const travelled: number =
      middle(end, "Foot").z - middle(worm!.start, "Foot").z;
    if (!(travelled >= 0.3))
      complaints.push(
        `${name} end: the ankles came ${travelled.toFixed(3)} m along the heading, at least 0.3 m expected`,
      );

    // 5. One limb moves at a time: three bear from the fold to the rise.
    const limbs = ["leftHand", "rightHand", "leftFoot", "rightFoot"] as const;
    const down: number = event("down");
    const rising: number = event("rising");
    for (let t: number = down; t <= rising; t += 1 / 30) {
      const share: number = (t - worm!.start) / worm!.plan.duration;
      const bearing: number = limbs.filter((limb): boolean =>
        worm!.plan.contacts.some(
          (w): boolean =>
            w.part === limb && w.from <= share + 1e-9 && w.to >= share - 1e-9,
        ),
      ).length;
      if (bearing < 3) {
        complaints.push(
          `${name}: ${bearing} limbs bear at ${t.toFixed(3)} s, at least 3 expected between down and rising`,
        );
        break;
      }
    }

    // 6. Each step lifts before it touches down, the hands' steps before
    // the plank and the feet's after it, before the fold.
    for (const limb of limbs) {
      const hand: boolean = limb.endsWith("Hand");
      for (let n: number = 1; ; n++) {
        const off: number = event(`${limb}Liftoff${n}`);
        const on: number = event(`${limb}Touchdown${n}`);
        if (Number.isNaN(off) && Number.isNaN(on)) {
          if (n === 1) complaints.push(`${name}: the ${limb} never steps`);
          break;
        }
        if (
          !(off < on) ||
          (hand ? !(on <= plank + 1e-9) : !(on > plank && on <= folded + 1e-9))
        )
          complaints.push(
            `${name}: the ${limb}'s step ${n} lifts at ${off.toFixed(3)} s and touches down at ${on.toFixed(3)} s, after its lift and ${hand ? "by the plank" : "between the plank and the fold"} (${plank.toFixed(3)}, ${folded.toFixed(3)} s) expected`,
          );
      }
    }
  }
  TestValidator.equals(
    "an inchworm walks out to a plank and in again",
    complaints,
    [],
  );
}

/** The middle of two points. */
function mid(a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
}

/** A point's distance from the line through two others. */
function offLine(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  p: IAutoMovieVector3,
): number {
  const d: IAutoMovieVector3 = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const q: IAutoMovieVector3 = { x: p.x - a.x, y: p.y - a.y, z: p.z - a.z };
  const cross: IAutoMovieVector3 = {
    x: d.y * q.z - d.z * q.y,
    y: d.z * q.x - d.x * q.z,
    z: d.x * q.y - d.y * q.x,
  };
  return Math.hypot(cross.x, cross.y, cross.z) / Math.hypot(d.x, d.y, d.z);
}
