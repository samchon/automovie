import type { IAutoMovieFluidSpray, IAutoMovieFluidState } from "@automovie/interface";
import {
  fluidCourantNumber,
  fluidDomainBudget,
  fluidStateDigest,
  simulateFluidDomain,
  validateWaterFeatures,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import {
  basinEnvironment,
  flatBasin,
  fluidDomain,
} from "../internal/fluidFixtures";
import { namedFacts, nclose } from "../internal/predicates";

/** Construct the original valid emitter with the requested identity and cap; the owning budget entry sums the two authored caps independently. */
const emitter: (id: string, maxParticles: number) => IAutoMovieFluidSpray = (id: string, maxParticles: number): IAutoMovieFluidSpray => ({
  id,
  column: 0,
  row: 0,
  rate: 8,
  lifetime: 1,
  speed: 2,
  direction: { x: 0, y: 1, z: 0 },
  spread: 0,
  size: 0.05,
  seed: 1,
  maxParticles,
  lodDistance: 10,
});

/**
 * A fluid domain states its own bounded cost before a single step is
 * integrated, and a state's digest is a compact hash of selected state fields.
 *
 * Both exist so a production can be judged rather than trusted: a builder
 * report exposes the declared operation/storage counts, and these cases
 * compare hashes inside one runtime. They do not establish cross-machine
 * identity or collision freedom of the 32-bit digest.
 *
 * Scenarios:
 *
 * 1. The budget of a 6×4 lattice is the hand-computed 24 cells, 58 velocity faces,
 *    656 state bytes, and 24 × `maxSteps` worst-case cell updates; the spray
 *    cap is the sum of the emitters' own caps.
 * 2. The Courant number equals the hand-computed `dt·√(g·H)·√(1/dx² + 1/dz²)` and
 *    is the same number the budget reports.
 * 3. A domain with no emitter reports a spray particle cap of exactly zero; no runtime or heap measurement is made.
 * 4. The digest is eight hex characters, identical for identical states, and
 *    different for the selected one-ulp depth change and adjacent step.
 * 5. Validating empty feature and domain lists against the basin fixture succeeds; this does not execute or observe a complete production.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls fluid budget/Courant readers, simulates selected states and hashes them, and validates an empty water binding; detects wrong lattice/cap counts, wrong Courant reporting and the selected digest regressions.
 * @evidence contracts/testing.md#independent-expectations A 6-by-4 grid gives 24 cells, 58 faces and 656 bytes by independent count, while the documented Courant equation supplies the scalar oracle. Hash comparisons test only selected sensitivity, not collision freedom or cross-machine identity.
 * @evidence contracts/testing.md#distinguishing-cases Retains two emitters with total cap 192, no-emitter budget, identical state repeats, the selected one-ulp depth change, adjacent step and empty features/domains; admission caps and solver physics are separate tests.
 * @evidence contracts/testing.md#execution-ownership This named portable unit owns its budget/hash/binding assertions through engine calls and existing records, without building a renderer or installing a consumer.
 */
export function test_fluid_budget_report(): void {
  const domain: ReturnType<typeof flatBasin> = flatBasin({
    columns: 6,
    rows: 4,
    depth: 0.25,
    overrides: {
      id: "budgeted",
      sprays: [emitter("mist", 128), emitter("veil", 64)],
    },
  });
  const budget: ReturnType<typeof fluidDomainBudget> = fluidDomainBudget(domain);
  TestValidator.equals(
    "the lattice states its own bounded cost",
    namedFacts([
      ["domain", (): boolean => budget.domain === "budgeted"],
      ["cells", (): boolean => budget.cells === 24],
      ["faces", (): boolean => budget.faces === 7 * 4 + 6 * 5],
      ["stateBytes", (): boolean => budget.stateBytes === 8 * (24 + 58)],
      ["maxSteps", (): boolean => budget.maxSteps === domain.solver.maxSteps],
      [
        "worstCase",
        (): boolean => budget.worstCaseCellUpdates === 24 * domain.solver.maxSteps,
      ],
      ["sprayCap", (): boolean => budget.sprayParticleCap === 192],
    ]),
    {
      domain: true,
      cells: true,
      faces: true,
      stateBytes: true,
      maxSteps: true,
      worstCase: true,
      sprayCap: true,
    },
  );

  const expectedCourant: number =
    domain.solver.fixedStepSeconds *
    Math.sqrt(domain.solver.gravity * domain.solver.referenceDepth) *
    Math.sqrt(
      1 / (domain.grid.cellX * domain.grid.cellX) +
        1 / (domain.grid.cellZ * domain.grid.cellZ),
    );
  const bare: ReturnType<typeof fluidDomainBudget> = fluidDomainBudget(fluidDomain());
  TestValidator.predicate("budget reports the derived Courant number", nclose(budget.courant, expectedCourant, 0));
  TestValidator.predicate("Courant function evaluates the same contract", nclose(fluidCourantNumber(domain), expectedCourant, 0));
  TestValidator.predicate("authored clock remains within the Courant bound", budget.courant <= 1);
  TestValidator.equals("bare domain has no spray and two cells", { sprayParticleCap: bare.sprayParticleCap, cells: bare.cells }, { sprayParticleCap: 0, cells: 2 });

  const state: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(domain, 12);
  const nudged: IAutoMovieFluidState = {
    ...state,
    depth: state.depth.map((value: number, index: number): number =>
      index === 5 ? value + Number.EPSILON * value : value,
    ),
  };
  TestValidator.equals(
    "the digest is sensitive evidence, not decoration",
    namedFacts([
      ["length", (): boolean => fluidStateDigest(state).length === 8],
      ["hex", (): boolean => /^[0-9a-f]{8}$/.test(fluidStateDigest(state))],
      [
        "stable",
        (): boolean =>
          fluidStateDigest(state) ===
          fluidStateDigest(simulateFluidDomain(domain, 12)),
      ],
      ["sensitive", (): boolean => fluidStateDigest(state) !== fluidStateDigest(nudged)],
      [
        "stepSensitive",
        (): boolean =>
          fluidStateDigest(state) !==
          fluidStateDigest(simulateFluidDomain(domain, 13)),
      ],
    ]),
    {
      length: true,
      hex: true,
      stable: true,
      sensitive: true,
      stepSensitive: true,
    },
  );

  const dry: ReturnType<typeof validateWaterFeatures> = validateWaterFeatures({
    environment: basinEnvironment(),
    features: [],
    domains: [],
  });
  TestValidator.equals(
    "empty water features and domains are admitted",
    dry.success,
    true,
  );
}
