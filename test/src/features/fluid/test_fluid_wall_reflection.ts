import { simulateFluidDomain } from "@automovie/engine";
import type {
  IAutoMovieFluidDomain,
  IAutoMovieFluidState,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { flatBasin } from "../internal/fluidFixtures";
import { nclose } from "../internal/predicates";

/** A basin with a symmetric bump, walled all round. */
const sloshingBasin: () => IAutoMovieFluidDomain =
  (): IAutoMovieFluidDomain => {
    const columns: number = 8;
    const rows: number = 1;
    const depth: number[] = new Array<number>(columns * rows).fill(0.25);
    depth[3] = 0.5;
    depth[4] = 0.5;
    return flatBasin({
      columns,
      rows,
      depth: 0.25,
      overrides: { id: "sloshing", depth },
    });
  };

/**
 * A disturbed walled basin has zero boundary-normal velocity and mirror-symmetric depths at the selected integration steps.
 *
 * Opposite surface gradients and paired fluxes supply the symmetry oracle; an asymmetric update can change the final bits. The test observes sampled depths and wall faces, not a reversal of wave travel direction or every intervening step.
 *
 * Scenarios:
 *
 * 1. Both outermost x faces are pinned to exactly zero at every sampled step:
 *    nothing crosses a wall.
 * 2. The volume held at step 400 equals the authored volume, and the ledger
 *    records exactly zero source, drain, and outflow.
 * 3. The depth field is exactly mirror-symmetric at steps 40, 160 and 400: the
 *    moving field retains the authored mirror relation at those observations.
 * 4. The wave really did move — the depth field at step 40 differs from the
 *    authored one — so the symmetry above is not the symmetry of a still pond.
 *
 * @evidence contracts/testing.md#behavioral-verification Simulates the disturbed walled basin and checks zero external X/Z face velocities, conserved volume and zero ledgers, exact mirrored depths at steps 40/160/400 and changed depth at step 40; a motion-direction reversal is not observed here.
 * @evidence contracts/testing.md#independent-expectations Reflecting wall boundaries independently forbid normal edge velocity while the authored perturbation must drive an interior gradient; initial depth times cell area supplies the volume oracle.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the two X edges and all Z faces of the one-row grid, mirrored depth equality at steps 40, 160 and 400 and the changed-depth twin; open outflow, solid interior obstacles and raised dry shore are separate entries.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns its portable absolute CPU solves and field observations with existing fixtures, without running another platform, native host or renderer.
 */
export function test_fluid_wall_reflection(): void {
  const domain: ReturnType<typeof sloshingBasin> = sloshingBasin();
  const authoredVolume: number = domain.depth.reduce(
    (sum: number, value: number): number =>
      sum + value * domain.grid.cellX * domain.grid.cellZ,
    0,
  );
  const samples: IAutoMovieFluidState[] = [40, 160, 400].map(
    (step: number): ReturnType<typeof simulateFluidDomain> =>
      simulateFluidDomain(domain, step),
  );

  TestValidator.predicate(
    "both X wall faces stay pinned",
    samples.every(
      (state: IAutoMovieFluidState): boolean =>
        Object.is(state.velocityX[0], 0) &&
        nclose(state.velocityX[0], 0, 0) &&
        Object.is(state.velocityX[state.velocityX.length - 1], 0) &&
        nclose(state.velocityX[state.velocityX.length - 1], 0, 0),
    ),
  );
  TestValidator.predicate(
    "all one-row Z wall faces stay pinned",
    samples.every((state: IAutoMovieFluidState): boolean =>
      state.velocityZ.every((value: number): boolean => nclose(value, 0, 0)),
    ),
  );
  TestValidator.predicate(
    "closed ledger stays empty",
    samples.every(
      (state: IAutoMovieFluidState): boolean =>
        Object.is(state.sourceVolume, 0) &&
        nclose(state.sourceVolume, 0, 0) &&
        Object.is(state.drainVolume, 0) &&
        nclose(state.drainVolume, 0, 0) &&
        Object.is(state.outflowVolume, 0) &&
        nclose(state.outflowVolume, 0, 0),
    ),
  );
  TestValidator.predicate(
    "sampled volumes remain conserved",
    samples.every((state: IAutoMovieFluidState): boolean =>
      nclose(state.volume, authoredVolume, 1e-12),
    ),
  );

  TestValidator.predicate(
    "sampled depths remain exactly mirrored",
    samples.every((state: IAutoMovieFluidState): boolean =>
      state.depth.every(
        (value: number, index: number): boolean =>
          Object.is(value, state.depth[state.depth.length - 1 - index]) &&
          nclose(value, state.depth[state.depth.length - 1 - index], 0),
      ),
    ),
  );
  TestValidator.predicate(
    "the field moved at step 40",
    samples[0].depth.some(
      (value: number, index: number): boolean =>
        nclose(value, domain.depth[index], 0) === false,
    ),
  );
}
