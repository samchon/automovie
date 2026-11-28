import type { IAutoMovieMotionHumanContactWindow } from "@automovie/interface";
import {
  defendGeometry
} from "../../../../../packages/motions/src/striking/internal/defendGeometry";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * A defence starting at 0.1 s, moving 0.2 s, held to 0.5 s, recovering 0.3 s, 1
 * s in all.
 */
const TIMING = {
  begin: 0.1,
  movement: 0.2,
  hold: 0.5,
  recovery: 0.3,
  duration: 1,
};

/**
 * A defence's geometry (`defendGeometry.weight`, `tilt`, `sideRoll`,
 * `attacked`, `windows`): in over the movement and out over the recovery on
 * minimum-jerk shares; the trunk tilts by the arcsine of the head's
 * displacement over its length; a side roll rolls away from the incoming side;
 * the attacked side is the region's own, the lead's for a central one; and the
 * feet plant throughout, the checking foot only until its release and again at
 * the end.
 *
 * Scenarios:
 *
 * 1. The weight is none at 0.1 s, half at 0.2 s, whole from 0.3 to 0.5 s, half at
 *    0.65 s and none from 0.8 s.
 * 2. A 0.3 m displacement of a 0.6 m trunk tilts 30 degrees; one of the trunk's
 *    whole length is refused.
 * 3. Heading +Z, a strike from the left (+X) rolls -1, from the right 1.
 * 4. The left jaw is struck on the left, the chin on the lead side.
 * 5. Checking with the right, the left plants throughout and the right until the
 *    start and at the end; after a step landing at 0.3 s and released at 0.4 s,
 *    the right plants from 0.3 to 0.4.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies animation envelope, trunk geometry, side selection and contact windows.
 * @evidence contracts/development/testing.md#behavioral-verification Calls geometric helpers for six phase times, normalized headings, center and side targets, and support before and after a step.
 * @evidence contracts/development/testing.md#independent-expectations A 0.3 m displacement over a 0.6 m trunk yields asin(0.5) = 30 degrees. Phase midpoints and authored contact boundaries fix weight and plants.
 */
export function test_motions_striking_defend_geometry(): void {
  const w = (t: number): number => defendGeometry.weight(TIMING, t);
  TestValidator.predicate(
    "the weight",
    nclose(w(0.1), 0, 1e-12) &&
      nclose(w(0.2), 0.5, 1e-12) &&
      nclose(w(0.3), 1, 1e-12) &&
      nclose(w(0.5), 1, 1e-12) &&
      nclose(w(0.65), 0.5, 1e-12) &&
      nclose(w(0.8), 0, 1e-12),
  );
  TestValidator.predicate(
    "the tilt",
    nclose(defendGeometry.tilt(0.3, 0.6), 30, 1e-9) &&
      throwsError(() => defendGeometry.tilt(0.6, 0.6)),
  );
  TestValidator.equals(
    "the side roll and the attacked side",
    [
      defendGeometry.sideRoll(0, { x: 1, y: 0, z: 0 }),
      defendGeometry.sideRoll(0, { x: -1, y: 0, z: 0 }),
      defendGeometry.attacked("jawLeft", "right"),
      defendGeometry.attacked("chin", "right"),
    ],
    [-1, 1, "left", "right"],
  );
  const ground: IAutoMovieMotionHumanContactWindow["support"] = {
    kind: "ground",
  };
  TestValidator.equals("the plants", defendGeometry.windows("right", TIMING), [
    { part: "leftFoot", kind: "plant", from: 0, to: 1, support: ground },
    { part: "rightFoot", kind: "plant", from: 0, to: 0.1, support: ground },
    { part: "rightFoot", kind: "plant", from: 1, to: 1, support: ground },
  ]);
  TestValidator.equals(
    "after a step",
    defendGeometry.windows("right", TIMING, {
      touchdown: { left: 0, right: 0.3 },
      release: 0.4,
      legs: () => ({}),
    })[1],
    { part: "rightFoot", kind: "plant", from: 0.3, to: 0.4, support: ground },
  );
}
