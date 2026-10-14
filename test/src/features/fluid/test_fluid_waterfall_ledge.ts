import { simulateFluidDomain } from "@automovie/engine";
import type {
  IAutoMovieFluidDomain,
  IAutoMovieFluidState,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { atLeast, flatBasin } from "../internal/fluidFixtures";
import { namedFacts, nclose, throwsError } from "../internal/predicates";

/** Construct the original six-cell descending bed and initially dry lower reach, shallowly applying only the two malformed-state overrides when requested. */
const ledge: (
  overrides?: Partial<IAutoMovieFluidDomain>,
) => IAutoMovieFluidDomain = (
  overrides: Partial<IAutoMovieFluidDomain> = {},
): IAutoMovieFluidDomain =>
  flatBasin({
    columns: 6,
    rows: 1,
    depth: 0,
    overrides: {
      id: "water-wall",
      bed: [1, 1, 1, 0, 0, 0],
      depth: [0.5, 0.5, 0.5, 0, 0, 0],
      solid: new Array<boolean>(6).fill(false),
      solver: {
        fixedStepSeconds: 0.015625,
        gravity: 8,
        drag: 0,
        dryDepth: 0,
        referenceDepth: 1.5,
        maxSteps: 5_000,
      },
      ...overrides,
    },
  });

/**
 * A shallow-water field redistributes an upper pool into dry cells below a 1 m bed ledge while retaining the authored total volume within tolerance.
 *
 * The ledge is the case a depth-only pressure term gets wrong. Reading the free
 * surface `η = b + h` is what makes the upper pool see a 1.5 m head against dry
 * ground at 0 m and move downhill. The separate lake-at-rest entry uses a different uneven bed with a common free-surface level; this entry does not resolve vertical waterfall physics.
 *
 * Scenarios:
 *
 * 1. The lower basin, authored bone dry, is wet after 400 steps and the upper pool
 *    has lost head.
 * 2. The face at the lip carries a positive velocity: the water is going over the
 *    ledge, in the `+x` direction the bed steps down in.
 * 3. At steps 1, 60 and 400 the volume stays within 1e-12 m³ of the authored 0.375 m³ and every returned depth is nonnegative.
 * 4. A bed at infinity and a depth of NaN each throw a domain-naming nonfinite-state error at the first integration step.
 *
 * @evidence contracts/testing.md#behavioral-verification Simulates water above a descending bed ledge and observes lower wetting, positive lip velocity, sampled nonnegative depth and conserved volume; malformed infinite bed and NaN depth must throw a named first-step nonfinite-state error.
 * @evidence contracts/testing.md#independent-expectations The authored higher free surface and lower reachable bed require downhill movement rather than an uphill blockage; initial cell-area volume provides the independent conservation expectation.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the descending ledge at steps 1, 60 and 400, initially dry lower cells, closed walls and both malformed first-step state refusals; uphill shore and open-rim loss have separate owners, and no resolved vertical waterfall physics is claimed.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns portable shallow-water CPU field/ledger observations, without a three-dimensional fluid solver, particles, renderer or real host.
 */
export function test_fluid_waterfall_ledge(): void {
  const domain: ReturnType<typeof ledge> = ledge();
  const authored: number = 3 * 0.5 * 0.25;
  const states: IAutoMovieFluidState[] = [1, 60, 400].map(
    (step: number): ReturnType<typeof simulateFluidDomain> =>
      simulateFluidDomain(domain, step),
  );
  const last: IAutoMovieFluidState = states[states.length - 1];
  TestValidator.predicate(
    "authored ledge volume",
    nclose(authored, 0.375, 1e-15),
  );
  TestValidator.predicate(
    "lower ledge cells become wet",
    last.depth[3] > 0 && last.depth[5] > 0,
  );
  TestValidator.predicate("upper pool loses depth", last.depth[0] < 0.5);
  TestValidator.predicate(
    "lip velocity points downhill",
    last.velocityX[3] > 0,
  );
  TestValidator.predicate(
    "sampled ledge volumes remain conserved",
    states.every((state: IAutoMovieFluidState): boolean =>
      nclose(state.volume, authored, 1e-12),
    ),
  );
  TestValidator.predicate(
    "sampled ledge depths stay nonnegative",
    states.every((state: IAutoMovieFluidState): boolean =>
      atLeast(state.depth, 0),
    ),
  );
  TestValidator.predicate(
    "closed ledge books zero outflow",
    Object.is(last.outflowVolume, 0) && nclose(last.outflowVolume, 0, 0),
  );

  TestValidator.equals(
    "a non-finite state is named at the step it appeared",
    namedFacts([
      [
        "infiniteBed",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof simulateFluidDomain> =>
              simulateFluidDomain(ledge({ bed: [Infinity, 1, 1, 0, 0, 0] }), 8),
            ["water-wall", "non-finite state at step 1"],
          ),
      ],
      [
        "nanDepth",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof simulateFluidDomain> =>
              simulateFluidDomain(
                ledge({ depth: [Number.NaN, 0.5, 0.5, 0, 0, 0] }),
                8,
              ),
            ["water-wall", "non-finite state at step 1"],
          ),
      ],
    ]),
    { infiniteBed: true, nanDepth: true },
  );
}
