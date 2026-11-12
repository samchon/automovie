import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditDifference,
  type IAutoMovieMotionHumanAuditMotion,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionAuditPoints } from "../internal/motionAuditPoints";

/**
 * The difference of two motions, the measure behind determinism, seed
 * sensitivity and left and right symmetry.
 *
 * The first motion lasts 1 s: a hip at the origin's height, a left hand that
 * travels outward on `x = 0.3 + 0.1 t` at `(y, z) = (1, 0.2)` and a right
 * hand resting at `(-0.2, 1.1, 0)`.
 *
 * Scenarios:
 * 1. Against itself the distance is zero at `none` and the lengths agree.
 * 2. Against a copy whose right hand drifts away by `(0.03, 0.04, 0) t`, the
 *    distance is the drift's length at the end: 50 mm at 1 s, on the right
 *    hand.
 * 3. Against its mirror image in the plane `x = 0` (sides exchanged, x
 *    negated), read with `mirror: 0`, the distance is zero.
 * 4. Against its mirror image in the plane `x = 0.5` the distance is zero
 *    with `mirror: 0.5`, and exactly 1 m with `mirror: 0`: reflecting in the
 *    wrong plane leaves every joint twice the planes' distance away.
 * 5. Against itself with `mirror: 0` the motion shows its own asymmetry:
 *    the left hand and the reflected right hand are `(0.1 + 0.1 t, 0.1,
 *    0.2)` apart, 300 mm at 1 s.
 * 6. Against a copy that lasts 1.5 s and departs only after 1 s, the
 *    distance is zero (both are read while both last) and the lengths differ
 *    by 0.5 s.
 * 7. A second motion without the first one's right hand is refused.
 * 8. `other` reads the second motion's person by another name: a film whose
 *    person `b` stands 0.25 m beside person `a` reads 250 mm.
 * 9. A departure of 100 mm that lasts from 0.015 to 0.035 s falls between
 *    the 24 Hz frames and is read at 100 Hz.
 * 10. `opposite` exchanges left and right and keeps the midline.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public measure on two written films; a reflection that forgets to exchange sides or to move the plane, a longer film read past the shorter, or a skipped missing bone fails.
 * @evidence contracts/development/testing.md#independent-expectations Every distance is the length of a written offset, and each mirror image is written by hand, not produced by the measure.
 * @evidence contracts/development/testing.md#distinguishing-cases Equal, shifted, mirrored in two planes, asymmetric, unequal lengths, a missing bone, another subject and another grid.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on hand-made joint centres. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the film and lists the 10 scenarios with their numbers.
 */
