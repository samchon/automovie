import {simulateFluidDomain} from "@automovie/engine";
import {TestValidator} from "@nestia/e2e";
import {namedFacts,nclose} from "../internal/predicates";
import {createFountainLedgerDomain as fountain} from "../internal/createFountainLedgerDomain";
import {FOUNTAIN_LEDGER_SOURCE as SOURCE} from "../internal/FOUNTAIN_LEDGER_SOURCE";
import {FOUNTAIN_LEDGER_DRAIN as DRAIN} from "../internal/FOUNTAIN_LEDGER_DRAIN";

/**
 * Circulation books the actual source and positivity-limited drain beside retained volume; all walled faces keep exactly zero outflow.
 *
 * Scenarios:
 * 1. The original 6 x 6 basin is simulated at absolute step 400.
 * 2. Volume closes within 1e-9 cubic metres; .05 m3/s times dt times 400 supplies the independent source oracle within 1e-12.
 */
export const test_fluid_source_drain_ledger=():void=>{
  const steps = 400;
  const running = fountain({ sources: [SOURCE], drains: [DRAIN] });
  const authored = 36 * 0.25 * 0.25;
  const state = simulateFluidDomain(running, steps);
  TestValidator.equals(
    "a circulating basin balances its books",
    namedFacts([
      [
        "massBalance",
        () =>
          nclose(
            state.volume,
            authored + state.sourceVolume - state.drainVolume,
            1e-9,
          ),
      ],
      ["outflowZero", () => Object.is(state.outflowVolume, 0)],
      [
        "sourceDelivered",
        () =>
          nclose(
            state.sourceVolume,
            SOURCE.flowRate * running.solver.fixedStepSeconds * steps,
            1e-12,
          ),
      ],
      ["drainDrew", () => state.drainVolume > 0],
    ]),
    {
      massBalance: true,
      outflowZero: true,
      sourceDelivered: true,
      drainDrew: true,
    },
  );


};
