import type { AutoMovieHumanoidRegion } from "@automovie/interface";
import type { touch } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanLawTouch } from "../../features/internal/motionHumanLawTouch";

/**
 * Every touch of the performer's own body moves as it means to and tangles
 * nothing, on the displayed bones of the average man.
 *
 * The rows are the self-directed family's (a belly pat, a nape rub, a
 * forearm scratch, a self hug, hands over the ears, a hand on the heart, a
 * thigh slap, a facepalm, a brow wipe), each performed from quiet standing
 * and read by `motionHumanLawTouch`; the complaints of every row are
 * gathered before the one assertion, so a failing row does not hide the
 * others.
 *
 * Scenarios, per row:
 * 1. The generic audit over the whole film is clean.
 * 2. Neither elbow travels more than 80 mm in one 1/24 s frame.
 * 3. Each hand's skin is within 10 mm of its region at the arrival and at
 *    the leave.
 * 4. A pat comes down its count of times and lifts between a quarter and
 *    half a hand's length.
 * 5. A rub or a scratch stays on its region and moves on it by half to the
 *    whole of its travel.
 * 6. A press, a squeeze or a hold stays where it arrived within 10 mm.
 * 7. Each hand ends within 10 mm of where it began; an unused hand strays
 *    no more than 80 mm.
 * 8. A one-hand row by the left hand on the mirrored region mirrors the
 *    right hand's film within 5 mm.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real law through the chain and reads displayed bones and colliders; a hand short of its region, a missing repetition, an elbow that flips or an arm through the trunk fails with its measured number.
 * @evidence contracts/development/testing.md#independent-expectations Contact is the hand's collider on the region's point of the displayed body, the repetitions and amplitudes are the kind's definition, and the mirror is the body's own symmetry; none is read from the law's goals.
 * @evidence contracts/development/testing.md#distinguishing-cases Lifting, travelling and still kinds; the palm, the fingertips and the hand's back; one hand and two; the trunk, the head, an arm and a leg.
 * @evidence contracts/development/testing.md#execution-ownership In memory; named `test_human_` because fitting an arm on the body costs up to a second a frame, so the CI test job leaves it to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States the rows, how the complaints are gathered and the 8 scenarios with their bounds.
 */
export function test_human_motion_law_touch_self(): void {
  const self = (
    region: AutoMovieHumanoidRegion,
  ): { kind: "self"; region: AutoMovieHumanoidRegion } => ({
    kind: "self",
    region,
  });
  const rows: [string, touch.IParams][] = [
    ["pat-belly", { target: self("abdomen"), kind: "pat" }],
    ["rub-nape", { target: self("nape"), kind: "rub" }],
    [
      "scratch-forearm",
      {
        target: self("forearmLeft"),
        kind: "scratch",
        with: "fingertips",
        count: 4,
      },
    ],
    [
      "hug-self",
      {
        target: self("shoulderLeft"),
        other: self("shoulderRight"),
        kind: "squeeze",
      },
    ],
    [
      "cover-ears",
      { target: self("earRight"), other: self("earLeft"), kind: "press" },
    ],
    ["hand-on-heart", { target: self("chestLeft"), kind: "press" }],
    ["slap-thigh", { target: self("thighFrontRight"), kind: "pat", count: 1 }],
    ["facepalm", { target: self("forehead"), kind: "hold" }],
    [
      "wipe-brow",
      {
        target: self("forehead"),
        kind: "rub",
        with: "handBack",
        count: 1,
        tangent: "across",
      },
    ],
  ];
  const complaints: string[] = [];
  for (const [label, params] of rows)
    complaints.push(...motionHumanLawTouch(label, params));
  TestValidator.equals("every self touch is right", complaints, []);
}
