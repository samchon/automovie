import { AutoMovieArchetypePassageSearch as search } from "@automovie/archetypes/internal";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** A two-second bracket contracts by 2⁻⁴⁰ through bisection. */
const EDGE_SECONDS: number = 2 * 2 ** -40 + 40 * Number.EPSILON;

/** Golden-section search contracts the two-second bracket by ϕ⁴⁰. */
const MINIMUM_SECONDS: number = 2 * ((Math.sqrt(5) - 1) / 2) ** 40 + 40 * Number.EPSILON;

/** A quadratic residual at the minimum squares the time error, plus rounding. */
const MINIMUM_METRES: number = MINIMUM_SECONDS ** 2 + Number.EPSILON;

/**
 * Passage geometry resolves both convex-hull clearance and a missed dip.
 *
 * Scenarios:
 *
 * 1. A point inside a counter-clockwise square has zero separation in either
 *    operand order. A point a unit beyond each corner axis is √2 away.
 * 2. Clearance (t − 1/2)² with a 1/16 margin violates between 1/4 and 3/4,
 *    although all three observations are outside the margin.
 * 3. Clearance (t − 1)² with a 9/16 margin groups three violating observations
 *    into one conflict from 1/4 to 7/4. A zero margin admits an exact tangent.
 */
export function test_unit_archetypes_internal_passage_collision(): void {
  const square: IAutoMovieVector3[] = [
    {x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0},
    {x: 1, y: 0, z: 1}, {x: 0, y: 0, z: 1},
  ];
  const interior: IAutoMovieVector3[] = [{x: 1 / 2, y: 0, z: 1 / 2}];
  TestValidator.equals("interior point", search.separation(square, interior), 0);
  TestValidator.equals("interior point reversed", search.separation(interior, square), 0);
  /** The closest distance takes two exact unit differences and one square root. */
  const diagonalTolerance: number = 4 * Number.EPSILON;
  TestValidator.predicate("corner clearance", nclose(search.separation(square, [{x: 2, y: 0, z: 2}]), Math.SQRT2, diagonalTolerance));

  const inspect = (times: number[], centre: number, required: number): ReturnType<typeof search.scan> => {
    const clearance = (seconds: number): number => (seconds - centre) ** 2;
    return search.scan({
      subject: "moving",
      other: "fixed",
      required,
      at: clearance,
      sampled: (at: number): number => clearance(times[at]!),
    }, times);
  };
  const hidden: ReturnType<typeof inspect> = inspect([0, 1, 2], 1 / 2, 1 / 16);
  const sampled: ReturnType<typeof inspect> = inspect([0, 1 / 2, 1, 3 / 2, 2], 1, 9 / 16);
  TestValidator.equals("one conflict per violating interval", [hidden.length, sampled.length], [1, 1]);
  const first: (typeof hidden)[number] = hidden[0]!;
  const second: (typeof sampled)[number] = sampled[0]!;
  TestValidator.predicate("unobserved dip boundaries", nclose(first.from, 1 / 4, EDGE_SECONDS) && nclose(first.to, 3 / 4, EDGE_SECONDS));
  TestValidator.predicate("sampled interval boundaries", nclose(second.from, 1 / 4, EDGE_SECONDS) && nclose(second.to, 7 / 4, EDGE_SECONDS));
  TestValidator.predicate("refined minimum", nclose(first.seconds, 1 / 2, MINIMUM_SECONDS) && nclose(first.clearance, 0, MINIMUM_METRES));
  TestValidator.equals("required slack and pair identity", [second.subject, second.other, second.required], ["moving", "fixed", 9 / 16]);
  TestValidator.equals("exact tangency is admitted", inspect([0, 1, 2], 1, 0), []);
}
