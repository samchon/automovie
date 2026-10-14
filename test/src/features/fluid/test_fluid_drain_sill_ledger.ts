import {simulateFluidDomain} from "@automovie/engine";
import {TestValidator} from "@nestia/e2e";
import { nclose } from "../internal/predicates";
import {createFountainLedgerDomain as fountain} from "../internal/createFountainLedgerDomain";
import {FOUNTAIN_LEDGER_SOURCE as SOURCE} from "../internal/FOUNTAIN_LEDGER_SOURCE";
import {FOUNTAIN_LEDGER_DRAIN as DRAIN} from "../internal/FOUNTAIN_LEDGER_DRAIN";

/**
 * A drain whose sill stays above the water cannot remove any volume while the declared jet continues to deliver.
 *
 * Scenarios:
 * 1. The unchanged 6 x 6 basin uses a .5-metre return sill for 400 steps.
 * 2. Drain volume stays exactly positive zero and source volume remains positive.
 *
 * @evidence contracts/testing.md#behavioral-verification Simulates the original fountain for 400 steps with a raised return sill and requires positive source booking with exactly zero drained volume.
 * @evidence contracts/testing.md#independent-expectations The authored 0.5-metre sill supplies the drain's strict step-start free-surface gate and the source remains active. Zero drain booking pins this basin at step 400; the test does not independently sample every intermediate drain-cell surface or derive a general hydraulic bound.
 * @evidence contracts/testing.md#distinguishing-cases Retains the otherwise unchanged source/drain basin and raised-sill negative twin at step 400; an active lower sill, closing window and over-eager limiter have separate ledger owners.
 * @evidence contracts/testing.md#execution-ownership This named portable unit owns one absolute CPU solve and ledger observation with shared source-data fixtures, without a host, renderer or temporal playback.
 */
export function test_fluid_drain_sill_ledger(): void {
  const steps: number = 400;
  const shutSill: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(
    fountain({
      sources: [SOURCE],
      drains: [{ ...DRAIN, sillLevel: 0.5 }],
    }),
    steps,
  );
  TestValidator.predicate("raised sill has zero booked drain", Object.is(shutSill.drainVolume, 0) && nclose(shutSill.drainVolume, 0, 0));
  TestValidator.predicate("raised-sill twin keeps the source active", shutSill.sourceVolume > 0);
}
