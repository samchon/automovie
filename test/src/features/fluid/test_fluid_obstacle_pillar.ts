import { simulateFluidDomain } from "@automovie/engine";
import type {
  IAutoMovieFluidDomain,
  IAutoMovieFluidState,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { flatBasin } from "../internal/fluidFixtures";
import { nclose } from "../internal/predicates";

const COLUMNS: number = 6;
const ROWS: number = 6;
const PILLAR_COLUMN: number = 3;
const PILLAR_ROW: number = 3;
const PILLAR: number = PILLAR_ROW * COLUMNS + PILLAR_COLUMN;

/** Build the original 6x6 fed basin with one dry solid interior cell and fresh depth/solid arrays; the owning entry observes all four reflecting pillar faces. */
const withPillar: () => IAutoMovieFluidDomain = (): IAutoMovieFluidDomain => {
  const solid: boolean[] = new Array<boolean>(COLUMNS * ROWS).fill(false);
  solid[PILLAR] = true;
  const depth: number[] = new Array<number>(COLUMNS * ROWS).fill(0.25);
  depth[PILLAR] = 0;
  return flatBasin({
    columns: COLUMNS,
    rows: ROWS,
    depth: 0.25,
    overrides: {
      id: "pillared-pond",
      solid,
      depth,
      sources: [
        {
          id: "inlet",
          column: 0,
          row: PILLAR_ROW,
          flowRate: 0.05,
          start: 0,
          end: null,
        },
      ],
    },
  });
};

/**
 * A solid cell is a pier standing in the pond: it holds no water, every face
 * touching it reflects, and the flow routes around it instead of through it.
 *
 * The interior pillar exposes all four adjacent faces rather than sharing a grid boundary. Nonzero pillar depth or an adjacent velocity at steps 1, 60 or 400 fails an independent zero witness; temporary departures between those observations are not tested.
 *
 * Scenarios:
 *
 * 1. The pillar holds exactly zero water at every sampled step, even while a jet
 *    on the far side of the pond is raising the surface around it.
 * 2. All four faces of the pillar carry exactly zero velocity: the reflecting
 *    condition, on the inside of the lattice rather than at its rim.
 * 3. Water still reaches the cell directly behind the pillar, so the obstacle
 *    diverts the flow rather than damming the pond.
 * 4. Mass balance closes around the obstacle: nothing is lost inside it.
 *
 * @evidence contracts/testing.md#behavioral-verification Simulates a fed basin with a central solid pillar at steps 1, 60 and 400, requiring zero pillar depth and all four adjacent velocities while flow reaches behind it and volume closes.
 * @evidence contracts/testing.md#independent-expectations A solid cell holds no water and every adjacent face reflects; authored depth times cell area plus booked source determines volume, with no implementation output used to manufacture the expected dry faces.
 * @evidence contracts/testing.md#distinguishing-cases Keeps the interior obstacle exposed on all four sides, the downstream wet cell and sampled mass balance; boundary walls, raised dry bed and larger channel circulation are separate entries.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns the three portable CPU simulations and field assertions through actual engine calls, without mesh generation, renderer or real host.
 */
export function test_fluid_obstacle_pillar(): void {
  const domain: ReturnType<typeof withPillar> = withPillar();
  const authored: number = domain.depth.reduce(
    (sum: number, value: number): number => sum + value * 0.25,
    0,
  );
  const states: IAutoMovieFluidState[] = [1, 60, 400].map(
    (step: number): ReturnType<typeof simulateFluidDomain> =>
      simulateFluidDomain(domain, step),
  );
  const last: IAutoMovieFluidState = states[states.length - 1];
  const behind: number = PILLAR_ROW * COLUMNS + PILLAR_COLUMN + 1;

  TestValidator.predicate(
    "pillar stays exactly dry",
    states.every(
      (state: IAutoMovieFluidState): boolean =>
        Object.is(state.depth[PILLAR], 0) && nclose(state.depth[PILLAR], 0, 0),
    ),
  );
  TestValidator.predicate(
    "pillar west face stays still",
    states.every(
      (state: IAutoMovieFluidState): boolean =>
        Object.is(
          state.velocityX[PILLAR_ROW * (COLUMNS + 1) + PILLAR_COLUMN],
          0,
        ) &&
        nclose(
          state.velocityX[PILLAR_ROW * (COLUMNS + 1) + PILLAR_COLUMN],
          0,
          0,
        ),
    ),
  );
  TestValidator.predicate(
    "pillar east face stays still",
    states.every(
      (state: IAutoMovieFluidState): boolean =>
        Object.is(
          state.velocityX[PILLAR_ROW * (COLUMNS + 1) + PILLAR_COLUMN + 1],
          0,
        ) &&
        nclose(
          state.velocityX[PILLAR_ROW * (COLUMNS + 1) + PILLAR_COLUMN + 1],
          0,
          0,
        ),
    ),
  );
  TestValidator.predicate(
    "pillar south face stays still",
    states.every(
      (state: IAutoMovieFluidState): boolean =>
        Object.is(state.velocityZ[PILLAR_ROW * COLUMNS + PILLAR_COLUMN], 0) &&
        nclose(state.velocityZ[PILLAR_ROW * COLUMNS + PILLAR_COLUMN], 0, 0),
    ),
  );
  TestValidator.predicate(
    "pillar north face stays still",
    states.every(
      (state: IAutoMovieFluidState): boolean =>
        Object.is(
          state.velocityZ[(PILLAR_ROW + 1) * COLUMNS + PILLAR_COLUMN],
          0,
        ) &&
        nclose(
          state.velocityZ[(PILLAR_ROW + 1) * COLUMNS + PILLAR_COLUMN],
          0,
          0,
        ),
    ),
  );
  TestValidator.predicate(
    "water raises the downstream cell",
    last.depth[behind] > 0.25,
  );
  TestValidator.predicate(
    "sampled pillar-basin mass balance",
    states.every((state: IAutoMovieFluidState): boolean =>
      nclose(
        state.volume,
        authored + state.sourceVolume - state.drainVolume,
        1e-9,
      ),
    ),
  );
  TestValidator.predicate(
    "walled pillar basin books zero outflow",
    Object.is(last.outflowVolume, 0) && nclose(last.outflowVolume, 0, 0),
  );
}
