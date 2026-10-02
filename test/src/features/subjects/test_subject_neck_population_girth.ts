import { portraitNeckShape } from "@automovie/human/face/anatomy/cranium/portraitNeckShape";
import type { IPortraitNeckSection } from "@automovie/human/face/anatomy/cranium/structures/IPortraitNeckSection";
import { TestValidator } from "@nestia/e2e";

/**
 * The default neck is a girth a member of the measured adult population can
 * have. The population is the ANSUR II public data release (2012 US Army
 * survey), whose `neckcircumference` column, computed from its records, has
 * female mean 329.8 mm with fifth percentile 302 mm (n = 1986) and male mean
 * 397.6 mm with ninety-fifth percentile 443 mm (n = 4082). The default names
 * no sex, so it takes the equal-weight mean of the two sex means, 363.7 mm.
 *
 * Section perimeter is the sum of two half ellipses that share the transverse
 * half width, one with the anterior and one with the posterior radius, each
 * by Ramanujan's approximation pi (3(a + b) - sqrt((3a + b)(a + 3b))).
 *
 * Scenarios:
 * 1. The lower section matches the pooled mean within
 *    one millimetre, which is the derivation the default documents.
 * 2. Every default section lies inside the release's female fifth to male
 *    ninety-fifth percentile band, so no member of the population is thinner
 *    or thicker than the default neck by more than the population itself.
 * 3. The negative twin: the earlier authored lower section (half width 43,
 *    radii 39 and 45) lies below the female fifth percentile and is therefore
 *    outside the band that scenario 2 admits.
 * 4. The neck does not narrow towards its base: the perimeters do not decrease
 *    from the upper section through the lower section to the crop.
 */
export const test_subject_neck_population_girth = (): void => {
  const ellipse = (a: number, b: number): number =>
    Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
  const perimeter = (section: IPortraitNeckSection): number =>
    (ellipse(section.width, section.front) +
      ellipse(section.width, section.back)) /
    2;
  const pooledMean = (329.8 + 397.6) / 2;
  const lowest = 302;
  const highest = 443;
  const { upper, lower, crop } = portraitNeckShape;

  TestValidator.predicate(
    "lower section matches the pooled mean neck circumference",
    Math.abs(perimeter(lower) - pooledMean) < 1,
  );
  TestValidator.predicate(
    "the default sections lie inside the measured band",
    [upper, lower, crop].every(
      (section) =>
        perimeter(section) >= lowest && perimeter(section) <= highest,
    ),
  );
  TestValidator.predicate(
    "the earlier authored neck was thinner than the female fifth percentile",
    perimeter({ y: -145, width: 43, front: 39, back: 45, centre: -53 }) <
      lowest,
  );
  TestValidator.predicate(
    "the neck does not narrow towards its base",
    perimeter(upper) <= perimeter(lower) && perimeter(lower) <= perimeter(crop),
  );
};
