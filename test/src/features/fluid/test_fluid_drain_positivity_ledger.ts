import {simulateFluidDomain} from "@automovie/engine";
import {TestValidator} from "@nestia/e2e";
import { nclose } from "../internal/predicates";
import {flatBasin} from "../internal/fluidFixtures";

/**
 * The positivity limiter books only the water actually held by the one-cell sump; a later absolute seek cannot draw below its sill.
 *
 * Scenarios:
 * 1. A 1 x 1-metre cell with 0.5 cubic metres water and a 64 cubic metres per second drain is observed after one step.
 * 2. At the original step 200 it remains empty and the booked drain remains exactly 0.5 cubic metres.
 *
 * @evidence contracts/testing.md#behavioral-verification Simulates a one-cell sump with an over-eager drain at steps 1 and 200 and requires zero remaining depth plus exactly the available half-cubic-metre drain booking.
 * @evidence contracts/testing.md#independent-expectations One square metre times authored depth 0.5 gives available volume 0.5, independent of solver output; strict zero and booking identity catch overdraw or repeated removal.
 * @evidence contracts/testing.md#distinguishing-cases Keeps the first-step exhaustion and later unchanged empty/booked twin; above-water sills and closed activity windows are separate drain ledger entries.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns both absolute CPU seeks through simulateFluidDomain and the existing basin fixture, without starting a process, renderer or native host.
 */
export function test_fluid_drain_positivity_ledger(): void {
  const overEager: ReturnType<typeof flatBasin> = flatBasin({
    columns: 1,
    rows: 1,
    depth: 0.5,
    overrides: {
      id: "sump",
      grid: {
        columns: 1,
        rows: 1,
        cellX: 1,
        cellZ: 1,
        origin: { x: 0, y: 0, z: 0 },
      },
      drains: [
        {
          id: "sump-drain",
          column: 0,
          row: 0,
          flowRate: 64,
          sillLevel: 0,
          start: 0,
          end: null,
        },
      ],
    },
  });
  const emptied: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(overEager, 1);
  const stayed: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(overEager, 200);
  TestValidator.predicate("first step empties exactly the held water", Object.is(emptied.depth[0], 0) && nclose(emptied.depth[0], 0, 0));
  TestValidator.predicate("first step books exactly half a cubic metre", Object.is(emptied.drainVolume, 0.5) && nclose(emptied.drainVolume, 0.5, 0));
  TestValidator.predicate("later sump stays empty", Object.is(stayed.depth[0], 0) && nclose(stayed.depth[0], 0, 0));
  TestValidator.predicate("later drain booking does not grow", Object.is(stayed.drainVolume, 0.5) && nclose(stayed.drainVolume, 0.5, 0));
}
