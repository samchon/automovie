import type {
  IAutoMovieBuiltPopulation,
  IAutoMovieInstanceSetDesign,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "./predicates";

/** Execute the next ordered assertions of test_architecture_built_population_refusals.
 *
 * Scenarios:
 * 1. scale ranges are positive, finite and ordered; rotation ranges are finite and ordered.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the parent-supplied refusal closure for the nine authored uniform/per-axis scale and rotation mutations, checking each required field path. This observes the selected zero/nonfinite/reversed endpoints without requiring rotation angles to be positive; the parent owns completion of the ordered scenario.
 * @evidence contracts/testing.md#independent-expectations Uniform/per-axis scale intervals must be finite, positive and ordered; rotation intervals must be finite and ordered. These authored interval constraints determine located refusals independently of the bounds fold or generated slot positions.
 * @evidence contracts/testing.md#distinguishing-cases Zero/nonfinite minima/maxima and inverted scale intervals contrast with the ordinary population baseline; yaw/pitch/roll endpoint and ordering mutations are checked separately. Layout capacity and explicit transform records belong to Parts3/4.
 * @evidence contracts/testing.md#execution-ownership assertArchitectureBuiltPopulationRefusalsPart2 is a synchronous portable assertion part directly imported and called by its test-01 parent; it is not a discoverable test, registers no dynamic case and starts no process, browser, artifact build or GPU. Returned locals and captured fixture closures stay request-owned until the parent returns.
 */
export function assertArchitectureBuiltPopulationRefusalsPart2(
  population: (
    input?: Partial<IAutoMovieInstanceSetDesign>,
    space?: string,
    prototypeBounds?: IAutoMovieBuiltPopulation["prototypeBounds"],
  ) => IAutoMovieBuiltPopulation,
  refuses: (
    populations: IAutoMovieBuiltPopulation[],
    path: string,
    kind?: "type" | "range",
  ) => boolean,
): void {
  TestValidator.equals(
    "scale and rotation ranges used by bounds are positive, finite, and ordered",
    namedFacts([
      [
        "uniformMinimum",
        (): boolean =>
          refuses(
            [
              population({
                variation: {
                  scale: { min: 0, max: 1 },
                  palette: ["#808080"],
                  traits: [],
                },
              }),
            ],
            "populations[0].set.variation.scale.min",
          ),
      ],
      [
        "uniformMaximum",
        (): boolean =>
          refuses(
            [
              population({
                variation: {
                  scale: { min: 1, max: Number.NaN },
                  palette: ["#808080"],
                  traits: [],
                },
              }),
            ],
            "populations[0].set.variation.scale.max",
          ),
      ],
      [
        "uniformOrder",
        (): boolean =>
          refuses(
            [
              population({
                variation: {
                  scale: { min: 2, max: 1 },
                  palette: ["#808080"],
                  traits: [],
                },
              }),
            ],
            "populations[0].set.variation.scale",
          ),
      ],
      [
        "axisMinimum",
        (): boolean =>
          refuses(
            [
              population({
                variation: {
                  scale: { min: 1, max: 1 },
                  scale3: {
                    min: { x: 0, y: 1, z: 1 },
                    max: { x: 1, y: 1, z: 1 },
                  },
                  palette: ["#808080"],
                  traits: [],
                },
              }),
            ],
            "populations[0].set.variation.scale3.min.x",
          ),
      ],
      [
        "axisMaximum",
        (): boolean =>
          refuses(
            [
              population({
                variation: {
                  scale: { min: 1, max: 1 },
                  scale3: {
                    min: { x: 1, y: 1, z: 1 },
                    max: { x: 1, y: Number.POSITIVE_INFINITY, z: 1 },
                  },
                  palette: ["#808080"],
                  traits: [],
                },
              }),
            ],
            "populations[0].set.variation.scale3.max.y",
          ),
      ],
      [
        "axisOrder",
        (): boolean =>
          refuses(
            [
              population({
                variation: {
                  scale: { min: 1, max: 1 },
                  scale3: {
                    min: { x: 1, y: 1, z: 3 },
                    max: { x: 1, y: 1, z: 2 },
                  },
                  palette: ["#808080"],
                  traits: [],
                },
              }),
            ],
            "populations[0].set.variation.scale3.z",
          ),
      ],
      [
        "rotationMinimum",
        (): boolean =>
          refuses(
            [
              population({
                variation: {
                  scale: { min: 1, max: 1 },
                  rotationDeg: {
                    x: { min: Number.NaN, max: 0 },
                    y: { min: 0, max: 0 },
                    z: { min: 0, max: 0 },
                  },
                  palette: ["#808080"],
                  traits: [],
                },
              }),
            ],
            "populations[0].set.variation.rotationDeg.x.min",
          ),
      ],
      [
        "rotationMaximum",
        (): boolean =>
          refuses(
            [
              population({
                variation: {
                  scale: { min: 1, max: 1 },
                  rotationDeg: {
                    x: { min: 0, max: 0 },
                    y: { min: 0, max: Number.NEGATIVE_INFINITY },
                    z: { min: 0, max: 0 },
                  },
                  palette: ["#808080"],
                  traits: [],
                },
              }),
            ],
            "populations[0].set.variation.rotationDeg.y.max",
          ),
      ],
      [
        "rotationOrder",
        (): boolean =>
          refuses(
            [
              population({
                variation: {
                  scale: { min: 1, max: 1 },
                  rotationDeg: {
                    x: { min: 0, max: 0 },
                    y: { min: 0, max: 0 },
                    z: { min: 20, max: 10 },
                  },
                  palette: ["#808080"],
                  traits: [],
                },
              }),
            ],
            "populations[0].set.variation.rotationDeg.z",
          ),
      ],
    ]),
    {
      uniformMinimum: true,
      uniformMaximum: true,
      uniformOrder: true,
      axisMinimum: true,
      axisMaximum: true,
      axisOrder: true,
      rotationMinimum: true,
      rotationMaximum: true,
      rotationOrder: true,
    },
  );
}
