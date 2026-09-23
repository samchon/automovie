import {
  HUMAN_BODY_SIMPLE_SHAPE,
  expandHumanBodySimpleShape,
  measureHumanBodySimpleShape,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodySimpleFixture } from "../internal/humanBodySimpleFixture";
import { nclose } from "../internal/predicates";

/**
 * A tape girth and the mass are solved against each other, and only the
 * converged body judges a girth's reach.
 *
 * On the analytic box (`humanBodySimpleFixture`) the waist girth is the
 * perimeter of the box's section, `2 (width + depth)`: width 0.14 m, less
 * 0.04 m at weight -1; depth 0.28 m, less 0.02 m at waist -1. At weight 0
 * the narrowest waist is `2 (0.14 + 0.26) = 0.80` m; a thin mass solves the
 * weight negative, which narrows the box, so a 0.78 m waist lies beyond the
 * weight-0 body's reach and inside the thin body's.
 *
 * Scenarios:
 * 1. The arrangement holds: with waist -1 the weight-0 box measures 0.80 m
 *    and the weight -1 box 0.72 m, so 0.78 m is only reachable once the
 *    weight has moved.
 * 2. A man of 1.75 m and 62 kg (near the box's thin end) with a 0.78 m
 *    waist builds, the waist measured back at 0.78 m on a weight moved
 *    thin: the intermediate girth step saturated instead of refusing.
 * 3. The same request with a 0.70 m waist, below even the weight -1 box,
 *    is refused by the converged body's strict pass, naming its reach.
 */
export const test_human_body_simple_coupled_reach = (): void => {
  const { wide, narrow } = humanBodySimpleFixture.weights;
  const basis = humanBodySimpleFixture.basis(wide, narrow);
  const waistOf = (shape: Record<string, number>): number =>
    measureHumanBodySimpleShape.channel(basis, shape, "measureWaistCirc")!;
  TestValidator.predicate(
    "the weight-0 box cannot narrow its waist to 0.78",
    nclose(waistOf({ measureWaistCirc: -1 }), 0.8, 1e-9),
  );
  TestValidator.predicate(
    "the thinnest box can",
    nclose(waistOf({ measureWaistCirc: -1, macroWeight: -1 }), 0.72, 1e-9),
  );
  const stature = 1.75 + HUMAN_BODY_SIMPLE_SHAPE.stature.headAboveRingMetres;
  const request = {
    sex: 1,
    ageYears: 25,
    statureMetres: stature,
    massKilograms: 62,
    muscle: 0,
    waistMetres: 0.78,
  };
  const shape = expandHumanBodySimpleShape(basis, request);
  TestValidator.predicate(
    "the waist is met on the converged body",
    nclose(waistOf(shape), 0.78, 1e-3),
  );
  TestValidator.predicate(
    "the weight moved thin to make room for it",
    shape.macroWeight < 0,
  );
  TestValidator.error("a waist past the converged reach is refused", () =>
    expandHumanBodySimpleShape(basis, { ...request, waistMetres: 0.7 }),
  );
};
