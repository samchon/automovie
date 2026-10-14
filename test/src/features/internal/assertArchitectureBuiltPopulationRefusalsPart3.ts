import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltPopulation,
  IAutoMovieConstraintViolation,
  IAutoMovieInstanceSetDesign,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validateBuiltEnvironment } from "@automovie/engine";
import { hasViolation, namedFacts } from "./predicates";

/** Execute the next ordered assertions of test_architecture_built_population_refusals.
 *
 * Scenarios:
 * 1. a grid's own lattice is checked, capacity included.
 * 2. a lattice's extra axis is checked with the rest.
 *
 * @evidence contracts/testing.md#behavioral-verification This ordered part owns "a grid's own lattice is checked, capacity included"; "a lattice's extra axis is checked with the rest". It executes the existing product assertions or supplies their authored inputs and returns only values needed by the next part; the discoverable parent entry owns completion of the whole scenario.
 * @evidence contracts/testing.md#independent-expectations Literal mutations require their authored field paths: rows zero, X spacing zero, Z spacing NaN and insufficient grid capacity; columns NaN must not add the whole-layout capacity path. Lattice capacity 2*2*2 is smaller than count 9 independently of expanded slots or returned bounds.
 * @evidence contracts/testing.md#distinguishing-cases Grid row/column, X/Z spacing and capacity mutations contrast with the ordinary baseline; negative lattice layers, zero Y spacing and insufficient lattice capacity cover the extra axis. Jitter is not mutated here. Part4 owns explicit blocks and the positive queried population.
 * @evidence contracts/testing.md#execution-ownership assertArchitectureBuiltPopulationRefusalsPart3 is a synchronous portable assertion part directly imported and called by its test-01 parent; it is not a discoverable test, registers no dynamic case and starts no process, browser, artifact build or GPU. Returned locals and captured fixture closures stay request-owned until the parent returns.
 */
export function assertArchitectureBuiltPopulationRefusalsPart3(
  population: (
    input?: Partial<IAutoMovieInstanceSetDesign>,
    space?: string,
    prototypeBounds?: IAutoMovieBuiltPopulation["prototypeBounds"],
  ) => IAutoMovieBuiltPopulation,
  work: (
    populations: IAutoMovieBuiltPopulation[],
  ) => IAutoMovieBuiltEnvironment,
  refuses: (
    populations: IAutoMovieBuiltPopulation[],
    path: string,
    kind?: "type" | "range",
  ) => boolean,
): void {
  TestValidator.equals(
    "a grid's own lattice is checked, capacity included",
    namedFacts([
      [
        "rows",
        (): boolean =>
          refuses(
            [
              population({
                layout: {
                  kind: "grid",
                  rows: 0,
                  columns: 2,
                  spacing: { x: 1, z: 1 },
                },
              }),
            ],
            "populations[0].set.layout.rows",
          ),
      ],
      [
        "spacingX",
        (): boolean =>
          refuses(
            [
              population({
                layout: {
                  kind: "grid",
                  rows: 2,
                  columns: 2,
                  spacing: { x: 0, z: 1 },
                },
              }),
            ],
            "populations[0].set.layout.spacing.x",
          ),
      ],
      [
        "spacingZ",
        (): boolean =>
          refuses(
            [
              population({
                layout: {
                  kind: "grid",
                  rows: 2,
                  columns: 2,
                  spacing: { x: 1, z: Number.NaN },
                },
              }),
            ],
            "populations[0].set.layout.spacing.z",
          ),
      ],
      [
        "capacityTooSmall",
        (): boolean =>
          refuses(
            [
              population({
                count: 5,
                layout: {
                  kind: "grid",
                  rows: 1,
                  columns: 1,
                  spacing: { x: 1, z: 1 },
                },
              }),
            ],
            "populations[0].set.layout",
          ),
      ],
      [
        "malformedColumnsReportOnlyTheColumn",
        (): boolean => {
          const validation: IAutoMovieValidation = validateBuiltEnvironment({
            environment: work([
              population({
                layout: {
                  kind: "grid",
                  rows: 2,
                  columns: Number.NaN,
                  spacing: { x: 1, z: 1 },
                },
              }),
            ]),
          });
          return (
            hasViolation(
              validation,
              "range",
              "populations[0].set.layout.columns",
            ) &&
            validation.success === false &&
            validation.violations.every(
              (violation: IAutoMovieConstraintViolation): boolean =>
                violation.path !== "$input.populations[0].set.layout",
            )
          );
        },
      ],
    ]),
    {
      rows: true,
      spacingX: true,
      spacingZ: true,
      capacityTooSmall: true,
      malformedColumnsReportOnlyTheColumn: true,
    },
  );

  TestValidator.equals(
    "a lattice's extra axis is checked with the rest",
    namedFacts([
      [
        "layers",
        (): boolean =>
          refuses(
            [
              population({
                layout: {
                  kind: "lattice",
                  rows: 2,
                  columns: 2,
                  layers: -1,
                  spacing: { x: 1, y: 1, z: 1 },
                },
              }),
            ],
            "populations[0].set.layout.layers",
          ),
      ],
      [
        "rise",
        (): boolean =>
          refuses(
            [
              population({
                layout: {
                  kind: "lattice",
                  rows: 2,
                  columns: 2,
                  layers: 2,
                  spacing: { x: 1, y: 0, z: 1 },
                },
              }),
            ],
            "populations[0].set.layout.spacing.y",
          ),
      ],
      [
        "capacityTooSmall",
        (): boolean =>
          refuses(
            [
              population({
                count: 9,
                layout: {
                  kind: "lattice",
                  rows: 2,
                  columns: 2,
                  layers: 2,
                  spacing: { x: 1, y: 1, z: 1 },
                },
              }),
            ],
            "populations[0].set.layout",
          ),
      ],
    ]),
    { layers: true, rise: true, capacityTooSmall: true },
  );
}
