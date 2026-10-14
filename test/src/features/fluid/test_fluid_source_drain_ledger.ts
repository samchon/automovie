import { simulateFluidDomain } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { FOUNTAIN_LEDGER_DRAIN as DRAIN } from "../internal/FOUNTAIN_LEDGER_DRAIN";
import { FOUNTAIN_LEDGER_SOURCE as SOURCE } from "../internal/FOUNTAIN_LEDGER_SOURCE";
import { createFountainLedgerDomain as fountain } from "../internal/createFountainLedgerDomain";
import { nclose } from "../internal/predicates";

/**
 * Circulation books the actual source and positivity-limited drain beside retained volume; the walled basin books exactly zero outflow.
 *
 * Scenarios:
 * 1. The original 6 x 6 basin is simulated at absolute step 400.
 * 2. Volume closes within 1e-9 cubic metres; .05 m3/s times dt times 400 supplies the independent source oracle within 1e-12.
 *
 * @evidence contracts/testing.md#behavioral-verification Simulates the original fountain source/return at the selected horizon and observes booked source, positive return and volume conservation, catching forgotten or invented ledger mass.
 * @evidence contracts/testing.md#independent-expectations The authored flow rate times fixed-step elapsed time determines source volume and initial area/depth determines the water total; conservation includes the observed return booking rather than inventing an exact hydraulic drain total.
 * @evidence contracts/testing.md#distinguishing-cases Retains the original live source and lower return sill with their shared basin; source/drain activity windows, raised sill and over-eager one-cell exhaustion are separate entries.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns its absolute CPU solve and ledger assertions through the existing fountain records, with no real-time host or renderer.
 */
export function test_fluid_source_drain_ledger(): void {
  const steps: number = 400;
  const running: ReturnType<typeof fountain> = fountain({
    sources: [SOURCE],
    drains: [DRAIN],
  });
  const authored: number = 36 * 0.25 * 0.25;
  const state: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(
    running,
    steps,
  );
  TestValidator.predicate(
    "circulation mass balance",
    nclose(
      state.volume,
      authored + state.sourceVolume - state.drainVolume,
      1e-9,
    ),
  );
  TestValidator.predicate(
    "walled basin has zero outflow",
    Object.is(state.outflowVolume, 0) && nclose(state.outflowVolume, 0, 0),
  );
  TestValidator.predicate(
    "source delivers rate times elapsed time",
    nclose(
      state.sourceVolume,
      SOURCE.flowRate * running.solver.fixedStepSeconds * steps,
      1e-12,
    ),
  );
  TestValidator.predicate("return drain draws water", state.drainVolume > 0);
}
