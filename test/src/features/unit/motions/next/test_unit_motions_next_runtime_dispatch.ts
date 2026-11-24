import {
  AutoMovieMotionHumanGait,
  AutoMovieMotionHumanJump,
  AutoMovieMotionHumanSeat,
  AutoMovieMotionHumanStance,
  HUMAN_ACTIONS,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanLedger } from "../../../internal/motionHumanLedger";

/**
 * Compare the documented base-action keys with the runtime law identities.
 *
 * Scenarios:
 *
 * 1. Compare the authored list, installed keys and actual law names.
 * 2. Check the bound owners for stance, travel, transfer and flight.
 */
export async function test_unit_motions_next_runtime_dispatch(): Promise<void> {
  const ledger: motionHumanLedger.ILedger = await motionHumanLedger();
  const order = (a: string, b: string): number => a.localeCompare(b);
  TestValidator.equals(
    "the registered vocabulary equals the authored base vocabulary",
    Object.keys(HUMAN_ACTIONS).sort(order),
    ledger.laws
      .map((law: motionHumanLedger.ILaw): string => law.law)
      .sort(order),
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
