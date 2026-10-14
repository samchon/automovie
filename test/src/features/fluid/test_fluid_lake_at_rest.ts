import { simulateFluidDomain } from "@automovie/engine";
import type { IAutoMovieFluidDomain } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { exactArray, fluidDomain } from "../internal/fluidFixtures";
import { nclose } from "../internal/predicates";

/** Original stepped dyadic bed heights, in row-major metres. */
const BED: number[] = [
  0, 0, 0.25, 0.5, 0, 0.25, 0.5, 0.75, 0.25, 0.5, 0.75, 0.75, 0.5, 0.75, 0.75,
  0.75,
];
/** Authored common free-surface elevation of wet cells in metres. */
const LEVEL: number = 0.5;
/** Independently authored level-minus-bed wet depth, with zero on tied or higher shore. */
const DEPTH: number[] = BED.map((bed: number): number =>
  bed < LEVEL ? LEVEL - bed : 0,
);

/** Construct the original stepped pond, borrowing either the level depths or the owning entry's one-cell disturbance without running the solver. */
const restingPond: (depth?: number[]) => IAutoMovieFluidDomain = (
  depth: number[] = DEPTH,
): IAutoMovieFluidDomain =>
  fluidDomain({
    id: "still-pond",
    grid: {
      columns: 4,
      rows: 4,
      cellX: 0.5,
      cellZ: 0.5,
      origin: { x: 0, y: 0, z: 0 },
    },
    solver: {
      fixedStepSeconds: 0.015625,
      gravity: 8,
      drag: 0,
      dryDepth: 0,
      referenceDepth: 0.5,
      maxSteps: 5_000,
    },
    bed: BED,
    depth,
    solid: new Array<boolean>(16).fill(false),
  });

/**
 * An indoor still pond over an uneven bed with a dry shore is a numerically
 * **exact** fixed point of the solver, and a pond one drop out of level is
 * not.
 *
 * This is the well-balanced (C-property) oracle of the shallow-water scheme,
 * and it is what makes a mirror pool in an atrium hold still instead of
 * developing spurious currents down its own bed slope. It holds exactly, not
 * approximately, because the pressure term reads the free surface `η = b + h`
 * rather than the depth: with every bed and level a dyadic rational, `Δη` is
 * exactly zero. This entry checks the resulting fixed point at step 300,
 * without observing unbounded future steps or another platform.
 *
 * The shore covers both wetting-and-drying arms: a cell whose bed stands
 * strictly above the water (`0.75 > 0.5`) and the exact-tie cell whose bed sits
 * precisely at the water level (`0.5 == 0.5`), which must also refuse to draw
 * water uphill.
 *
 * Scenarios:
 *
 * 1. After 300 steps every depth is bit-identical to the authored one.
 * 2. After 300 steps every face velocity is still exactly zero.
 * 3. The volume is exactly the hand-computed 0.5625 m³ and the ledger is empty.
 * 4. The negative twin: raising the first wet cell by 0.0625 m breaks the level,
 *    and one single step already moves both the surface and the velocity
 *    field.
 *
 * @evidence contracts/testing.md#behavioral-verification Simulates the authored level pond over stepped bed at step 300 and requires unchanged depth, zero velocities, exact volume and zero source/drain/outflow ledgers; raising the first wet cell distinguishes depth and both velocity-axis changes after one step.
 * @evidence contracts/testing.md#independent-expectations Bed plus wet depth equals the authored half-metre level, with dry tie/above-level shore and hand-summed volume 0.5625; literal dyadic values and strict identity avoid output snapshots, without proving unbounded future stability.
 * @evidence contracts/testing.md#distinguishing-cases Preserves wet cells, above-level and exact-tie dry shore, the 300-step fixed point and one-cell 0.0625 disturbance at step 1; reachable wetting and other wall/flow decisions have separate entries.
 * @evidence contracts/testing.md#execution-ownership This named portable unit owns both absolute CPU solves and field/ledger assertions; it does not run another platform, a GPU solver, browser or native artifact.
 */
export function test_fluid_lake_at_rest(): void {
  const domain: ReturnType<typeof restingPond> = restingPond();
  const settled: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(
    domain,
    300,
  );
  TestValidator.predicate(
    "step 300 unchanged depth",
    exactArray(settled.depth, DEPTH) &&
      settled.depth.every((value: number, index: number): boolean =>
        nclose(value, DEPTH[index]!, 0),
      ),
  );
  TestValidator.predicate(
    "step 300 X faces at rest",
    settled.velocityX.every(
      (value: number): boolean => Object.is(value, 0) && nclose(value, 0, 0),
    ),
  );
  TestValidator.predicate(
    "step 300 Z faces at rest",
    settled.velocityZ.every(
      (value: number): boolean => Object.is(value, 0) && nclose(value, 0, 0),
    ),
  );
  TestValidator.predicate(
    "step 300 hand-summed volume",
    Object.is(settled.volume, 0.5625) && nclose(settled.volume, 0.5625, 0),
  );
  TestValidator.predicate(
    "step 300 empty outflow ledger",
    Object.is(settled.outflowVolume, 0) && nclose(settled.outflowVolume, 0, 0),
  );
  TestValidator.predicate(
    "step 300 empty source ledger",
    Object.is(settled.sourceVolume, 0) && nclose(settled.sourceVolume, 0, 0),
  );
  TestValidator.predicate(
    "step 300 empty drain ledger",
    Object.is(settled.drainVolume, 0) && nclose(settled.drainVolume, 0, 0),
  );

  const tilted: number[] = DEPTH.slice();
  tilted[0] = DEPTH[0] + 0.0625;
  const disturbed: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(
    restingPond(tilted),
    1,
  );
  TestValidator.predicate(
    "disturbed depth moves at step 1",
    (exactArray(disturbed.depth, tilted) &&
      disturbed.depth.every((value: number, index: number): boolean =>
        nclose(value, tilted[index]!, 0),
      )) === false,
  );
  TestValidator.predicate(
    "disturbed X velocity moves at step 1",
    disturbed.velocityX.some(
      (value: number): boolean => nclose(value, 0, 0) === false,
    ),
  );
  TestValidator.predicate(
    "disturbed Z velocity moves at step 1",
    disturbed.velocityZ.some(
      (value: number): boolean => nclose(value, 0, 0) === false,
    ),
  );
}
