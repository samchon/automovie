import type { IAutoMovieMotionHumanEnsemble } from "@automovie/interface";
import { AutoMovieMotionHumanEnsemble, HumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * A population gives each actor a stable identifier and its own authored placement.
 *
 * Scenarios:
 * 1. Zero people refuse on the count axis.
 * 2. Adding members preserves existing identities, positions and seeded attributes.
 * 3. Another ensemble has its own subject names and authored origin.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the ensemble's naming, placement and replay obligations.
 * @evidence contracts/development/testing.md#behavioral-verification Constructs independent populations through the public factory.
 * @evidence contracts/development/testing.md#independent-expectations Authored origin and array index fix the expected positions and subject names.
 * @evidence contracts/development/testing.md#distinguishing-cases Compares zero, one, three and a second ensemble with another origin.
 * @evidence contracts/development/testing.md#execution-ownership Resolves member declarations using one local body without planning actions.
 */
export function test_motion_ensemble_ensemble_population(): void {
  const body = motionHumanBody("m-average");
  const build = (
    id: string,
    count: number,
    origin: number,
  ): IAutoMovieMotionHumanEnsemble.IEnsemble =>
    AutoMovieMotionHumanEnsemble.HumanEnsemble({
      id,
      count,
      seed: "members",
      bodies: [body],
      places: (index: number): IAutoMovieMotionHumanEnsemble.IPlace => ({
        at: { x: origin + index, y: 0, z: 0 },
        yaw: 0,
      }),
    });
  let error: unknown;
  try {
    build("cast", 0, 0);
  } catch (caught) {
    error = caught;
  }
  TestValidator.predicate(
    "zero population names its count",
    error instanceof HumanRefusal && error.axis === "cast.count",
  );
  const one = build("cast", 1, 10);
  const many = build("cast", 3, 10);
  const other = build("other", 1, 30);
  TestValidator.equals(
    "unique ids",
    many.members.map((member) => member.subject),
    ["cast.0", "cast.1", "cast.2"],
  );
  TestValidator.equals(
    "positions",
    many.members.map((member) => member.place.at.x),
    [10, 11, 12],
  );
  TestValidator.equals(
    "first member replays",
    [many.members[0]!.attributes, many.members[0]!.place],
    [one.members[0]!.attributes, one.members[0]!.place],
  );
  TestValidator.equals(
    "other ensemble",
    [other.members[0]!.subject, other.members[0]!.place.at.x],
    ["other.0", 30],
  );
}
