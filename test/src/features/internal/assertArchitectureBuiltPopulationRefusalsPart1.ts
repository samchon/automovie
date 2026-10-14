import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltPopulation,
  IAutoMovieInstanceSetDesign,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validateBuiltEnvironment } from "../../../../packages/engine/src/architecture/validateBuiltEnvironment";
import { hasViolation, namedFacts } from "./predicates";

/** Execute the next ordered assertions of test_architecture_built_population_refusals.
 *
 * Scenarios:
 * 1. a population must name a space the record declares, once.
 * 2. a building population may not follow a production-world route.
 * 3. prototype bounds may degenerate but may not invert or become non-finite.
 * 4. the facts every layout needs are checked.
 * 5. a scatter radius of zero is refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the parent-supplied building validator closures to inspect authored type/range path membership for identity, route kind, prototype, count, anchor, heading and zero scatter radius, beside clean point-bound admission. A missing required path or blanket refusal changes these assertions; the parent owns completion of the ordered scenario.
 * @evidence contracts/testing.md#independent-expectations Authored space/set ids, finite noninverted prototype bounds and the literal field mutation paths determine admission expectations. Point bounds remain valid, count 2.5/0 and nonfinite anchor/heading are refused, and a building cannot resolve the named production-world route. These checks do not observe seed admission, recipe meshes or rendered enclosure.
 * @evidence contracts/testing.md#distinguishing-cases Unknown space, blank/duplicate set id, along-route layout, inverted/nonfinite bounds, fractional/zero count, nonfinite anchor/heading and scatter radius zero contrast with admitted point bounds. Nonfinite scatter radius is not a separate case here; later parts own variation ranges, lattice capacity and explicit transforms.
 * @evidence contracts/testing.md#execution-ownership assertArchitectureBuiltPopulationRefusalsPart1 is a synchronous portable assertion part directly imported and called by its test-01 parent; it is not a discoverable test, registers no dynamic case and starts no process, browser, artifact build or GPU. Returned locals and captured fixture closures stay request-owned until the parent returns.
 */
export function assertArchitectureBuiltPopulationRefusalsPart1(
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
    "a population must name a space the record declares, once",
    namedFacts([
      [
        "unresolvedSpace",
        (): boolean =>
          refuses([population({}, "cellar")], "populations[0].space", "type"),
      ],
      [
        "blankId",
        (): boolean =>
          refuses([population({ id: "  " })], "populations[0].set.id", "type"),
      ],
      [
        "duplicateId",
        (): boolean =>
          refuses(
            [population(), population()],
            "populations[1].set.id",
            "type",
          ),
      ],
    ]),
    { unresolvedSpace: true, blankId: true, duplicateId: true },
  );

  TestValidator.equals(
    "a building population may not follow a production-world route",
    refuses(
      [
        population({
          layout: {
            kind: "along-route",
            route: "market-lane",
            lateralJitter: 0.5,
          },
        }),
      ],
      "populations[0].set.layout.kind",
      "type",
    ),
    true,
  );

  TestValidator.equals(
    "prototype bounds may degenerate but may not invert or become non-finite",
    namedFacts([
      [
        "pointAccepted",
        (): boolean =>
          validateBuiltEnvironment({
            environment: work([
              population({}, "place", {
                min: { x: 0, y: 0, z: 0 },
                max: { x: 0, y: 0, z: 0 },
              }),
            ]),
          }).success === true,
      ],
      [
        "inverted",
        (): boolean =>
          hasViolation(
            validateBuiltEnvironment({
              environment: work([
                population({}, "place", {
                  min: { x: 2, y: 0, z: 0 },
                  max: { x: 1, y: 0, z: 0 },
                }),
              ]),
            }),
            "range",
            "populations[0].prototypeBounds.x",
          ),
      ],
      [
        "nonFinite",
        (): boolean =>
          hasViolation(
            validateBuiltEnvironment({
              environment: work([
                population({}, "place", {
                  min: { x: 0, y: Number.NaN, z: 0 },
                  max: { x: 0, y: 0, z: 0 },
                }),
              ]),
            }),
            "range",
            "populations[0].prototypeBounds.min.y",
          ),
      ],
    ]),
    { pointAccepted: true, inverted: true, nonFinite: true },
  );

  TestValidator.equals(
    "the facts every layout needs are checked",
    namedFacts([
      [
        "fractionalCount",
        (): boolean =>
          refuses([population({ count: 2.5 })], "populations[0].set.count"),
      ],
      [
        "emptyCount",
        (): boolean =>
          refuses([population({ count: 0 })], "populations[0].set.count"),
      ],
      [
        "nonFiniteAnchor",
        (): boolean =>
          refuses(
            [population({ anchor: { x: 0, y: Number.NaN, z: 0 } })],
            "populations[0].set.anchor.y",
          ),
      ],
      [
        "nonFiniteHeading",
        (): boolean =>
          refuses(
            [population({ facingDeg: Number.POSITIVE_INFINITY })],
            "populations[0].set.facingDeg",
          ),
      ],
    ]),
    {
      fractionalCount: true,
      emptyCount: true,
      nonFiniteAnchor: true,
      nonFiniteHeading: true,
    },
  );

  TestValidator.equals(
    "a scatter needs a positive finite radius",
    refuses(
      [
        population({
          layout: { kind: "scatter", radius: 0 },
        }),
      ],
      "populations[0].set.layout.radius",
    ),
    true,
  );
}
