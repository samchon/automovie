import { simulateFluidDomain } from "@automovie/engine";
import type {
  IAutoMovieFluidDomain,
  IAutoMovieFluidState,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { atLeast, flatBasin } from "../internal/fluidFixtures";
import { nclose } from "../internal/predicates";

/** Build the original one-row strand from borrowed bed/depth arrays with the optional dry threshold; the owning cases derive reachable and blocked cells from these authored levels. */
const strand: (props: {
  bed: number[];
  depth: number[];
  dryDepth?: number;
}) => IAutoMovieFluidDomain = (props: {
  bed: number[];
  depth: number[];
  dryDepth?: number;
}): IAutoMovieFluidDomain =>
  flatBasin({
    columns: props.bed.length,
    rows: 1,
    depth: 0,
    overrides: {
      id: "strand",
      bed: props.bed,
      depth: props.depth,
      solid: new Array<boolean>(props.bed.length).fill(false),
      solver: {
        fixedStepSeconds: 0.015625,
        gravity: 8,
        drag: 0,
        dryDepth: props.dryDepth ?? 0,
        referenceDepth: 1,
        maxSteps: 5_000,
      },
    },
  });

/**
 * Water wets a dry cell it can actually reach, refuses to climb ground standing
 * above its own surface, and never leaves a cell holding a negative depth.
 *
 * The three together are the wetting-and-drying contract. Without the first, a
 * spilled basin would never spread; without the second, a shallow pool would
 * silently pump itself up a step it could not reach and invent surface area;
 * without the third, the flux form would hand the renderer an impossible
 * negative depth and the mass balance would still appear to close.
 *
 * Scenarios:
 *
 * 1. A column of water beside three dry cells over a flat bed spreads into all of
 *    them, and the total volume is unchanged.
 * 2. No depth is ever negative across the sampled steps.
 * 3. Two cells holding 0.5 m depth beside two cells with a 2 m bed height retain zero depth on the raised shore and zero separating-face velocity at step 600, with their authored 0.25 m³ volume conserved.
 * 4. `dryDepth` is a real threshold, not decoration: a 0.05 m film in a cell whose
 *    domain calls anything at or under 0.10 m dry cannot itself feed the next
 *    cell along, which stays exactly zero after the first step.
 *
 * @evidence contracts/testing.md#behavioral-verification Simulates reachable dry cells, an unreachable raised shore and a sub-threshold film; observes spreading, sampled nonnegative depths, conserved volume and blocked transfer at the specified boundaries.
 * @evidence contracts/testing.md#independent-expectations Authored bed/level comparisons and initial cell-area volume define expected wet versus dry decisions; zero blocked faces and the first-step dryDepth threshold are independent physical expectations.
 * @evidence contracts/testing.md#distinguishing-cases Retains steps 1, 20, 120 and 600 for flat spreading, the two-metre step at 600 and the 0.05-versus-0.10 film at step 1; resting uneven bed and solid obstacles belong to other entries.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns these portable absolute CPU field observations with existing fixtures; assertions do not observe every future step or GPU projection.
 */
export function test_fluid_dry_cell_wetting(): void {
  const spreading: ReturnType<typeof strand> = strand({
    bed: [0, 0, 0, 0],
    depth: [0.5, 0, 0, 0],
  });
  const authored: number = 0.5 * 0.25;
  const states: IAutoMovieFluidState[] = [1, 20, 120, 600].map(
    (step: number): ReturnType<typeof simulateFluidDomain> =>
      simulateFluidDomain(spreading, step),
  );
  const settled: IAutoMovieFluidState = states[states.length - 1];
  TestValidator.predicate(
    "reachable cells become wet",
    settled.depth.every((value: number): boolean => value > 0),
  );
  TestValidator.predicate(
    "reachable wetting preserves authored volume",
    nclose(settled.volume, authored, 1e-12),
  );
  TestValidator.predicate(
    "sampled depths remain nonnegative",
    states.every((state: IAutoMovieFluidState): boolean =>
      atLeast(state.depth, 0),
    ),
  );

  const stepped: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(
    strand({ bed: [0, 0, 2, 2], depth: [0.5, 0.5, 0, 0] }),
    600,
  );
  TestValidator.predicate(
    "raised shore stays dry",
    Object.is(stepped.depth[2], 0) && nclose(stepped.depth[2], 0, 0),
  );
  TestValidator.predicate(
    "far raised shore stays dry",
    Object.is(stepped.depth[3], 0) && nclose(stepped.depth[3], 0, 0),
  );
  TestValidator.predicate(
    "raised-shore face stays silent",
    Object.is(stepped.velocityX[2], 0) && nclose(stepped.velocityX[2], 0, 0),
  );
  TestValidator.predicate(
    "raised shore preserves volume",
    nclose(stepped.volume, 0.25, 1e-12),
  );

  const filmed: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(
    strand({ bed: [0, 0, 0, 0], depth: [0.5, 0.05, 0, 0], dryDepth: 0.1 }),
    1,
  );
  TestValidator.predicate(
    "sub-threshold film receives upstream water",
    filmed.depth[1] > 0.05,
  );
  TestValidator.predicate(
    "sub-threshold film does not wet its neighbour",
    Object.is(filmed.depth[2], 0) && nclose(filmed.depth[2], 0, 0),
  );
  TestValidator.predicate(
    "sub-threshold film has no outgoing face speed",
    Object.is(filmed.velocityX[2], 0) && nclose(filmed.velocityX[2], 0, 0),
  );
}