export function test_motion_audit_difference(): void {
  type Points = Partial<Record<AutoMovieHumanoidBone, IAutoMovieVector3>>;
  const film = (
    duration: number,
    points: (seconds: number) => Points,
  ): IAutoMovieMotionHumanAuditMotion => motionAuditPoints(duration, points);
  const first = (t: number): Points => ({
    hips: { x: 0, y: 1, z: 0 },
    leftHand: { x: 0.3 + 0.1 * t, y: 1, z: 0.2 },
    rightHand: { x: -0.2, y: 1.1, z: 0 },
  });
  const mirrored =
    (plane: number): ((seconds: number) => Points) =>
    (t: number): Points => ({
      hips: { x: 2 * plane, y: 1, z: 0 },
      rightHand: { x: 2 * plane - (0.3 + 0.1 * t), y: 1, z: 0.2 },
      leftHand: { x: 2 * plane + 0.2, y: 1.1, z: 0 },
    });
  const measure = AutoMovieMotionHumanAuditDifference.measure;
  const a: IAutoMovieMotionHumanAuditMotion = film(1, first);

  const same: AutoMovieMotionHumanAuditDifference.IResult = measure(a, a, "a");
  TestValidator.predicate(
    "a motion does not differ from itself",
    same.distance.value === 0 &&
      same.distance.where === "none" &&
      same.duration === 0,
  );

  const drifted: AutoMovieMotionHumanAuditDifference.IResult = measure(
    a,
    film(
      1,
      (t: number): Points => ({
        ...first(t),
        rightHand: { x: -0.2 + 0.03 * t, y: 1.1 + 0.04 * t, z: 0 },
      }),
    ),
    "a",
  );
  TestValidator.predicate(
    "a drift is its length at the end",
    Math.abs(drifted.distance.value - 0.05) <= 1e-9 &&
      Math.abs(drifted.distance.seconds - 1) <= 1e-9 &&
      drifted.distance.where === "rightHand",
  );

  TestValidator.predicate(
    "a mirror image in the midline does not differ",
    measure(a, film(1, mirrored(0)), "a", { mirror: 0 }).distance.value <=
      1e-12,
  );
  TestValidator.predicate(
    "a mirror image in another plane does not differ in that plane",
    measure(a, film(1, mirrored(0.5)), "a", { mirror: 0.5 }).distance.value <=
      1e-12,
  );
  TestValidator.predicate(
    "the wrong plane leaves every joint twice the planes' distance away",
    Math.abs(
      measure(a, film(1, mirrored(0.5)), "a", { mirror: 0 }).distance.value - 1,
    ) <= 1e-12,
  );

  const own: AutoMovieMotionHumanAuditDifference.IResult = measure(a, a, "a", {
    mirror: 0,
  });
  TestValidator.predicate(
    "an asymmetric motion differs from its own mirror image",
    Math.abs(own.distance.value - Math.hypot(0.2, 0.1, 0.2)) <= 1e-9 &&
      Math.abs(own.distance.seconds - 1) <= 1e-9 &&
      (own.distance.where === "leftHand" || own.distance.where === "rightHand"),
  );

  const longer: AutoMovieMotionHumanAuditDifference.IResult = measure(
    a,
    film(
      1.5,
      (t: number): Points => ({
        ...first(Math.min(t, 1)),
        hips: { x: 0, y: 1 + Math.max(0, t - 1), z: 0 },
      }),
    ),
    "a",
  );
  TestValidator.predicate(
    "two motions are read while both last",
    longer.distance.value === 0 && Math.abs(longer.duration - 0.5) <= 1e-12,
  );

  TestValidator.error("a missing bone is refused", (): void => {
    measure(
      a,
      film(
        1,
        (t: number): Points => ({
          hips: first(t).hips!,
          leftHand: first(t).leftHand!,
        }),
      ),
      "a",
    );
  });

  const two: IAutoMovieMotionHumanAuditMotion = {
    duration: 1,
    segments: (): readonly IAutoMovieMotionHumanAuditMotion.ISpan[] => [],
    bones: (
      subject: string,
      seconds: number,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      const out: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
      for (const [bone, resolved] of a.bones("a", seconds))
        out.set(bone, {
          ...resolved,
          worldPosition: {
            ...resolved.worldPosition,
            x: resolved.worldPosition.x + (subject === "b" ? 0.25 : 0),
          },
        });
      return out;
    },
  };
  TestValidator.predicate(
    "another person of the second motion is read by name",
    Math.abs(measure(two, two, "a", { other: "b" }).distance.value - 0.25) <=
      1e-12 && measure(two, two, "a").distance.value === 0,
  );

  const blip: IAutoMovieMotionHumanAuditMotion = film(
    1,
    (t: number): Points => ({
      ...first(t),
      hips: { x: 0, y: t > 0.015 && t < 0.035 ? 1.1 : 1, z: 0 },
    }),
  );
  TestValidator.predicate(
    "a departure between frames is read on a finer grid",
    measure(a, blip, "a").distance.value === 0 &&
      Math.abs(measure(a, blip, "a", { rate: 100 }).distance.value - 0.1) <=
        1e-12,
  );

  const opposite = AutoMovieMotionHumanAuditDifference.opposite;
  TestValidator.equals("left to right", opposite("leftHand"), "rightHand");
  TestValidator.equals(
    "right to left",
    opposite("rightUpperLeg"),
    "leftUpperLeg",
  );
  TestValidator.equals(
    "a finger keeps its name",
    opposite("leftThumbProximal"),
    "rightThumbProximal",
  );
  TestValidator.equals("the midline stays", opposite("hips"), "hips");
}
