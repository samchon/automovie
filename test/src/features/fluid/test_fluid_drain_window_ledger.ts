import {simulateFluidDomain} from "@automovie/engine";
import {TestValidator} from "@nestia/e2e";
import {namedFacts} from "../internal/predicates";
import {createFountainLedgerDomain as fountain} from "../internal/createFountainLedgerDomain";
import {FOUNTAIN_LEDGER_DRAIN as DRAIN} from "../internal/FOUNTAIN_LEDGER_DRAIN";

/**
 * The drain activity window must gate outflow as precisely as the source window gates inflow.
 *
 * Scenarios:
 * 1. The unchanged 6 x 6 basin books an open drain before the one-second closing step.
 * 2. At step 400 its booked volume is bit-identical; start 1,000-second outflow stays exactly zero.
 */
export const test_fluid_drain_window_ledger=():void=>{
  const steps=400;const dt=fountain({}).solver.fixedStepSeconds;
  const windowedDrain = fountain({ drains: [{ ...DRAIN, end: 1 }] });
  const drainAtClose = simulateFluidDomain(windowedDrain, Math.round(1 / dt));
  const drainLater = simulateFluidDomain(windowedDrain, steps);
  const drainNotYet = simulateFluidDomain(
    fountain({ drains: [{ ...DRAIN, start: 1_000 }] }),
    steps,
  );

  TestValidator.equals("an activity window opens and closes a declared drain",namedFacts([
    ["drainClosed",()=>Object.is(drainLater.drainVolume,drainAtClose.drainVolume)],
    ["drainDrewWhileOpen",()=>drainAtClose.drainVolume>0],
    ["drainNotYetOpened",()=>Object.is(drainNotYet.drainVolume,0)],
  ]),{drainClosed:true,drainDrewWhileOpen:true,drainNotYetOpened:true});

};
