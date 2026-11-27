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
 * `HumanEnsemble` resolves a group's members: each a stable subject id
 * `<ensemble>.<index>`, placed where the input places it, with attributes drawn
 * by the chain seed, the ensemble and the member's index, so adding members
 * leaves the earlier ones as they were; an empty group is refused on its
 * count.
 *
 * The members carry whole bodies (`humanFixtureBody`), the record the group
 * hands to a performance.
 *
 * Scenarios, members placed 1 m apart along X from an origin:
 *
 * 1. A cast of three from x = 10 is `cast.0`, `cast.1`, `cast.2` at 10, 11, 12.
 * 2. Its first member's attributes and place equal a cast of one's.
 * 3. Another ensemble of one from x = 30 is `other.0` at 30.
 * 4. A cast of none is refused on `cast.count`.
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
