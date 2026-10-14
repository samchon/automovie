import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltPopulation,
  IAutoMovieInstanceSetDesign,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { builtEnvironmentSpacePopulations } from "@automovie/engine";
import { validateBuiltEnvironment } from "@automovie/engine";
import { namedFacts, throwsError } from "./predicates";

/** Execute the next ordered assertions of test_architecture_built_population_refusals.
 *
 * Scenarios:
 * 1. an explicit block states one finite transform per slot.
 * 2. a well-formed population validates and answers for its own space.
 *
 * @evidence contracts/testing.md#behavioral-verification This ordered part owns "an explicit block states one finite transform per slot"; "a well-formed population validates and answers for its own space". It executes the existing product assertions or supplies their authored inputs and returns only values needed by the next part; the discoverable parent entry owns completion of the whole scenario.
 * @evidence contracts/testing.md#independent-expectations Count 3 with one stored transform, a negative-infinite Z translation, quaternion W 2 and scale Y zero each require the literal authored path. The coherent four-slot grid validates and its declared space must return one population; that count assertion does not establish returned object identity or test explicit transform-id uniqueness.
 * @evidence contracts/testing.md#distinguishing-cases Too few transforms, nonfinite translation, nonunit rotation and nonpositive scale contrast with the well-formed set. The positive fixture validates and its owning space reports one set, while an undeclared query id throws; procedural layouts and shared identity fields belong to earlier parts.
 * @evidence contracts/testing.md#execution-ownership assertArchitectureBuiltPopulationRefusalsPart4 is a synchronous portable assertion part directly imported and called by its test-01 parent; it is not a discoverable test, registers no dynamic case and starts no process, browser, artifact build or GPU. Returned locals and captured fixture closures stay request-owned until the parent returns.
 */
export function assertArchitectureBuiltPopulationRefusalsPart4(
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
    "an explicit block states one finite transform per slot",
    namedFacts([
      [
        "tooFewTransforms",
        (): boolean =>
          refuses(
            [
              population({
                count: 3,
                layout: {
                  kind: "explicit",
                  transforms: [
                    {
                      id: "slot-0",
                      translation: { x: 0, y: 0, z: 0 },
                      rotation: { x: 0, y: 0, z: 0, w: 1 },
                      scale: { x: 1, y: 1, z: 1 },
                    },
                  ],
                },
              }),
            ],
            "populations[0].set.layout.transforms",
          ),
      ],
      [
        "nonFiniteTranslation",
        (): boolean =>
          refuses(
            [
              population({
                count: 1,
                layout: {
                  kind: "explicit",
                  transforms: [
                    {
                      id: "slot-0",
                      translation: {
                        x: 0,
                        y: 0,
                        z: Number.NEGATIVE_INFINITY,
                      },
                      rotation: { x: 0, y: 0, z: 0, w: 1 },
                      scale: { x: 1, y: 1, z: 1 },
                    },
                  ],
                },
              }),
            ],
            "populations[0].set.layout.transforms[0].translation.z",
          ),
      ],
      [
        "nonUnitRotation",
        (): boolean =>
          refuses(
            [
              population({
                count: 1,
                layout: {
                  kind: "explicit",
                  transforms: [
                    {
                      id: "slot-0",
                      translation: { x: 0, y: 0, z: 0 },
                      rotation: { x: 0, y: 0, z: 0, w: 2 },
                      scale: { x: 1, y: 1, z: 1 },
                    },
                  ],
                },
              }),
            ],
            "populations[0].set.layout.transforms[0].rotation",
          ),
      ],
      [
        "nonPositiveScale",
        (): boolean =>
          refuses(
            [
              population({
                count: 1,
                layout: {
                  kind: "explicit",
                  transforms: [
                    {
                      id: "slot-0",
                      translation: { x: 0, y: 0, z: 0 },
                      rotation: { x: 0, y: 0, z: 0, w: 1 },
                      scale: { x: 1, y: 0, z: 1 },
                    },
                  ],
                },
              }),
            ],
            "populations[0].set.layout.transforms[0].scale.y",
          ),
      ],
    ]),
    {
      tooFewTransforms: true,
      nonFiniteTranslation: true,
      nonUnitRotation: true,
      nonPositiveScale: true,
    },
  );

  TestValidator.equals(
    "a well-formed population validates and answers for its own space",
    namedFacts([
      [
        "validates",
        (): boolean =>
          validateBuiltEnvironment({ environment: work([population()]) })
            .success === true,
      ],
      [
        "owned",
        (): boolean =>
          builtEnvironmentSpacePopulations(work([population()]), "place")
            .length === 1,
      ],
      [
        "undeclaredSpaceRefused",
        (): boolean =>
          throwsError(
            (): IAutoMovieBuiltPopulation[] =>
              builtEnvironmentSpacePopulations(work([population()]), "cellar"),
            ['has no logical space "cellar"'],
          ),
      ],
    ]),
    { validates: true, owned: true, undeclaredSpaceRefused: true },
  );
}
