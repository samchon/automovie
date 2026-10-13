import {simulateFluidDomain} from "@automovie/engine";
import {TestValidator} from "@nestia/e2e";
import {namedFacts} from "../internal/predicates";
import {createFountainLedgerDomain as fountain} from "../internal/createFountainLedgerDomain";
import {FOUNTAIN_LEDGER_SOURCE as SOURCE} from "../internal/FOUNTAIN_LEDGER_SOURCE";
import {FOUNTAIN_LEDGER_DRAIN as DRAIN} from "../internal/FOUNTAIN_LEDGER_DRAIN";

/**
 * A drain whose sill stays above the water cannot remove any volume while the declared jet continues to deliver.
 *
 * Scenarios:
 * 1. The unchanged 6 x 6 basin uses a .5-metre return sill for 400 steps.
 * 2. Drain volume stays exactly positive zero and source volume remains positive.
 */
export const test_fluid_drain_sill_ledger=():void=>{
  const steps=400;
  const shutSill = simulateFluidDomain(
    fountain({
      sources: [SOURCE],
      drains: [{ ...DRAIN, sillLevel: 0.5 }],
    }),
    steps,
  );
  TestValidator.equals(
    "a drain above the water never opens",
    namedFacts([
      ["drainZero", () => Object.is(shutSill.drainVolume, 0)],
      ["sourceStillRuns", () => shutSill.sourceVolume > 0],
    ]),
    { drainZero: true, sourceStillRuns: true },
  );


};
