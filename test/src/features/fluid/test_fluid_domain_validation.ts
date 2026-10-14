import {
  FLUID_MAX_CELLS,
  FLUID_MAX_STEPS,
  validateFluidDomain,
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
 * 2. Identity and schema: a whitespace-only id, a wrong schema version, and non-metre units
 *    are each refused.
 * 3. The lattice: a fractional column count, a zero row count, a non-positive cell
 *    size, a non-finite origin, a lattice past the cell budget, a lattice whose
 *    two legal side lengths multiply past the safe-integer range — the only
 *    grids nobody can afford are exactly the ones a counted budget can stop
 *    counting — and its twin, an unbounded side that is named as itself rather
 *    than as a cell count.
 * 4. The solver: a non-positive step, gravity, and reference depth; a negative
 *    drag and dry depth; a step budget past `FLUID_MAX_STEPS`.
 * 5. Stability: an above-limit step has a located range finding, while the
 *    limit step is accepted; NaN gravity is reported at gravity without a
 *    step finding, while finite gravity/depth whose product overflows cause a
 *    step finding. This entry does not assert the measured overshoot.
 * 6. State arrays: wrong lengths, a negative depth, a depth past the declared
 *    reference depth, a non-finite bed, water sitting in solid matter, and a
 *    solidity flag that is not a boolean beside a sibling flag that is.
 * 7. Boundaries: an unknown edge kind on each of the four edges.
 * 8. Declared flows: empty and duplicate ids, counts past the budget, cells off
 *    the lattice in all three ways an index can be wrong, cells inside solid
 *    matter, and activity windows that are non-finite or end before they
 *    start.
 * 9. Spray: non-positive rate, lifetime, size and LOD distance; a negative speed;
 *    spread outside `[0, 1]`; a particle cap outside its budget; a fractional
 *    seed; and a direction that is non-finite or zero, while a finite axis too
 *    small to square is still accepted.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the actual domain validator across schema, grid, solver, array, boundary, flow and spray cases and checks located kind/path witnesses, catching admitted malformed fields and rejecting sound adjacent inputs.
 * @evidence contracts/testing.md#independent-expectations Closed schema spellings, explicit cell/face counts and scalar domains provide the refusal basis; the independent Courant formula distinguishes exactly stable, unstable, nonfinite-input and finite-input-overflow cases. Path witnesses do not certify the entire report population.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the original nine scenario groups, valid basin, finite/safe-integer limits, array cardinality/values, solid occupancy, boundary vocabularies, source/drain windows and spray caps; physical integration and water-space binding remain separate tests.
 * @evidence contracts/testing.md#execution-ownership This named portable entry owns all admission cases, including cases delegated to its internal population helper, through validateFluidDomain and existing fixtures; it starts no solver host, process or renderer.
 */
export function test_fluid_domain_validation(): void {
  const clean: ReturnType<typeof validateFluidDomain> = validateFluidDomain({
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

  const schema: ReturnType<typeof validateFluidDomain> = validateFluidDomain({
    domain: basin({
      id: "  ",
      version: 2 as unknown as 1,
      units: "feet" as unknown as "meter",
    }),
  });
  TestValidator.equals(
    "identity and schema are refused when wrong",
    namedFacts([
      ["id", (): boolean => hasViolation(schema, "type", "$input.id")],
      [
        "version",
        (): boolean => hasViolation(schema, "type", "$input.version"),
      ],
      ["units", (): boolean => hasViolation(schema, "type", "$input.units")],
    ]),
    { id: true, version: true, units: true },
  );

  const lattice: ReturnType<typeof validateFluidDomain> = validateFluidDomain({
    domain: basin({
      grid: {
        columns: 2.5,
        rows: 0,
        cellX: 0,
        cellZ: -1,
        origin: { x: 0, y: Number.NaN, z: 0 },
      },
    }),
  });
  const huge: ReturnType<typeof validateFluidDomain> = validateFluidDomain({
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
  const overflowing: ReturnType<typeof validateFluidDomain> =
    validateFluidDomain({
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
  // The twin one property away: a side that is not a number at all has no
  // countable product, so it is named as the side it is rather than dressed up
  // as a budget the author could have met with a smaller grid.
  const boundless: ReturnType<typeof validateFluidDomain> = validateFluidDomain(
    {
      domain: basin({
        grid: {
          columns: Number.POSITIVE_INFINITY,
          rows: 4,
          cellX: 1,
          cellZ: 1,
          origin: { x: 0, y: 0, z: 0 },
        },
      }),
    },
  );
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
      [
        "origin",
        (): boolean => hasViolation(lattice, "range", "$input.grid.origin.y"),
      ],
      ["budget", (): boolean => hasViolation(huge, "range", "$input.grid")],
      ["budgetValue", (): boolean => FLUID_MAX_CELLS === 65_536],
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
      [
        "boundlessSide",
        (): boolean => hasViolation(boundless, "type", "$input.grid.columns"),
      ],
      [
        "boundlessNotBudget",
        (): boolean =>
          hasViolation(boundless, "range", "$input.grid") === false,
      ],
    ]),
    {
      columns: true,
      rows: true,
      cellX: true,
      cellZ: true,
      origin: true,
      budget: true,
      budgetValue: true,
      overflow: true,
      overflowSides: true,
      boundlessSide: true,
      boundlessNotBudget: true,
    },
  );

  const solver: ReturnType<typeof validateFluidDomain> = validateFluidDomain({
    domain: basin({
      solver: {
        fixedStepSeconds: 0,
        gravity: 0,
        drag: -1,
        dryDepth: -0.5,
        referenceDepth: 0,
        maxSteps: FLUID_MAX_STEPS + 1,
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
  const stable: ReturnType<typeof validateFluidDomain> = validateFluidDomain({
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
  const unstable: ReturnType<typeof validateFluidDomain> = validateFluidDomain({
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
  const nonFiniteCourant: ReturnType<typeof validateFluidDomain> =
    validateFluidDomain({
      domain: basin({
        solver: {
          fixedStepSeconds: 0.015625,
          gravity: Number.NaN,
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
      [
        "nonFinite",
        (): boolean =>
          hasViolation(nonFiniteCourant, "range", "$input.solver.gravity") &&
          hasViolation(
            nonFiniteCourant,
            "range",
            "$input.solver.fixedStepSeconds",
          ) === false,
      ],
    ]),
    { stable: true, unstable: true, nonFinite: true },
  );

  // Every input is a legal finite number, but g·H overflows: the Courant
  // number is infinite, which is unstable rather than unmeasured.
  const overflowingCourant: ReturnType<typeof validateFluidDomain> =
    validateFluidDomain({
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
    "a Courant number that overflows from legal inputs is refused as unstable",
    namedFacts([
      [
        "refusedAtTheStep",
        (): boolean =>
          hasViolation(
            overflowingCourant,
            "range",
            "$input.solver.fixedStepSeconds",
          ),
      ],
      [
        "inputsThemselvesAccepted",
        (): boolean =>
          hasViolation(overflowingCourant, "range", "$input.solver.gravity") ===
            false &&
          hasViolation(
            overflowingCourant,
            "range",
            "$input.solver.referenceDepth",
          ) === false,
      ],
    ]),
    { refusedAtTheStep: true, inputsThemselvesAccepted: true },
  );

  runFluidDomainPopulationCases({ basin, source, drain, spray });
}
