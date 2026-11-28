import { AutoMovieEngineGravity } from "@automovie/engine";
import {
  wireArrest
} from "../../../../../packages/motions/src/reaction/internal/wireArrest";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * Check the free drop and remaining wire-braking room.
 *
 * Scenarios:
 *
 * 1. From 4 m, drop 1 m and stop 1 m above the floor. Reach speed sqrt(2g)
 *    m/s, with 2 m of braking room and required deceleration g / 2.
 * 2. Refuse a drop that leaves no room and a cap of g / 4 for the original
 *    drop.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios give the speed, available room and two braking refusal cases.
 * @evidence contracts/development/testing.md#behavioral-verification The test covers both the ballistic entry calculation and the two independent braking refusals.
 * @evidence contracts/development/testing.md#independent-expectations The fixture derives speed from `v ** 2 = 2 * g * drop` and braking from `v ** 2 / (2 * room)`.
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
