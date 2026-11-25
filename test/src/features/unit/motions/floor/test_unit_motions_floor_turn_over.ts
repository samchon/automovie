import { turnOverToward } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `turnOverToward` is the target turn nearest the current one among the named
 * turn's whole-turn equivalents, a half turn away going over the named side.
 *
 * Scenarios:
 *
 * 1. From 10 toward 90 the turn is 90; from 350 toward 0 it is 360.
 * 2. From 0 toward 180, a half turn, it goes over the left to 180 and over the
 *    right to -180.
 */
export async function test_unit_motions_floor_turn_over(): Promise<void> {
  TestValidator.equals(
    "the nearest",
    [turnOverToward(10, 90, "left"), turnOverToward(350, 0, "left")],
    [90, 360],
  );
  TestValidator.equals(
    "a half turn over a side",
    [turnOverToward(0, 180, "left"), turnOverToward(0, 180, "right")],
    [180, -180],
  );
}
