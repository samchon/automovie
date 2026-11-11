import {
  type AutoMovieMotionHumanTarget,
  AutoMovieMotionHumanVariation,
  AutoMovieMotionHumanVariationForm,
  AutoMovieMotionHumanVariationPlace,
  HumanSkill,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { MOTION_VARIATION_BODIES } from "../internal/MOTION_VARIATION_BODIES";

/**
 * No variation changes nothing and reads no draw.
 *
 * The context's series throws when read, so any draw fails the test.
 *
 * Scenarios:
 * 1. A manner that is absent, empty or states variation 0 builds no source,
 *    and the series is never read.
 * 2. Without a source every slot function returns its input: the place record
 *    and the direction vector as the same object, the amount, the duration,
 *    the pause, the bend and the curvature as the same number, and the strike
 *    point as the region's own point.
 * 3. A variation of -0.1, of 1.5 or not a number throws, and so does a
 *    proficiency of 2.
 * 4. A positive variation builds a source that carries it, and a stated
 *    proficiency replaces the skill's `path` and `timing` axes only.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public source builder and every slot function; a function that copies its input, a default offset, or a draw read without variation fails.
 * @evidence contracts/development/testing.md#independent-expectations Identity is the stated law of the absent source; the refused values are the documented range's outside.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers the three ways a manner states no variation, every slot type that needs no rig, four refusals and the stated proficiency against the performer's own.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on a stub of the measures read and a series that throws. The elbow slot needs a rig and is owned by `test_motion_compose_variation_bounded`. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the throwing series and lists the 4 scenarios.
 */
export function test_motion_compose_variation_identity(): void {
  const skill: HumanSkill.ISkill = HumanSkill.resolve({ p: 0.25 }, "film");
  const context: Parameters<typeof AutoMovieMotionHumanVariation.of>[0] = {
    skill,
    series: (): never => {
      throw new Error("a draw was read");
    },
  };
  TestValidator.predicate(
    "no variation builds no source",
    AutoMovieMotionHumanVariation.of(context, undefined) === undefined &&
      AutoMovieMotionHumanVariation.of(context, {}) === undefined &&
      AutoMovieMotionHumanVariation.of(context, {
        variation: 0,
        proficiency: 1,
      }) === undefined,
  );

  const record: AutoMovieMotionHumanTarget.IDefault = {
    height: 0.72,
    range: 0.8,
    facing: "performer",
  };
  const vector = { x: 0, y: 0, z: 1 };
  TestValidator.predicate(
    "every slot returns its input",
    AutoMovieMotionHumanVariationPlace.vary(
      undefined,
      "place",
      MOTION_VARIATION_BODIES[0]!,
      "left",
      record,
      { distance: 0.6, seconds: 0.3 },
    ) === record &&
      AutoMovieMotionHumanVariation.direction(
        undefined,
        "direction",
        vector,
      ) === vector &&
      AutoMovieMotionHumanVariationForm.amount(undefined, "amount", 0.5) ===
        0.5 &&
      AutoMovieMotionHumanVariation.duration(undefined, "duration", 0.3) ===
        0.3 &&
      AutoMovieMotionHumanVariation.pause(undefined, "pause", 0.4) === 0.4 &&
      AutoMovieMotionHumanVariationForm.bend(undefined, "bend", 0.2) === 0.2 &&
      AutoMovieMotionHumanVariationForm.curvature(
        undefined,
        "curvature",
        0.1,
      ) === 0.1 &&
      AutoMovieMotionHumanVariation.strike(undefined, "strike", {
        radius: 0.1,
        scatter: 0.02,
      }) === AutoMovieMotionHumanVariation.CENTRE,
  );

  for (const variation of [-0.1, 1.5, Number.NaN])
    TestValidator.error(`a variation of ${variation}`, (): unknown =>
      AutoMovieMotionHumanVariation.of(context, { variation }),
    );
  TestValidator.error("a proficiency of 2", (): unknown =>
    AutoMovieMotionHumanVariation.of(context, { variation: 1, proficiency: 2 }),
  );

  const own = AutoMovieMotionHumanVariation.of(context, { variation: 0.5 })!;
  const stated = AutoMovieMotionHumanVariation.of(context, {
    variation: 0.5,
    proficiency: 1,
  })!;
  TestValidator.predicate(
    "a stated proficiency replaces the path and the timing axes",
    own.variation === 0.5 &&
      own.skill === skill &&
      stated.skill.axes.path === 1 &&
      stated.skill.axes.timing === 1 &&
      stated.skill.axes.balance === 0.25 &&
      stated.skill.seed === "film",
  );
}
