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
 * Compare the documented base-action keys with the runtime law identities.
 *
 * Scenarios:
 *
 * 1. Compare the authored list, installed keys and actual law names.
 * 2. Check the bound owners for stance, travel, transfer and flight.
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
