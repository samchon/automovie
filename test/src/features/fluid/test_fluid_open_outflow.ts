import type { IAutoMovieFluidDomain, IAutoMovieFluidState } from "@automovie/interface";
import { simulateFluidDomain } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { atLeast, flatBasin } from "../internal/fluidFixtures";
import { nclose } from "../internal/predicates";

/** Construct the same original basin with only the east wall/open condition and explanatory id switched; both twins keep identical initial water and solver settings. */
const spillway: (open: boolean) => IAutoMovieFluidDomain = (open: boolean): IAutoMovieFluidDomain =>
  flatBasin({
    columns: 8,
    rows: 2,
    depth: 0.5,
    overrides: {
      id: open ? "spillway" : "tank",
      boundaries: {
        xMin: "wall",
        xMax: open ? "open" : "wall",
        zMin: "wall",
        zMax: "wall",
      },
    },
  });

/**
 * An `open` edge spills the basin and books every cubic metre that left; the
 * identical basin closed by a `wall` loses nothing at all.
 *
 * The pair is the point. An open edge is modelled as a permanently dry
 * neighbour at the boundary cell's own bed, so water pours off the rim and can
 * never seep back in, and the volume it carried is added to the ledger rather
 * than vanishing. The walled twin one property away proves the outflow is the
 * boundary condition doing work and not a leak in the flux form.
 *
 * The no-drag half-metre initial depth supplies the open-rim disturbance. Nonnegative sampled depths exercise the returned result, but the test does not independently count positivity-limiter activations or observe every intervening step.
 *
 * Scenarios:
 *
 * 1. The open basin loses water: its volume at step 600 is far below the authored
 *    2 m³ (16 cells of 0.25 m² holding 0.5 m each) and its recorded outflow is
 *    positive.
 * 2. Mass balance closes: `volume = authored + source − drain − outflow` within 1e-9 m³, with source and drain terms exactly zero.
 * 3. Every returned depth is nonnegative at steps 1, 40, 200 and 600.
 * 4. The walled twin keeps its authored volume within 1e-12 m³, retains 0.5 m depth in every cell and books exactly zero outflow.
 *
 * @evidence contracts/testing.md#behavioral-verification Simulates the same basin with open versus walled east rim, requiring sampled outflow and lower remaining volume only for the open twin, nonnegative depths and complete ledger balance.
 * @evidence contracts/testing.md#independent-expectations Sixteen quarter-square-metre cells at half-metre depth give two cubic metres; volume plus outflow closes that total with no sources/drains, and the wall twin independently forbids boundary loss.
 * @evidence contracts/testing.md#distinguishing-cases Preserves sampled steps 1, 40, 200 and 600, the identical walled twin at 600 and no phantom source/drain terms; the assertion does not independently count limiter activations or certify all steps.
 * @evidence contracts/testing.md#execution-ownership This named portable unit owns absolute CPU field/ledger comparisons using existing basin data and starts no incremental simulation host, renderer or GPU.
 */
export function test_fluid_open_outflow(): void {
  const open: ReturnType<typeof spillway> = spillway(true);
  const authored: number = open.depth.reduce(
    (sum: number, value: number): number => sum + value * open.grid.cellX * open.grid.cellZ,
    0,
  );
  const states: IAutoMovieFluidState[] = [1, 40, 200, 600].map((step: number): ReturnType<typeof simulateFluidDomain> =>
    simulateFluidDomain(open, step),
  );
  const last: IAutoMovieFluidState = states[states.length - 1];

  TestValidator.predicate("authored basin holds two cubic metres", nclose(authored, 2, 1e-12));
  TestValidator.predicate("open rim loses more than half its water", last.volume < authored * 0.5);
  TestValidator.predicate("open rim books positive outflow", last.outflowVolume > 0);
  TestValidator.predicate("open-rim mass balance", states.every((state: IAutoMovieFluidState): boolean => nclose(state.volume, authored + state.sourceVolume - state.drainVolume - state.outflowVolume, 1e-9)));
  TestValidator.predicate("open rim invents no source or drain", states.every((state: IAutoMovieFluidState): boolean => Object.is(state.sourceVolume, 0) && nclose(state.sourceVolume, 0, 0) && Object.is(state.drainVolume, 0) && nclose(state.drainVolume, 0, 0)));
  TestValidator.predicate("open-rim sampled depths stay nonnegative", states.every((state: IAutoMovieFluidState): boolean => atLeast(state.depth, 0)));

  const walled: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(spillway(false), 600);
  TestValidator.predicate("walled twin books zero outflow", Object.is(walled.outflowVolume, 0) && nclose(walled.outflowVolume, 0, 0));
  TestValidator.predicate("walled twin retains authored volume", nclose(walled.volume, authored, 1e-12));
  TestValidator.predicate("walled twin retains its uniform depth", walled.depth.every((value: number): boolean => nclose(value, 0.5, 0)));
}
