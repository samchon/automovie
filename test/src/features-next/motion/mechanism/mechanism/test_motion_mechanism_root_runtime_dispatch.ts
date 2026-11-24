import {
  AutoMovieMotionHumanGait,
  AutoMovieMotionHumanJump,
  AutoMovieMotionHumanSeat,
  AutoMovieMotionHumanStance,
  HUMAN_ACTIONS,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import LEDGER from "../../../../features/internal/MOTION_HUMAN_LEDGER.json";

/**
 * Compare the documented base-action keys with the runtime law identities.
 *
 * Scenarios:
 * 1. Compare the authored list, installed keys and actual law names.
 * 2. Check the bound owners for stance, travel, transfer and flight.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents which action keys, declared names and implementation identities the runtime must expose.
 * @evidence contracts/development/testing.md#behavioral-verification The vocabulary ledger supplies the expected public names. Separately verify direct law identities across stance, travel, transfer and flight.
 * @evidence contracts/development/testing.md#independent-expectations The authored ledger and public standalone action laws are independent of the runtime registration object.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks omitted or additional registrations, repeated names under different keys and incorrect handler bindings.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory comparison, no scene or physical evaluation.
 */
export function test_motion_mechanism_root_runtime_dispatch(): void {
  const order = (a: string, b: string): number => a.localeCompare(b);
  TestValidator.equals(
    "the registered vocabulary equals the authored base vocabulary",
    Object.keys(HUMAN_ACTIONS).sort(order),
    LEDGER.laws.map((law) => law.law).sort(order),
  );
  TestValidator.predicate(
    "each dispatch key binds its own declared law name",
    Object.entries(HUMAN_ACTIONS).every(([name, law]) => name === law.name),
  );
  TestValidator.predicate(
    "the registered stance, travel, seat and flight are the public implementations",
    HUMAN_ACTIONS.stand === AutoMovieMotionHumanStance.stand &&
      HUMAN_ACTIONS.walk === AutoMovieMotionHumanGait.walk &&
      HUMAN_ACTIONS.sit === AutoMovieMotionHumanSeat.sit &&
      HUMAN_ACTIONS.jump === AutoMovieMotionHumanJump.jump,
  );
}
