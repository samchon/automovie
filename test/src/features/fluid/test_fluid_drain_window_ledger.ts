import {simulateFluidDomain} from "@automovie/engine";
import {TestValidator} from "@nestia/e2e";
import { nclose } from "../internal/predicates";
import {createFountainLedgerDomain as fountain} from "../internal/createFountainLedgerDomain";
import {FOUNTAIN_LEDGER_DRAIN as DRAIN} from "../internal/FOUNTAIN_LEDGER_DRAIN";

/**
 * The drain activity window gates booked removal at the authored opening and closing times.
 *
 * Scenarios:
 * 1. The unchanged 6 x 6 basin books an open drain before the one-second closing step.
 * 2. At step 400 its booked volume is bit-identical; a drain starting at 1,000 seconds books exactly zero removal.
 *
 * @evidence contracts/testing.md#behavioral-verification Seeks a one-second closing drain at its closing step and step 400, and a not-yet-open drain at step 400; observes positive prior booking, unchanged closed booking and positive zero before opening.
 * @evidence contracts/testing.md#independent-expectations The half-open authored window and fixed dyadic dt determine the closing step; exact post-close ledger identity and zero before a 1000-second start catch out-of-window removal.
 * @evidence contracts/testing.md#distinguishing-cases Preserves open-before-close, later-after-close and later-than-sample start cases; source windows, sill gating and positivity exhaustion have separate ledger entries.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns its three portable absolute CPU seeks with existing fountain records and no timer, process, renderer or real-time host.
 */
export function test_fluid_drain_window_ledger(): void {
  const steps: number = 400;
  const dt: number = fountain({}).solver.fixedStepSeconds;
  const windowedDrain: ReturnType<typeof fountain> = fountain({ drains: [{ ...DRAIN, end: 1 }] });
  const drainAtClose: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(windowedDrain, Math.round(1 / dt));
  const drainLater: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(windowedDrain, steps);
  const drainNotYet: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(
    fountain({ drains: [{ ...DRAIN, start: 1_000 }] }),
    steps,
  );

  TestValidator.predicate("closed drain books no later removal", Object.is(drainLater.drainVolume, drainAtClose.drainVolume) && nclose(drainLater.drainVolume, drainAtClose.drainVolume, 0));
  TestValidator.predicate("drain removes water while open", drainAtClose.drainVolume > 0);
  TestValidator.predicate("future drain removes no volume", Object.is(drainNotYet.drainVolume, 0) && nclose(drainNotYet.drainVolume, 0, 0));
}
