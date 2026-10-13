import {simulateFluidDomain} from "@automovie/engine";
import {TestValidator} from "@nestia/e2e";
import {namedFacts} from "../internal/predicates";
import {flatBasin} from "../internal/fluidFixtures";

/**
 * The positivity limiter books only the water actually held by the one-cell sump; a later absolute seek cannot draw below its sill.
 *
 * Scenarios:
 * 1. A 1 x 1-metre cell with 0.5 cubic metres water and a 64 cubic metres per second drain is observed after one step.
 * 2. At the original step 200 it remains empty and the booked drain remains exactly 0.5 cubic metres.
 */
export const test_fluid_drain_positivity_ledger=():void=>{
  const overEager = flatBasin({
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
  const emptied = simulateFluidDomain(overEager, 1);
  const stayed = simulateFluidDomain(overEager, 200);
  TestValidator.equals(
    "the limiter scales a drain to exactly the water available",
    namedFacts([
      ["emptiedExactly", () => Object.is(emptied.depth[0], 0)],
      ["bookedExactly", () => Object.is(emptied.drainVolume, 0.5)],
      ["stayedEmpty", () => Object.is(stayed.depth[0], 0)],
      ["stayedBooked", () => Object.is(stayed.drainVolume, 0.5)],
    ]),
    {
      emptiedExactly: true,
      bookedExactly: true,
      stayedEmpty: true,
      stayedBooked: true,
    },
  );
};
