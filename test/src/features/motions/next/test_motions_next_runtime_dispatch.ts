import {
  AutoMovieMotionHumanGait,
  AutoMovieMotionHumanJump,
  AutoMovieMotionHumanSeat,
  AutoMovieMotionHumanStance,
  AutoMovieMotionHumanActions,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanLedger } from "../../internal/motionHumanLedger";

/**
 * Check installed action names and their owning law identities.
 *
 * Scenarios:
 *
 * 1. Compare the authored base-action list, installed keys and law names.
 * 2. Check the installed owners for stance, travel, support transfer and
 *    flight.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify the registry relationships and representative action families.
 * @evidence contracts/development/testing.md#behavioral-verification The runtime dispatch table is read directly and matched against the documented keys and explicit law bindings.
 * @evidence contracts/development/testing.md#independent-expectations The authored key list and explicitly imported operations are the independent expected identities.
 */
export async function test_motions_next_runtime_dispatch(): Promise<void> {
  const ledger: motionHumanLedger.ILedger = await motionHumanLedger();
  const order = (a: string, b: string): number => a.localeCompare(b);
  TestValidator.equals(
    "the registered vocabulary equals the authored base vocabulary",
    Object.keys(AutoMovieMotionHumanActions).sort(order),
    ledger.laws
      .map((law: motionHumanLedger.ILaw): string => law.law)
      .sort(order),
  );
  TestValidator.predicate(
    "each dispatch key binds its own declared law name",
    Object.entries(AutoMovieMotionHumanActions).every(([name, law]) => name === law.name),
  );
  TestValidator.predicate(
    "the registered stance, travel, seat and flight are the public implementations",
    AutoMovieMotionHumanActions.stand === AutoMovieMotionHumanStance.stand &&
      AutoMovieMotionHumanActions.walk === AutoMovieMotionHumanGait.walk &&
      AutoMovieMotionHumanActions.sit === AutoMovieMotionHumanSeat.sit &&
      AutoMovieMotionHumanActions.jump === AutoMovieMotionHumanJump.jump,
  );
}
