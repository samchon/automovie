import { AutoMovieArchetypeOval } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `AutoMovieArchetypeOval` lays a running track of two straights and two
 * semicircles: `lapped` fixes the straight from the lap and the radius, `length`
 * is 2 straight + 2 pi radius, and `point` gives the position at a distance and
 * lane offset, wrapping by the length.
 *
 * Scenarios:
 *
 * 1. A 400 m lap of radius 36.5 has straight (400 - 73 pi) / 2 and length 400.
 * 2. At distance 0 on the rail the point is (x = -36.5, z = -straight / 2); at
 *    one straight it is (x = -36.5, z = +straight / 2); after the first turn,
 *    at straight + 36.5 pi, it is (x = +36.5, z = +straight / 2).
 * 3. A lane offset of 1.5 widens the radius: (x = -38) at distance 0.
 * 4. A distance of one whole length returns to the start.
 */
export function test_unit_archetypes_core_oval_lapped(): void {
  const oval: AutoMovieArchetypeOval.IOval = AutoMovieArchetypeOval.lapped(
    400,
    36.5,
  );
  const straight: number = (400 - 2 * Math.PI * 36.5) / 2;
  TestValidator.predicate("the straight", nclose(oval.straight, straight, 1e-9));
  TestValidator.predicate(
    "the length",
    nclose(AutoMovieArchetypeOval.length(oval), 400, 1e-9),
  );
  const start = AutoMovieArchetypeOval.point(oval, 0, 0);
  TestValidator.predicate(
    "the start",
    nclose(start.x, -36.5, 1e-9) && nclose(start.z, -straight / 2, 1e-9),
  );
  const turn = AutoMovieArchetypeOval.point(oval, straight, 0);
  TestValidator.predicate(
    "the first turn",
    nclose(turn.x, -36.5, 1e-9) && nclose(turn.z, straight / 2, 1e-9),
  );
  const back = AutoMovieArchetypeOval.point(
    oval,
    straight + Math.PI * 36.5,
    0,
  );
  TestValidator.predicate(
    "the far straight",
    nclose(back.x, 36.5, 1e-9) && nclose(back.z, straight / 2, 1e-9),
  );
  TestValidator.predicate(
    "a lane offset",
    nclose(AutoMovieArchetypeOval.point(oval, 0, 1.5).x, -38, 1e-9),
  );
  const wrapped = AutoMovieArchetypeOval.point(oval, 400, 0);
  TestValidator.predicate(
    "a full lap",
    nclose(wrapped.x, start.x, 1e-9) && nclose(wrapped.z, start.z, 1e-9),
  );
}
