import {
  AutoMovieEngineFluid,
  AutoMovieEngineFluidMaxCells,
  AutoMovieEngineFluidMaxSteps,
} from "@automovie/engine";
import {
  IAutoMovieFluidDomain,
  IAutoMovieFluidDrain,
  IAutoMovieFluidSource,
  IAutoMovieFluidSpray,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { flatBasin } from "../internal/fluidFixtures";
import { hasViolation, namedFacts } from "../internal/predicates";
import { runFluidDomainPopulationCases } from "../internal/runFluidDomainPopulationCases";

/** Construct the original 4x4 quarter-metre-deep basin and apply only each admission case's authored overrides. */
const basin: (
  overrides?: Partial<IAutoMovieFluidDomain>,
) => IAutoMovieFluidDomain = (
  overrides: Partial<IAutoMovieFluidDomain> = {},
): IAutoMovieFluidDomain =>
  flatBasin({ columns: 4, rows: 4, depth: 0.25, overrides });

/** Original valid jet whose individual fields are replaced by located source-refusal cases; construction performs no admission. */
const source: (
  overrides?: Partial<IAutoMovieFluidSource>,
) => IAutoMovieFluidSource = (
  overrides: Partial<IAutoMovieFluidSource> = {},
): IAutoMovieFluidSource => ({
  id: "jet",
  column: 1,
  row: 1,
  flowRate: 0.05,
  start: 0,
  end: null,
  ...overrides,
});

/** Original valid return whose fields are replaced by drain window, rate and sill admission cases. */
const drain: (
  overrides?: Partial<IAutoMovieFluidDrain>,
) => IAutoMovieFluidDrain = (
  overrides: Partial<IAutoMovieFluidDrain> = {},
): IAutoMovieFluidDrain => ({
  id: "return",
  column: 2,
  row: 2,
  flowRate: 0.05,
  sillLevel: 0,
  start: 0,
  end: null,
  ...overrides,
});

/** Original valid mist whose overridden fields independently exercise the spray population and scalar admission rules. */
const spray: (
  overrides?: Partial<IAutoMovieFluidSpray>,
) => IAutoMovieFluidSpray = (
  overrides: Partial<IAutoMovieFluidSpray> = {},
): IAutoMovieFluidSpray => ({
  id: "mist",
  column: 1,
  row: 1,
  rate: 8,
  lifetime: 1,
  speed: 2,
  direction: { x: 0, y: 1, z: 0 },
  spread: 0.25,
  size: 0.05,
  seed: 7,
  maxParticles: 64,
  lodDistance: 12,
  ...overrides,
});

/**
 * Observe the original domain-admission scenario groups and their located
 * refusals, retaining the well-formed basin and selected adjacent valid twins.
 *
 * The clean source/drain/spray basin, stable-limit solver and tiny finite axis
 * distinguish malformed inputs from supported adjacent inputs.
 *
 * Scenarios:
 *
 * 1. A well-formed basin with a source, a drain and a spray validates clean.
 * 2. The lattice: a fractional column count, a zero row count, a non-positive cell
 *    size, a lattice past the cell budget, a lattice whose
 *    two legal side lengths multiply past the safe-integer range — the only
 *    grids nobody can afford are exactly the ones a counted budget can stop
 *    counting.
 * 3. The solver: a non-positive step, gravity, and reference depth; a negative
 *    drag and dry depth; a step budget past `AutoMovieEngineFluidMaxSteps`.
 * 4. Stability: accept the exact limit and a stable scaled domain. Refuse
 *    above-limit steps, including scaled and unrepresentably large results,
 *    at the timestep. Nonfinite spacing is reported at its grid field.
 * 5. State arrays: wrong lengths, a negative depth, a depth past the declared
 *    reference depth and water sitting in solid matter.
 * 6. Declared flows: duplicate ids, counts past the budget, cells off
 *    the lattice in all three ways an index can be wrong, cells inside solid
 *    matter, and activity windows that end before they start.
 * 7. Spray: non-positive rate, lifetime, size and LOD distance; a negative speed;
 *    spread outside `[0, 1]`; a particle cap outside its budget; a fractional
 *    seed; and a zero direction, while a finite axis too
 *    small to square is still accepted.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the domain validator for authored grid, solver, array, flow and spray cases. Checks admission and located findings for ordinary and scaled Courant cases, a result overflow and malformed cell spacing.
 * @evidence contracts/development/testing.md#independent-expectations Literal cell and face counts and scalar domains define the input boundaries. The unit-cell formula supplies the ordinary limit, and 1e-200 wave speed divided by 1e-200 spacing leaves values near 1/8 and 2 on opposite sides.
 * @evidence contracts/development/common.md#meaningful-documentation A normal basin is admitted. Grid, clock, state, flow and spray cases yield located findings, and unit and scaled Courant cases distinguish invalid operands from an unstable timestep.
 */
export function test_fluid_domain_validation(): void {
  const clean: ReturnType<typeof AutoMovieEngineFluid.validateFluidDomain> = AutoMovieEngineFluid.validateFluidDomain({
    domain: basin({
      sources: [source()],
      drains: [drain()],
      sprays: [spray()],
    }),
  });
  TestValidator.equals(
    "a well-formed basin validates clean",
    clean.success,
    true,
  );

  const lattice: ReturnType<typeof AutoMovieEngineFluid.validateFluidDomain> = AutoMovieEngineFluid.validateFluidDomain({
    domain: basin({
      grid: {
        columns: 2.5,
        rows: 0,
        cellX: 0,
        cellZ: -1,
        origin: { x: 0, y: 0, z: 0 },
      },
    }),
  });
  const huge: ReturnType<typeof AutoMovieEngineFluid.validateFluidDomain> = AutoMovieEngineFluid.validateFluidDomain({
    domain: basin({
      grid: {
        columns: 300,
        rows: 300,
        cellX: 1,
        cellZ: 1,
        origin: { x: 0, y: 0, z: 0 },
      },
      bed: new Array<number>(90_000).fill(0),
      depth: new Array<number>(90_000).fill(0),
      solid: new Array<boolean>(90_000).fill(false),
    }),
  });
  // Both side lengths are perfectly legal safe integers; only their product,
  // 2⁶⁰ cells, is unaffordable, and it is past `Number.MAX_SAFE_INTEGER`.
  const overflowing: ReturnType<typeof AutoMovieEngineFluid.validateFluidDomain> =
    AutoMovieEngineFluid.validateFluidDomain({
      domain: basin({
        grid: {
          columns: 2 ** 30,
          rows: 2 ** 30,
          cellX: 1,
          cellZ: 1,
          origin: { x: 0, y: 0, z: 0 },
        },
      }),
    });

  TestValidator.equals(
    "the lattice must be a whole, positive, affordable grid",
    namedFacts([
      [
        "columns",
        (): boolean => hasViolation(lattice, "type", "$input.grid.columns"),
      ],
      [
        "rows",
        (): boolean => hasViolation(lattice, "type", "$input.grid.rows"),
      ],
      [
        "cellX",
        (): boolean => hasViolation(lattice, "range", "$input.grid.cellX"),
      ],
      [
        "cellZ",
        (): boolean => hasViolation(lattice, "range", "$input.grid.cellZ"),
      ],
      ["budget", (): boolean => hasViolation(huge, "range", "$input.grid")],
      ["budgetValue", (): boolean => AutoMovieEngineFluidMaxCells === 65_536],
      [
        "overflow",
        (): boolean => hasViolation(overflowing, "range", "$input.grid"),
      ],
      [
        "overflowSides",
        (): boolean =>
          hasViolation(overflowing, "type", "$input.grid.columns") === false &&
          hasViolation(overflowing, "type", "$input.grid.rows") === false,
      ],
    ]),
    {
      columns: true,
      rows: true,
      cellX: true,
      cellZ: true,
      budget: true,
      budgetValue: true,
      overflow: true,
      overflowSides: true,
    },
  );

  const solver: ReturnType<typeof AutoMovieEngineFluid.validateFluidDomain> = AutoMovieEngineFluid.validateFluidDomain({
    domain: basin({
      solver: {
        fixedStepSeconds: 0,
        gravity: 0,
        drag: -1,
        dryDepth: -0.5,
        referenceDepth: 0,
        maxSteps: AutoMovieEngineFluidMaxSteps + 1,
      },
    }),
  });
  TestValidator.equals(
    "the solver settings must be physically usable",
    namedFacts([
      [
        "step",
        (): boolean =>
          hasViolation(solver, "range", "$input.solver.fixedStepSeconds"),
      ],
      [
        "gravity",
        (): boolean => hasViolation(solver, "range", "$input.solver.gravity"),
      ],
      [
        "drag",
        (): boolean => hasViolation(solver, "range", "$input.solver.drag"),
      ],
      [
        "dry",
        (): boolean => hasViolation(solver, "range", "$input.solver.dryDepth"),
      ],
      [
        "reference",
        (): boolean =>
          hasViolation(solver, "range", "$input.solver.referenceDepth"),
      ],
      [
        "steps",
        (): boolean => hasViolation(solver, "type", "$input.solver.maxSteps"),
      ],
    ]),
    {
      step: true,
      gravity: true,
      drag: true,
      dry: true,
      reference: true,
      steps: true,
    },
  );

  // dt·sqrt(g·H)·sqrt(1/dx² + 1/dz²) with g = 8, H = 2, dx = dz = 1 is
  // dt·4·sqrt(2), so dt = 1/(4·sqrt(2)) sits exactly on the stability limit.
  const onLimit: number = 1 / (4 * Math.SQRT2);
  const stable: ReturnType<typeof AutoMovieEngineFluid.validateFluidDomain> = AutoMovieEngineFluid.validateFluidDomain({
    domain: basin({
      grid: {
        columns: 4,
        rows: 4,
        cellX: 1,
        cellZ: 1,
        origin: { x: 0, y: 0, z: 0 },
      },
      solver: {
        fixedStepSeconds: onLimit,
        gravity: 8,
        drag: 0,
        dryDepth: 0,
        referenceDepth: 2,
        maxSteps: 100,
      },
    }),
  });
  const unstable: ReturnType<typeof AutoMovieEngineFluid.validateFluidDomain> = AutoMovieEngineFluid.validateFluidDomain({
    domain: basin({
      grid: {
        columns: 4,
        rows: 4,
        cellX: 1,
        cellZ: 1,
        origin: { x: 0, y: 0, z: 0 },
      },
      solver: {
        fixedStepSeconds: onLimit * 2,
        gravity: 8,
        drag: 0,
        dryDepth: 0,
        referenceDepth: 2,
        maxSteps: 100,
      },
    }),
  });

  TestValidator.equals(
    "the Courant condition is the stability gate, and it has both sides",
    namedFacts([
      ["stable", (): boolean => stable.success === true],
      [
        "unstable",
        (): boolean =>
          hasViolation(unstable, "range", "$input.solver.fixedStepSeconds"),
      ],
    ]),
    { stable: true, unstable: true, },
  );

  // The separate wave product overflows but the final Courant number is
  // finite and far above one at the authored half-metre spacing.
  const largeCourant: ReturnType<typeof AutoMovieEngineFluid.validateFluidDomain> =
    AutoMovieEngineFluid.validateFluidDomain({
      domain: basin({
        solver: {
          fixedStepSeconds: 0.015625,
          gravity: 1e200,
          drag: 0,
          dryDepth: 0,
          referenceDepth: 1e200,
          maxSteps: 100,
        },
      }),
    });
  TestValidator.equals(
    "a large finite Courant number from extreme inputs is refused",
    namedFacts([
      [
        "refusedAtTheStep",
        (): boolean =>
          hasViolation(
            largeCourant,
            "range",
            "$input.solver.fixedStepSeconds",
          ),
      ],
      [
        "inputsThemselvesAccepted",
        (): boolean =>
          hasViolation(largeCourant, "range", "$input.solver.gravity") ===
            false &&
          hasViolation(
            largeCourant,
            "range",
            "$input.solver.referenceDepth",
          ) === false,
      ],
    ]),
    { refusedAtTheStep: true, inputsThemselvesAccepted: true },
  );

  const dry: IAutoMovieFluidDomain = flatBasin({ columns: 2, rows: 1, depth: 0 });
  const scaled: IAutoMovieFluidDomain = {
    ...dry,
    grid: { ...dry.grid, cellX: 1e-200, cellZ: 1 },
    solver: { ...dry.solver, gravity: 1e-200, referenceDepth: 1e-200 },
  };
  const below: ReturnType<typeof AutoMovieEngineFluid.validateFluidDomain> =
    AutoMovieEngineFluid.validateFluidDomain({
      domain: { ...scaled, solver: { ...scaled.solver, fixedStepSeconds: 1 / 8 } },
    });
  const above: ReturnType<typeof AutoMovieEngineFluid.validateFluidDomain> =
    AutoMovieEngineFluid.validateFluidDomain({
      domain: { ...scaled, solver: { ...scaled.solver, fixedStepSeconds: 2 } },
    });
  const overflow: ReturnType<typeof AutoMovieEngineFluid.validateFluidDomain> =
    AutoMovieEngineFluid.validateFluidDomain({
      domain: {
        ...dry,
        solver: {
          ...dry.solver,
          fixedStepSeconds: Number.MAX_VALUE,
          gravity: Number.MAX_VALUE,
          referenceDepth: Number.MAX_VALUE,
        },
      },
    });
  const invalidSpacing: ReturnType<typeof AutoMovieEngineFluid.validateFluidDomain> =
    AutoMovieEngineFluid.validateFluidDomain({
      domain: {
        ...scaled,
        grid: { ...scaled.grid, cellX: Infinity },
        solver: { ...scaled.solver, fixedStepSeconds: 2, gravity: 1, referenceDepth: 1 },
      },
    });
  TestValidator.equals(
    "scaled CFL depends on the dimensionless result and finite inputs",
    {
      scaledBelow: below.success,
      scaledAbove: hasViolation(above, "range", "$input.solver.fixedStepSeconds"),
      resultOverflow: hasViolation(overflow, "range", "$input.solver.fixedStepSeconds"),
      badSpacing: hasViolation(invalidSpacing, "range", "$input.grid.cellX"),
      badSpacingStep: hasViolation(invalidSpacing, "range", "$input.solver.fixedStepSeconds"),
    },
    { scaledBelow: true, scaledAbove: true, resultOverflow: true, badSpacing: true, badSpacingStep: false },
  );

  runFluidDomainPopulationCases({ basin, source, drain, spray });
}
