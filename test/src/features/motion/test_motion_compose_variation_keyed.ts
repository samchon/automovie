import {
  type AutoMovieMotionHumanTarget,
  AutoMovieMotionHumanVariationPlace,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { MOTION_VARIATION_BODIES } from "../internal/MOTION_VARIATION_BODIES";
import { motionVariationSource } from "../internal/motionVariationSource";

/**
 * Each part of a slot's key changes its offset: the chain seed, the
 * performer, the action's id, the slot key and the repeat.
 *
 * Scenarios:
 * 1. The place `ahead` varied under the keys (film, a, wave, repeat 0) is
 *    compared with the same place under one changed part at a time; every
 *    change gives a different record.
 * 2. Half the variation gives half the offset on every axis, from the same
 *    draws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public place slot on real seeded streams; a key part left out of the stream's seed, or a repeat that does not advance the sequence, fails.
 * @evidence contracts/development/testing.md#independent-expectations Scenario 2's halves follow from the documented linear scale; scenario 1 states only inequality.
 * @evidence contracts/development/testing.md#distinguishing-cases Changes each of the five key parts alone and scales the variation once.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on real streams and a stub of the measures read. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Names the base keys and lists the 2 scenarios.
 */
export function test_motion_compose_variation_keyed(): void {
  const ahead: AutoMovieMotionHumanTarget.IDefault = {
    height: 0.72,
    range: 0.8,
    facing: "performer",
  };
  const place = (
    props: Parameters<typeof motionVariationSource>[0],
    key: string = "place",
  ): AutoMovieMotionHumanTarget.IDefault =>
    AutoMovieMotionHumanVariationPlace.vary(
      motionVariationSource(props),
      key,
      MOTION_VARIATION_BODIES[0]!,
      "left",
      ahead,
    );
  const base = place({});
  const differs = (other: AutoMovieMotionHumanTarget.IDefault): boolean =>
    other.height !== base.height &&
    other.range !== base.range &&
    other.lateral !== base.lateral;
  TestValidator.predicate(
    "each key part changes the offset",
    differs(place({ seed: "other film" })) &&
      differs(place({ subject: "b" })) &&
      differs(place({ action: "stopPalm" })) &&
      differs(place({ index: 1 })) &&
      differs(place({}, "other place")),
  );

  const half = place({ variation: 0.5 });
  const close = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-12;
  TestValidator.predicate(
    "half the variation halves the offset",
    close(half.height - ahead.height, (base.height - ahead.height) / 2) &&
      close(half.range - ahead.range, (base.range - ahead.range) / 2) &&
      close(half.lateral!, base.lateral! / 2),
  );
}
