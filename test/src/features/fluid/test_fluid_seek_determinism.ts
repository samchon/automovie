import type { IAutoMovieFluidDomain } from "@automovie/interface";
import {
  fluidStateDigest,
  sampleFluidDomain,
  simulateFluidDomain,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { exactArray, flatBasin } from "../internal/fluidFixtures";
import { namedFacts, throwsError, nclose } from "../internal/predicates";

/** Build the original disturbed 6x4 domain with live source, drain and drag, capped at step 64; the owning entry observes order, repeat and seek-boundary behavior. */
const seekable: () => IAutoMovieFluidDomain = (): IAutoMovieFluidDomain => {
  const depth: number[] = new Array<number>(24).fill(0.25);
  depth[9] = 0.5;
  return flatBasin({
    columns: 6,
    rows: 4,
    depth: 0.25,
    overrides: {
      id: "seekable",
      depth,
      solver: {
        fixedStepSeconds: 0.015625,
        gravity: 8,
        drag: 0.5,
        dryDepth: 0,
        referenceDepth: 0.5,
        maxSteps: 64,
      },
      sources: [
        { id: "jet", column: 1, row: 1, flowRate: 0.05, start: 0, end: null },
      ],
      drains: [
        {
          id: "return",
          column: 4,
          row: 2,
          flowRate: 0.02,
          sillLevel: 0.1,
          start: 0,
          end: null,
        },
      ],
    },
  });
};

/**
 * Observe absolute CPU seeks in the selected scrambled order and repeated
 * requests at step 40, including fixed-step time snapping and refusal bounds.
 *
 * Absolute seeking supports shot scrubbing and replay without call-order state. This entry observes one in-process domain with a source, drain, drag and off-centre disturbance; it does not launch workers or prove another host's arithmetic.
 *
 * Scenarios:
 *
 * 1. Steps 0..16 requested in the selected scrambled order have matching
 *    eight-character digests; hash equality alone is not field identity.
 * 2. Asking twice for step 40 returns bit-identical depth/velocity arrays, volume and ledger scalars, plus the same digest.
 * 3. At 9.75 steps the sample is step 9; the exact tenth boundary is step 10, while negative and zero times are step 0. These cases do not exercise the sampler's near-boundary 1e-9 step-fraction allowance.
 * 4. An unreachable seek is refused rather than guessed: a fractional step, a
 *    negative step, a step past the declared budget, and a non-finite sample
 *    time each throw with the domain named.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs scrambled and ascending absolute seeks, repeated step-40 field comparisons, time snapping and invalid seeks; catches retained call-order state, changed floor semantics and missing budget/time refusals.
 * @evidence contracts/testing.md#independent-expectations Literal scramble order and fixed dt define seek/time expectations; step-40 strict field/ledger equality tests repeatability, while step-0-through-16 hash agreement has the documented 32-bit collision limitation and is not a full-field oracle.
 * @evidence contracts/testing.md#distinguishing-cases Retains zero-through-16 order samples, repeated step 40, inside/boundary/negative/zero time, fractional/negative/over-budget steps, accepted exact budget and NaN time; physics accuracy belongs to hand-math and conservation entries.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns portable absolute CPU calls and refusal-message fragments, without a frame loop, worker process, GPU or cross-platform execution.
 */
export function test_fluid_seek_determinism(): void {
  const domain: ReturnType<typeof seekable> = seekable();
  const ascending: string[] = Array.from({ length: 17 }, (_: unknown, step: number): string =>
    fluidStateDigest(simulateFluidDomain(domain, step)),
  );
  const scrambled: number[] = [13, 0, 7, 16, 2, 11, 4, 9, 15, 1, 6, 12, 3, 10, 5, 8, 14];
  TestValidator.equals(
    "an absolute seek does not care what was sampled before it",
    namedFacts([
      [
        "digestsMatch",
        (): boolean =>
          scrambled.every(
            (step: number): boolean =>
              fluidStateDigest(simulateFluidDomain(domain, step)) ===
              ascending[step],
          ),
      ],
      ["digestsMove", (): boolean => new Set(ascending).size === ascending.length],
    ]),
    { digestsMatch: true, digestsMove: true },
  );

  const once: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(domain, 40);
  const twice: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(domain, 40);
  TestValidator.predicate("repeat seek preserves exact depth", exactArray(once.depth, twice.depth) && once.depth.every((value: number, index: number): boolean => nclose(value, twice.depth[index]!, 0)));
  TestValidator.predicate("repeat seek preserves exact X velocity", exactArray(once.velocityX, twice.velocityX) && once.velocityX.every((value: number, index: number): boolean => nclose(value, twice.velocityX[index]!, 0)));
  TestValidator.predicate("repeat seek preserves exact Z velocity", exactArray(once.velocityZ, twice.velocityZ) && once.velocityZ.every((value: number, index: number): boolean => nclose(value, twice.velocityZ[index]!, 0)));
  TestValidator.predicate("repeat seek preserves exact volume", Object.is(once.volume, twice.volume) && nclose(once.volume, twice.volume, 0));
  TestValidator.predicate("repeat seek preserves exact source booking", Object.is(once.sourceVolume, twice.sourceVolume) && nclose(once.sourceVolume, twice.sourceVolume, 0));
  TestValidator.predicate("repeat seek preserves exact drain booking", Object.is(once.drainVolume, twice.drainVolume) && nclose(once.drainVolume, twice.drainVolume, 0));
  TestValidator.predicate("repeat seek preserves exact outflow booking", Object.is(once.outflowVolume, twice.outflowVolume) && nclose(once.outflowVolume, twice.outflowVolume, 0));
  TestValidator.equals("repeat seek preserves digest", fluidStateDigest(once), fluidStateDigest(twice));

  const dt: number = domain.solver.fixedStepSeconds;
  TestValidator.equals(
    "a shot second snaps down to its fixed step",
    namedFacts([
      ["inside", (): boolean => sampleFluidDomain(domain, dt * 9.75).step === 9],
      ["boundary", (): boolean => sampleFluidDomain(domain, dt * 10).step === 10],
      ["negative", (): boolean => sampleFluidDomain(domain, -5).step === 0],
      ["zero", (): boolean => sampleFluidDomain(domain, 0).step === 0],
      [
        "sameAsSeek",
        (): boolean =>
          fluidStateDigest(sampleFluidDomain(domain, dt * 9.75)) ===
          ascending[9],
      ],
    ]),
    {
      inside: true,
      boundary: true,
      negative: true,
      zero: true,
      sameAsSeek: true,
    },
  );

  TestValidator.equals(
    "an unreachable seek is refused, never guessed",
    namedFacts([
      [
        "fractional",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof simulateFluidDomain> => simulateFluidDomain(domain, 1.5),
            ["seekable", "non-negative integer"],
          ),
      ],
      [
        "negativeStep",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof simulateFluidDomain> => simulateFluidDomain(domain, -1),
            ["seekable", "non-negative integer"],
          ),
      ],
      [
        "pastBudget",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof simulateFluidDomain> => simulateFluidDomain(domain, 65),
            ["seekable", "budget stops at 64"],
          ),
      ],
      ["atBudget", (): boolean => simulateFluidDomain(domain, 64).step === 64],
      [
        "nonFiniteTime",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof sampleFluidDomain> => sampleFluidDomain(domain, Number.NaN),
            ["seekable", "non-finite time"],
          ),
      ],
    ]),
    {
      fractional: true,
      negativeStep: true,
      pastBudget: true,
      atBudget: true,
      nonFiniteTime: true,
    },
  );
}
