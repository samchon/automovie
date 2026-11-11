import { AutoMovieMotionHumanVariation } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { MOTION_VARIATION_BODIES } from "../internal/MOTION_VARIATION_BODIES";
import { motionVariationSource } from "../internal/motionVariationSource";

/**
 * The same seed, performer, action and repeat give the same varied slots.
 *
 * Scenarios:
 * 1. Every slot type that needs no rig is varied from two sources built
 *    separately from the same keys, for repeats 0, 1 and 7; the two results
 *    are equal member by member.
 * 2. Each of those results differs from its input, so the equality is not
 *    the identity of the absent source.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public slot functions on real seeded streams; a draw that depends on call order, on wall time or on a shared counter fails.
 * @evidence contracts/development/testing.md#independent-expectations Reproducibility is a law over two calls; the second scenario states only that an offset exists, which the positive spreads imply.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers three repeats and all eight rig-free slot types, with a check that each one moved.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on real streams and a stub of the measures read. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 scenarios.
 */
export function test_motion_compose_variation_reproducible(): void {
  const all = (index: number): unknown[] => {
    const source = motionVariationSource({ index });
    return [
      AutoMovieMotionHumanVariation.place(
        source,
        "place",
        MOTION_VARIATION_BODIES[0]!,
        "right",
        { height: 0.72, range: 0.8, facing: "performer" },
        { distance: 0.6, seconds: 0.4 },
      ),
      AutoMovieMotionHumanVariation.strike(source, "strike", {
        radius: 0.1,
        scatter: 0.02,
        along: { up: 0, out: 1 },
      }),
      AutoMovieMotionHumanVariation.direction(source, "direction", {
        x: 0,
        y: 0,
        z: 1,
      }),
      AutoMovieMotionHumanVariation.amount(source, "amount", 0.5),
      AutoMovieMotionHumanVariation.duration(source, "duration", 0.3),
      AutoMovieMotionHumanVariation.pause(source, "pause", 0.4),
      AutoMovieMotionHumanVariation.bend(source, "bend", 0.2),
      AutoMovieMotionHumanVariation.curvature(source, "curvature", 0.1),
    ];
  };
  const still: unknown[] = [
    { height: 0.72, range: 0.8, lateral: 0, facing: "performer" },
    { up: 0, out: 0 },
    { x: 0, y: 0, z: 1 },
    0.5,
    0.3,
    0.4,
    0.2,
    0.1,
  ];
  for (const index of [0, 1, 7]) {
    const first: unknown[] = all(index);
    TestValidator.equals(`repeat ${index} twice`, all(index), first);
    TestValidator.predicate(
      `repeat ${index} moved every slot`,
      first.every(
        (value: unknown, i: number): boolean =>
          JSON.stringify(value) !== JSON.stringify(still[i]),
      ),
    );
  }
}
