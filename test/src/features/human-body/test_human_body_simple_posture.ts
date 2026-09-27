import {
  HUMAN_BODY_SIMPLE_POSTURE,
  type IAutoMovieHumanBodyBasis,
  humanBodySimplePosture,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

type Joint = IAutoMovieHumanBodyBasis["joints"][number];

const joint = (
  bone: string,
  neutral: number,
  min: number,
  max: number,
): Joint =>
  ({
    bone,
    neutral: { flexion: neutral, abduction: 0, twist: 0 },
    constraint: {
      flexion: { min, max },
      abduction: { min: -10, max: 10 },
      twist: { min: -10, max: 10 },
    },
  }) as unknown as Joint;

const basisOf = (joints: Joint[]) =>
  ({ joints }) as unknown as IAutoMovieHumanBodyBasis;

/**
 * A body's age sets its standing kyphosis.
 *
 * Scenarios:
 * 1. A body of 40 or younger adds no kyphosis and takes no rows.
 * 2. A body of 72 takes the whole of the table's added kyphosis (36.5 less
 *    the source body's 25 degrees) as flexion of the chest and upper chest
 *    over their rest angles, half each, and the neck extends by as much; a
 *    body of 90 is held there and one of 56 takes half, for either sex.
 * 3. The neck's extension stops at the end of its range.
 * 4. A basis without one of the named joints is refused.
 */
export const test_human_body_simple_posture = (): void => {
  const basis = basisOf([
    joint("chest", 2, -10, 30),
    joint("upperChest", 0, -10, 30),
    joint("neck", 0, -22.5, 22.5),
  ]);
  const added =
    HUMAN_BODY_SIMPLE_POSTURE.kyphosis.oldDegrees[0]![1] -
    HUMAN_BODY_SIMPLE_POSTURE.kyphosis.youngDegrees;
  const flexion = (rows: ReturnType<typeof humanBodySimplePosture>) =>
    Object.fromEntries(rows.map((row) => [row.bone, row.flexion]));
  TestValidator.equals(
    "a body of forty stands as the source",
    humanBodySimplePosture(basis, { sex: -1, ageYears: 40 }),
    [],
  );
  const old = flexion(humanBodySimplePosture(basis, { sex: 1, ageYears: 72 }));
  const oldest = flexion(
    humanBodySimplePosture(basis, { sex: -1, ageYears: 90 }),
  );
  const middle = flexion(
    humanBodySimplePosture(basis, { sex: -1, ageYears: 56 }),
  );
  TestValidator.predicate(
    "the kyphosis grows with age over the thoracic joints and the neck compensates",
    nclose(added, 11.5, 1e-12) &&
      nclose(old.chest!, 2 + added / 2, 1e-12) &&
      nclose(old.upperChest!, added / 2, 1e-12) &&
      nclose(old.neck!, -added, 1e-12) &&
      nclose(oldest.neck!, -added, 1e-12) &&
      nclose(middle.upperChest!, added / 4, 1e-12) &&
      nclose(middle.neck!, -added / 2, 1e-12),
  );
  TestValidator.predicate(
    "the neck stops at the end of its range",
    nclose(
      flexion(
        humanBodySimplePosture(
          basisOf([
            joint("chest", 0, -10, 30),
            joint("upperChest", 0, -10, 30),
            joint("neck", 0, -5, 22.5),
          ]),
          { sex: 1, ageYears: 80 },
        ),
      ).neck!,
      -5,
      1e-12,
    ),
  );
  TestValidator.predicate(
    "a basis without a named joint is refused",
    throwsError(
      () =>
        humanBodySimplePosture(basisOf([joint("chest", 0, -10, 30)]), {
          sex: 1,
          ageYears: 80,
        }),
      "Body posture names a joint",
    ),
  );
};
