import type { AutoMovieHumanoidRegion } from "@automovie/interface";
import type { touch } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanLawTouch } from "../../features/internal/motionHumanLawTouch";

/**
 * Every touch of a partner moves as it means to and tangles nothing, on the
 * displayed bones of two average men.
 *
 * The rows are the affectionate family's: a pat on the head, a two-finger
 * tap on the shoulder, a stroke of the upper arm and a hand cupping the
 * cheek of a partner facing the performer 0.55 m ahead, and a rub of the
 * upper back of a partner turned away 0.45 m ahead. The partner stands
 * still. Each row is read by `motionHumanLawTouch`; the complaints of every
 * row are gathered before the one assertion.
 *
 * Scenarios, per row:
 * 1. The generic audit of both people over the whole film is clean.
 * 2. Neither elbow of the performer travels more than 80 mm in one 1/24 s
 *    frame.
 * 3. The hand's skin is within 10 mm of the partner's region at the arrival
 *    and at the leave.
 * 4. A pat or a tap comes down its count of times and lifts by half to the
 *    whole of its kind's lift.
 * 5. A stroke or a rub stays on the region and moves on it by half to the
 *    whole of its travel.
 * 6. A hold stays where it arrived within 10 mm.
 * 7. Both hands end within 10 mm of where they began; the unused hand
 *    strays no more than 80 mm.
 * 8. The left hand on the partner's mirrored region mirrors the right
 *    hand's film within 5 mm.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real law beside a standing partner and reads displayed bones and colliders of both; a hand short of the partner, a missing repetition or an elbow that flips fails with its measured number.
 * @evidence contracts/development/testing.md#independent-expectations Contact is the hand's collider on the region's point of the partner's displayed body, the repetitions and amplitudes are the kind's definition, and the mirror is the scene's own symmetry.
 * @evidence contracts/development/testing.md#distinguishing-cases Every kind the family uses, the palm and the fingertips, a partner facing and one turned away, regions from the crown to the back.
 * @evidence contracts/development/testing.md#execution-ownership In memory; named `test_human_` because fitting an arm on a body costs up to a second a frame, so the CI test job leaves it to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States the rows, the partner's place and the 8 scenarios with their bounds.
 */
export function test_human_motion_law_touch_partner(): void {
  const person = (
    region: AutoMovieHumanoidRegion,
  ): { kind: "person"; subject: string; region: AutoMovieHumanoidRegion } => ({
    kind: "person",
    subject: "b",
    region,
  });
  const rows: [string, touch.IParams, boolean][] = [
    ["pat-head", { target: person("crown"), kind: "pat" }, true],
    [
      "tap-shoulder",
      {
        target: person("shoulderLeft"),
        kind: "tap",
        with: "fingertips",
        count: 2,
      },
      true,
    ],
    ["stroke-arm", { target: person("upperArmLeft"), kind: "stroke" }, true],
    ["cup-cheek", { target: person("jawLeft"), kind: "hold" }, true],
    ["rub-back", { target: person("upperBack"), kind: "rub" }, false],
  ];
  const complaints: string[] = [];
  for (const [label, params, facing] of rows)
    complaints.push(
      ...motionHumanLawTouch(label, params, {
        facing,
        gap: facing ? 0.55 : 0.45,
      }),
    );
  TestValidator.equals("every touch of a partner is right", complaints, []);
}
