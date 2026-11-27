import { AutoMovieEngineGravity } from "@automovie/engine";
import {
  wireArrest
} from "../../../../../packages/motions/src/reaction/internal/wireArrest";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * The `wireArrest` law's admission (`wireArrest.arrest`): the body drops
 * freely, reaching `sqrt(2 g drop)`, then the wire stops it within the room
 * left above the stop at `speed² / (2 room)`, no harder than its bound.
 *
 * Scenarios:
 *
 * 1. From 4 m up, a 1 m drop stopping 1 m above the floor reaches `sqrt(2 g)` m/s
 *    and stops in the 2 m left at `g / 2`.
 * 2. A drop leaving no room above the stop, or one stopped harder than a bound of
 *    `g / 4`, is refused.
 */
export function test_motions_reaction_wire_arrest(): void {
  const g: number = AutoMovieEngineGravity.STANDARD;
  const arrest: wireArrest.IArrest = wireArrest.arrest(
    { drop: 1, stop: 1 },
    4,
    2 * g,
    1,
  );
  TestValidator.predicate(
    "the free drop and the stop",
    nclose(arrest.speed, Math.sqrt(2 * g), 1e-12) &&
      nclose(arrest.room, 2, 1e-12) &&
      nclose(arrest.needed, g / 2, 1e-12),
  );
  TestValidator.predicate(
    "no room, or too hard",
    throwsError(() => wireArrest.arrest({ drop: 3, stop: 1 }, 4, 2 * g, 1)) &&
      throwsError(() => wireArrest.arrest({ drop: 1, stop: 1 }, 4, g / 4, 1)),
  );
}
