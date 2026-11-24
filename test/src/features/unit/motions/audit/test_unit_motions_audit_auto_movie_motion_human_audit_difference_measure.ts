import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditDifference,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanAuditDifference } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/** Rounding of a few sums, metres. */
const ROUNDING: number = 1e-12;

/**
 * `AutoMovieMotionHumanAuditDifference.measure` reads the largest distance
 * between the same joint centre of two motions at the same second over the
 * shorter one's length, and the difference of their lengths; with `mirror` the
 * second motion is reflected in the plane `x = mirror` and its left bones are
 * read against the first one's right ones.
 *
 * Scenarios, a person whose hips stand at (0, 1, 0) and whose hands hang 0.2 m
 * either side and rise 0.1 m a second, over 2 s:
 *
 * 1. Against itself the distance is 0.
 * 2. Against a 1.5 s copy whose left hand stands 0.1 m higher, the distance is
 *    0.1 on the left hand, first at 0 s, and the lengths differ by 0.5 s.
 * 3. Against its mirror image about x = 0.5, read with `mirror: 0.5`, it is 0;
 *    read without the mirror, every joint lies 1 m off in x (the hips at 1, the
 *    left hand at 1.2 against 0.2).
 * 4. A second motion without a hand is refused.
 */
export function test_unit_motions_audit_auto_movie_motion_human_audit_difference_measure(): void {
  const place = (
    name: AutoMovieHumanoidBone,
    at: IAutoMovieVector3,
  ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [
    name,
    {
      bone: name,
      localRotation: Quaternion.identity(),
      worldPosition: at,
      worldRotation: Quaternion.identity(),
    },
  ];
  const person = (
    duration: number,
    lift: number,
    mirror: number | null,
    hands: boolean = true,
  ): IAutoMovieMotionHumanAuditMotion => ({
    duration,
    segments: () => [],
    bones: (_subject: string, t: number) => {
      const x = (v: number): number => (mirror === null ? v : 2 * mirror - v);
      const y: number = 1 + 0.1 * t;
      return new Map([
        place("hips", { x: x(0), y: 1, z: 0 }),
        ...(hands
          ? [
              place(mirror === null ? "leftHand" : "rightHand", {
                x: x(0.2),
                y: y + lift,
                z: 0,
              }),
              place(mirror === null ? "rightHand" : "leftHand", {
                x: x(-0.2),
                y,
                z: 0,
              }),
            ]
          : []),
      ]);
    },
  });
  const first: IAutoMovieMotionHumanAuditMotion = person(2, 0, null);
  const same: IAutoMovieMotionHumanAuditDifference.IResult =
    AutoMovieMotionHumanAuditDifference.measure(first, first, "a");
  TestValidator.predicate(
    "against itself",
    same.distance.value === 0 && same.duration === 0,
  );
  const raised: IAutoMovieMotionHumanAuditDifference.IResult =
    AutoMovieMotionHumanAuditDifference.measure(
      first,
      person(1.5, 0.1, null),
      "a",
    );
  TestValidator.predicate(
    "a raised hand",
    nclose(raised.distance.value, 0.1, ROUNDING) &&
      raised.distance.where === "leftHand" &&
      raised.distance.seconds === 0 &&
      nclose(raised.duration, 0.5, ROUNDING),
  );
  const mirrored: IAutoMovieMotionHumanAuditMotion = person(2, 0, 0.5);
  TestValidator.predicate(
    "the mirror image",
    nclose(
      AutoMovieMotionHumanAuditDifference.measure(first, mirrored, "a", {
        mirror: 0.5,
        other: "b",
      }).distance.value,
      0,
      ROUNDING,
    ) &&
      nclose(
        AutoMovieMotionHumanAuditDifference.measure(first, mirrored, "a", {
          rate: 4,
        }).distance.value,
        1,
        ROUNDING,
      ),
  );
  TestValidator.predicate(
    "a missing hand",
    throwsError(() =>
      AutoMovieMotionHumanAuditDifference.measure(
        first,
        person(2, 0, null, false),
        "a",
      ),
    ),
  );
}
