import {
  ViolationCollector,
  clampJointRom,
  validateJointRom,
} from "@automovie/engine";
import { IAutoMovieJointConstraint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint } from "../internal/fixtures";
import { namedFacts, nclose } from "../internal/predicates";

/**
 * A specified zero outside an override interval must fail validation and clamp to its minimum; immobile-axis zero and zero-containing intervals retain their accepted meaning.
 *
 * Scenarios:
 *
 * 1. Flexion zero against [10,90] reports one ROM fault at its axis path and clamps to ten.
 * 2. Interior flexion, immobile abduction zero and twist zero inside [-30,30] remain clean.
 *
 * @evidence contracts/testing.md#behavioral-verification Validates specified zero against a nonzero-minimum interval, checks its exact ROM address and clamps it to the minimum, contrasting a clean pose whose immobile and zero-containing axes remain zero.
 * @evidence contracts/testing.md#independent-expectations Zero is outside [10,90] and its nearest admitted endpoint is ten; zero lies inside [-30,30] and is the neutral specified value of an immobile axis. Literal kind/path/count and numeric endpoint judge the detector and clamp independently.
 * @evidence contracts/testing.md#distinguishing-cases The zero-excluding refusal contrasts accepted interior flexion, immobile zero and zero-containing twist; cone coupling and nonfinite input repair are separate ROM tests.
 * @evidence contracts/testing.md#execution-ownership The named synchronous entry owns two collectors and calls portable detector/clamp owners with the existing joint fixture, without a Human asset, native artifact or host.
 */
export function test_rom_validate_zero_excluding_override(): void {
  const constraint: IAutoMovieJointConstraint = {
    flexion: { min: 10, max: 90 },
    abduction: null,
    twist: { min: -30, max: 30 },
  };

  // 1. zero against a zero-excluding override reports and clamps to the min
  const collector: ViolationCollector = new ViolationCollector();
  validateJointRom({
    joint: joint("leftLowerArm", { flexion: 0, abduction: 0, twist: 0 }),
    constraint,
    path: "$input",
    collector,
  });
  TestValidator.equals(
    "zero against a zero-excluding override is a rom violation",
    namedFacts([
      ["collectorItems", (): boolean => collector.items.length === 1],
      ["collectorItemsKind", (): boolean => collector.items[0]!.kind === "rom"],
      [
        "collectorItemsinput",
        (): boolean => collector.items[0]!.path === "$input.flexion",
      ],
    ]),
    {
      collectorItems: true,
      collectorItemsKind: true,
      collectorItemsinput: true,
    },
  );
  const clamped: ReturnType<typeof joint> = clampJointRom(
    joint("leftLowerArm", { flexion: 0, abduction: 0, twist: 0 }),
    constraint,
  );
  TestValidator.predicate(
    "clampJointRom agrees: the same zero moves to the range min",
    nclose(clamped.flexion!, 10),
  );

  // 2. the immobile-axis skip and zero-including ranges stay clean (the
  //    abduction 0 and twist 0 above produced no violations of their own)
  const clean: ViolationCollector = new ViolationCollector();
  validateJointRom({
    joint: joint("leftLowerArm", { flexion: 45, abduction: 0, twist: 0 }),
    constraint,
    path: "$input",
    collector: clean,
  });
  TestValidator.equals(
    "immobile-axis zero and zero-including ranges stay clean",
    clean.items.length,
    0,
  );
}
