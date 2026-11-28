import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEnsemble,
} from "@automovie/interface";
import {
  HumanEnsemble
} from "../../../../../packages/motions/src/ensemble/internal/HumanEnsemble";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";

/**
 * Check ensemble identities, placements and stable seeded attributes.
 *
 * Scenarios:
 *
 * 1. From x = 10 m, generate `cast.0` , `cast.1` and `cast.2` at x = 10, 11
 *    and 12 m. The first member agrees with the one-member cast.
 * 2. Generate `other.0` at x = 30 m. Refuse an empty cast on `cast.count` .
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify ensemble names, placement spacing and empty input.
 * @evidence contracts/development/testing.md#behavioral-verification The member resolver receives canonical bodies and exact fixture placements and the repeat checks the stable first entry.
 * @evidence contracts/development/testing.md#independent-expectations The identity pattern and callback's one-metre indexing determine the expected names and locations.
 */
export async function test_motions_ensemble_human_ensemble(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const build: (
    id: string,
    count: number,
    origin: number,
  ) => IAutoMovieMotionHumanEnsemble.IEnsemble = (
    id: string,
    count: number,
    origin: number,
  ): IAutoMovieMotionHumanEnsemble.IEnsemble =>
    HumanEnsemble({
      id,
      count,
      seed: "members",
      bodies: [body],
      places: (index: number): IAutoMovieMotionHumanEnsemble.IPlace => ({
        at: { x: origin + index, y: 0, z: 0 },
        yaw: 0,
      }),
    });
  const many: IAutoMovieMotionHumanEnsemble.IEnsemble = build("cast", 3, 10);
  const one: IAutoMovieMotionHumanEnsemble.IEnsemble = build("cast", 1, 10);
  const other: IAutoMovieMotionHumanEnsemble.IEnsemble = build("other", 1, 30);
  TestValidator.equals(
    "the members",
    [
      many.members.map(
        (m: IAutoMovieMotionHumanEnsemble.IMember): unknown[] => [
          m.subject,
          m.place.at.x,
        ],
      ),
      [many.members[0]!.attributes, many.members[0]!.place],
      [other.members[0]!.subject, other.members[0]!.place.at.x],
    ],
    [
      [
        ["cast.0", 10],
        ["cast.1", 11],
        ["cast.2", 12],
      ],
      [one.members[0]!.attributes, one.members[0]!.place],
      ["other.0", 30],
    ],
  );
  let axis: string | undefined;
  try {
    build("cast", 0, 0);
  } catch (error: unknown) {
    if (error instanceof AutoMovieMotionHumanRefusal) axis = error.axis;
  }
  TestValidator.equals("no members", axis, "cast.count");
}
