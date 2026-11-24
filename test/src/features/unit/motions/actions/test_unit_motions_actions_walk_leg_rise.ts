import { walkLegRise } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** The bracket's resolution, degrees: `RESOLVED` with a margin. */
const BRACKET: number = 1e-6;

/** The rounding width, degrees. */
const WIDTH: number = 10;

/**
 * `walkLegRise` raises a planted heel so that the room a rule must keep never
 * runs out: the asked pitch is kept while its room is `width` or more, and
 * otherwise the pitch keeping the smooth maximum of that room and none
 * (`-smoothMinimum(-room, 0, width)`, the polynomial smooth minimum `min(a, b)
 *
 * - H^2 w / 4`with`h = max(w - |a - b|, 0) / w`) is bracketed; a rule that may
 *   fold eases onto it by the minimum-jerk share of `(width - room) / width`;
 *   an asked pitch the leg cannot stand on is first raised to the least
 *   standable one.
 *
 * Scenarios, a room that grows one degree for each degree the heel rises
 * (`room(d) = r - d` from an asked pitch of 0), width 10:
 *
 * 1. A room of 12 keeps the asked pitch.
 * 2. A room of 4 keeps `-smoothMinimum(-4, 0, 10) = 4.9`, at a pitch of -0.9.
 * 3. A room of -3 keeps 1.225, at -4.225.
 * 4. Folding, a room of 4 eases onto -0.9 by the minimum-jerk share of 0.6,
 *    0.68256: -0.614304.
 * 5. A leg that cannot stand above -5 degrees, with room 20 below, is raised to
 *    -5.
 */
export function test_unit_motions_actions_walk_leg_rise(): void {
  const room: (r: number) => (d: number) => number =
    (r: number): ((d: number) => number) =>
    (d: number): number =>
      r - d;
  TestValidator.equals(
    "room enough",
    walkLegRise(room(12), 0, WIDTH, false),
    0,
  );
  TestValidator.predicate(
    "a short room",
    nclose(walkLegRise(room(4), 0, WIDTH, false), -0.9, BRACKET),
  );
  TestValidator.predicate(
    "no room",
    nclose(walkLegRise(room(-3), 0, WIDTH, false), -4.225, BRACKET),
  );
  TestValidator.predicate(
    "folding eases on",
    nclose(walkLegRise(room(4), 0, WIDTH, true), -0.9 * 0.68256, BRACKET),
  );
  TestValidator.predicate(
    "raised to stand",
    nclose(
      walkLegRise(
        (d: number): number => (d > -5 ? -Infinity : 20),
        0,
        WIDTH,
        false,
      ),
      -5,
      BRACKET,
    ),
  );
}
