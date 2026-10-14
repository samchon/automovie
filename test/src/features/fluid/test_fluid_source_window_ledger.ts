import {simulateFluidDomain} from "@automovie/engine";
import {TestValidator} from "@nestia/e2e";
import { nclose } from "../internal/predicates";
import {createFountainLedgerDomain as fountain} from "../internal/createFountainLedgerDomain";
import {FOUNTAIN_LEDGER_SOURCE as SOURCE} from "../internal/FOUNTAIN_LEDGER_SOURCE";

/**
 * The source activity window owns its opening and closing clock independently of momentum and drain behavior.
 *
 * Scenarios:
 * 1. The unchanged 6 x 6 basin reaches the one-second closing step and absolute step 400.
 * 2. Source volume after close is bit-identical; the start 1,000-second twin remains exactly zero.
 *
 * @evidence contracts/testing.md#behavioral-verification Compares a source booking at its one-second closing step with step 400 and observes a source whose start is beyond the sample, catching inflow outside the authored half-open window.
 * @evidence contracts/testing.md#independent-expectations Fixed dyadic dt independently locates the one-second closure; positive prior booking, strict later booking identity and zero before a 1000-second start follow the half-open window contract. Exact rate-times-time booking belongs to the source/drain ledger entry.
 * @evidence contracts/testing.md#distinguishing-cases Preserves active-before-close, unchanged-after-close and not-yet-open source cases; drain windows, sill gates and full source/return balance belong to other ledger entries.
 * @evidence contracts/testing.md#execution-ownership This named portable unit owns the absolute CPU source-window observations using shared authored records, without a timer, process, audio clock or renderer.
 */
export function test_fluid_source_window_ledger(): void {
  const steps: number = 400;
  const dt: number = fountain({}).solver.fixedStepSeconds;
  const windowed: ReturnType<typeof fountain> = fountain({ sources: [{ ...SOURCE, end: 1 }] });
  const atClose: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(windowed, Math.round(1 / dt));
  const later: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(windowed, steps);
  const notYet: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(
    fountain({ sources: [{ ...SOURCE, start: 1_000 }] }),
    steps,
  );

  TestValidator.predicate("closed source adds no later volume", Object.is(later.sourceVolume, atClose.sourceVolume) && nclose(later.sourceVolume, atClose.sourceVolume, 0));
  TestValidator.predicate("source delivers while open", atClose.sourceVolume > 0);
  TestValidator.predicate("future source adds no volume", Object.is(notYet.sourceVolume, 0) && nclose(notYet.sourceVolume, 0, 0));
}
