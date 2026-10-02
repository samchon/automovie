import { resolvePortraitDentalCrown } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * Omitted crown shape members resolve to one basic profile.
 *
 * Scenarios:
 * 1. A crown with only width and height takes the 0.78 cervical ratio, an edge
 *    rise of 3.5 percent of its height and the supplied depth, with no contour.
 * 2. The negative twin: explicit cervical width, edge rise and contour are kept
 *    exactly, including an explicit zero rise that a falsy test would replace.
 */
export const test_subject_dental_crown_defaults = (): void => {
  const basic = resolvePortraitDentalCrown({ width: 6, height: 9 }, 1.5);
  TestValidator.predicate(
    "basic profile",
    basic.width === 6 &&
      basic.height === 9 &&
      basic.depth === 1.5 &&
      basic.cervicalWidth === 0.78 &&
      nclose(basic.edgeRise, 0.315) &&
      basic.contour === undefined,
  );
  const contour = { mesial: { contactHeight: 0.25 } };
  const authored = resolvePortraitDentalCrown(
    { width: 6, height: 9, cervicalWidth: 0.6, edgeRise: 0, contour },
    2,
  );
  TestValidator.predicate(
    "authored members kept",
    authored.cervicalWidth === 0.6 &&
      authored.edgeRise === 0 &&
      authored.depth === 2 &&
      authored.contour === contour,
  );
};
