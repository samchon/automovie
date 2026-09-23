import {
  HUMAN_BODY_SIMPLE_SHAPE,
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodySimpleShape,
  expandHumanBodySimpleShape,
  humanBodySimpleShapeMath,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose } from "../internal/predicates";

/**
 * A channel's weight is the sum of every term row naming it, saturated once
 * at the channel's envelope, not saturated after each row. The two models
 * agree on the published table, where no row alone leaves an envelope that a
 * later row on the same channel comes back into, so the scenario narrows the
 * envelope instead: the envelope is the basis's, an in-memory input, while
 * the table stays the constant it is. The projection reads the muscle back as
 * the first row's inverse of the weight less the other rows, which is the
 * sum model's inverse, so a per-row expansion would disagree with its own
 * projection once such a row is added.
 *
 * Scenarios, on the analytic box at seven tenths of its width and depth
 * with the height, weight and ptosis macros, for a man of 40 at body mass
 * index 25 with muscle 1, whose ptosis rows are 0.15 (the age curve at 40
 * times the mass curve at 25) and -0.16 (the lift: -0.4 times the muscle
 * curve at 1 times the age curve at 40, 0.4), a sum of -0.01:
 * 1. The first row alone, 0.15, exceeds a ptosis maximum of 0.1, which is
 *    the arrangement the scenario needs: on that envelope the sum model
 *    gives -0.01, where a per-row model would clip the first row to 0.1 and
 *    give -0.06.
 * 2. On the ordinary envelope [-1, 1] the same body gives the same -0.01:
 *    the narrowed envelope did not change what the rows sum to.
 * 3. On a maximum of -0.05 the sum -0.01 still saturates, to -0.05: the
 *    envelope binds on the sum, not only on a row.
 */
export const test_human_body_simple_saturation = (): void => {
  const table = HUMAN_BODY_SIMPLE_SHAPE;
  const { basis: box } = humanBodyBasisFixture();
  const surface = box.surfaces[0];
  const macro = (
    id: string,
    maximum: number,
    positive: string,
    negative: string,
  ): IAutoMovieHumanBodyBasis["channels"][number] => ({
    id,
    kind: "shape",
    group: "macro",
    mirror: null,
    minimum: -1,
    maximum,
    positive,
    negative,
  });
  const basis = (ptosisMaximum: number): IAutoMovieHumanBodyBasis => ({
    ...box,
    channels: [
      ...box.channels,
      macro("macroHeight", 1, "raised", "lowered"),
      macro("macroWeight", 1, "wide", "narrow"),
      macro("buttocksPtosis", ptosisMaximum, "wideTall", "wideTall"),
    ],
    correctives: [],
    surfaces: [
      {
        ...surface,
        // seven tenths of the box's width and depth put its body mass index
        // reach at about 13 to 31, so a body mass index of 25 is solvable
        positions: surface.positions.map((value, at) =>
          at % 3 === 1 ? value : value * 0.7,
        ),
        targets: {
          ...surface.targets,
          lowered: [4, 0, -0.5, 0, 5, 0, -0.5, 0, 6, 0, -0.5, 0, 7, 0, -0.5, 0],
        },
      },
    ],
  });
  const stature = 1.75 + table.stature.headAboveRingMetres;
  const simple: IAutoMovieHumanBodySimpleShape = {
    sex: 1,
    ageYears: 40,
    statureMetres: stature,
    massKilograms: 25 * stature * stature,
    muscle: 1,
  };
  // the arrangement: the first ptosis row alone leaves the narrowed envelope
  const first = table.terms.find((row) => row.channel === "buttocksPtosis")!;
  const alone = humanBodySimpleShapeMath.term(
    first,
    humanBodySimpleShapeMath.parameters(simple),
  );
  TestValidator.predicate("the first row alone is 0.15", nclose(alone, 0.15));
  TestValidator.predicate("and exceeds the narrowed maximum", alone > 0.1);

  const narrowed = expandHumanBodySimpleShape(basis(0.1), simple);
  TestValidator.predicate(
    "the sum is saturated, not each row",
    nclose(narrowed.buttocksPtosis, -0.01),
  );
  const ordinary = expandHumanBodySimpleShape(basis(1), simple);
  TestValidator.predicate(
    "the ordinary envelope gives the same sum",
    nclose(ordinary.buttocksPtosis, -0.01),
  );
  const bound = expandHumanBodySimpleShape(basis(-0.05), simple);
  TestValidator.predicate(
    "the sum still saturates at the envelope",
    nclose(bound.buttocksPtosis, -0.05),
  );
};
