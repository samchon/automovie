import { simulateFluidDomain } from "@automovie/engine";
import type {
  IAutoMovieFluidDomain,
  IAutoMovieFluidState,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { flatBasin } from "../internal/fluidFixtures";
import { nclose } from "../internal/predicates";

/** Original square channel side length in cells. */
const SIDE: number = 7;
/** Middle row and column of the seven-cell channel. */
const MID: number = 3;

/** Build the original symmetric channel around a dry 3x3 island, with west feed and east sill-gated return; no validator or solver executes during record construction. */
const courtyardChannel: () => IAutoMovieFluidDomain =
  (): IAutoMovieFluidDomain => {
    const cells: number = SIDE * SIDE;
    const solid: boolean[] = new Array<boolean>(cells).fill(false);
    const depth: number[] = new Array<number>(cells).fill(0.25);
    for (let row: number = 2; row <= 4; ++row)
      for (let column: number = 2; column <= 4; ++column) {
        solid[row * SIDE + column] = true;
        depth[row * SIDE + column] = 0;
      }
    return flatBasin({
      columns: SIDE,
      rows: SIDE,
      depth: 0.25,
      overrides: {
        id: "courtyard-channel",
        solid,
        depth,
        solver: {
          fixedStepSeconds: 0.015625,
          gravity: 8,
          drag: 0.25,
          dryDepth: 0,
          referenceDepth: 0.5,
          maxSteps: 5_000,
        },
        sources: [
          {
            id: "feed",
            column: 0,
            row: MID,
            flowRate: 0.04,
            start: 0,
            end: null,
          },
        ],
        drains: [
          {
            id: "return",
            column: SIDE - 1,
            row: MID,
            flowRate: 0.04,
            sillLevel: 0.25,
            start: 0,
            end: null,
          },
        ],
      },
    });
  };

/**
 * A source and return separated by a solid island produce far-side depth change, nonzero X/Z velocities and sampled depth symmetry in a two-dimensional channel.
 *
 * The island, source and return are symmetric about the middle row, giving an independent reflection oracle. An asymmetric update that changes the selected depth fields fails their exact comparison; separate velocity symmetry and transport in each arm are not independently measured.
 *
 * Scenarios:
 *
 * 1. At step 800 the cell beside the far return has risen above 0.25 m, the return has booked positive removal and the island's central cell remains exactly dry.
 * 2. Both velocity axes have at least one nonzero face at step 800; this does not independently measure transport in each channel arm.
 * 3. The depth field is exactly mirror symmetric about the middle row at every
 *    sampled step.
 * 4. The books close: `volume = authored + source − drain`, with outflow exactly
 *    zero because the courtyard is walled.
 *
 * @evidence contracts/testing.md#behavioral-verification Simulates the source/return channel at steps 40, 200 and 800, checks exact mirrored depths and mass balance at all three, then far-side rise, nonzero X/Z velocity, a dry central island cell and zero outflow at step 800. Other island cells and separate arm transport are not observed independently.
 * @evidence contracts/testing.md#independent-expectations Authored mirror geometry requires equal reflected depths and initial cell area determines conserved volume plus booked flows; these assertions observe only the selected CPU steps, not unbounded or cross-platform stability.
 * @evidence contracts/testing.md#distinguishing-cases Keeps symmetric positive source/drain circulation and the solid central island, with strict mirror comparison and both velocity axes; asymmetric geometry, dry shoreline and open boundaries have separate entries.
 * @evidence contracts/testing.md#execution-ownership The synchronous named unit owns the three absolute CPU simulations and in-memory field/ledger assertions; no incremental host, renderer or GPU state is tested.
 */
export function test_fluid_channel_circulation(): void {
  const domain: ReturnType<typeof courtyardChannel> = courtyardChannel();
  const authored: number = domain.depth.reduce(
    (sum: number, value: number): number => sum + value * 0.25,
    0,
  );
  const states: IAutoMovieFluidState[] = [40, 200, 800].map(
    (step: number): ReturnType<typeof simulateFluidDomain> =>
      simulateFluidDomain(domain, step),
  );
  const last: IAutoMovieFluidState = states[states.length - 1];
  /** Compare the sampled dense depth field with its authored row reflection, retaining signed-zero identity and zero-tolerance numeric agreement. */
  const mirror: (state: (typeof states)[number]) => boolean = (
    state: (typeof states)[number],
  ): boolean => {
    for (let row: number = 0; row < SIDE; ++row)
      for (let column: number = 0; column < SIDE; ++column)
        if (
          !(
            Object.is(
              state.depth[row * SIDE + column],
              state.depth[(SIDE - 1 - row) * SIDE + column],
            ) &&
            nclose(
              state.depth[row * SIDE + column],
              state.depth[(SIDE - 1 - row) * SIDE + column],
              0,
            )
          )
        )
          return false;
    return true;
  };

  TestValidator.predicate(
    "water raises the far-side cell",
    last.depth[MID * SIDE + SIDE - 2] > 0.25,
  );
  TestValidator.predicate("return drain has opened", last.drainVolume > 0);
  TestValidator.predicate(
    "channel carries Z velocity",
    last.velocityZ.some(
      (value: number): boolean => nclose(value, 0, 0) === false,
    ),
  );
  TestValidator.predicate(
    "channel carries X velocity",
    last.velocityX.some(
      (value: number): boolean => nclose(value, 0, 0) === false,
    ),
  );
  TestValidator.predicate(
    "central island cell stays dry",
    Object.is(last.depth[MID * SIDE + MID], 0) &&
      nclose(last.depth[MID * SIDE + MID], 0, 0),
  );
  TestValidator.predicate(
    "sampled depth fields retain exact mirror symmetry",
    states.every(mirror),
  );
  TestValidator.predicate(
    "sampled channel mass balance",
    states.every((state: IAutoMovieFluidState): boolean =>
      nclose(
        state.volume,
        authored + state.sourceVolume - state.drainVolume,
        1e-9,
      ),
    ),
  );
  TestValidator.predicate(
    "channel books zero boundary outflow",
    Object.is(last.outflowVolume, 0) && nclose(last.outflowVolume, 0, 0),
  );
}
