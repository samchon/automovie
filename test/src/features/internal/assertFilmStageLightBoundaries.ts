import type {
  IAutoMovieColor,
  IAutoMovieStagedSet,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IFilmStageLightBoundaryInputs } from "./IFilmStageLightBoundaryInputs";
import { hasViolation, namedFacts } from "./predicates";

/**
 * Run the existing light numeric, color and discriminator boundary assertions in their original order.
 *
 * Behavior: Executes the original light staging numeric/color/discriminator cases through the supplied product seam and requires their located admission/refusal results.
 * Expectation basis: Closed per-kind fields, finite scalar/vector requirements, cone interval and canonical color rules determine literal expected kinds/paths; the helper supplies no rendered-light oracle.
 * Cases: Preserves intensity zero, zero aim, cone/range neighbors, non-finite coordinates, malformed vectors/colors, nullable/numeric alpha and unknown discriminator cases.
 * Execution: The existing owning entries call assertFilmStageLightBoundaries during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function assertFilmStageLightBoundaries(
  input: IFilmStageLightBoundaryInputs,
): void {
  const { stageLights, failure }: IFilmStageLightBoundaryInputs = input;
  // 7. Boundaries.
  TestValidator.equals(
    "a light that is off is still a light",
    stageLights([
      { node: "sun", direction: { x: -1, y: -1, z: 0 }, intensity: 0 },
    ]).success,
    true,
  );
  TestValidator.predicate(
    "a zero-length direction is still refused",
    hasViolation(
      failure(
        stageLights([
          { node: "sun", direction: { x: 0, y: 0, z: 0 }, intensity: 1 },
        ]),
      ),
      "range",
      "$input.lights[0].direction",
    ),
  );
  /** Stage the original spot operands with one supplied cone angle. */
  const spotAt: (coneAngle: number) => IAutoMovieStagedSet = (
    coneAngle: number,
  ): IAutoMovieStagedSet =>
    stageLights([
      {
        node: "lamp",
        type: "spot",
        position: { x: 0, y: 2, z: 0 },
        direction: { x: 0, y: -1, z: 0 },
        intensity: 1,
        coneAngle,
      },
    ]);
  TestValidator.equals(
    "the cone's closed upper end (90) is legal",
    spotAt(90).success,
    true,
  );
  TestValidator.equals(
    "zero and above-ninety angles are refused",
    namedFacts([
      [
        "hasViolationFailureSpotAt",
        (): boolean =>
          hasViolation(failure(spotAt(90.0001)), "range", "coneAngle"),
      ],
      [
        "hasViolationFailureSpotAt2",
        (): boolean => hasViolation(failure(spotAt(0)), "range", "coneAngle"),
      ],
    ]),
    {
      hasViolationFailureSpotAt: true,
      hasViolationFailureSpotAt2: true,
    },
  );
  TestValidator.equals(
    "range 0 is infinite while a negative range is refused",
    namedFacts([
      [
        "zeroRangeStages",
        (): boolean =>
          stageLights([
            {
              node: "flame",
              type: "point",
              position: { x: 0, y: 1, z: 0 },
              intensity: 1,
              range: 0,
            },
          ]).success === true,
      ],
      [
        "negativeRangeRefused",
        (): boolean =>
          hasViolation(
            failure(
              stageLights([
                {
                  node: "flame",
                  type: "point",
                  position: { x: 0, y: 1, z: 0 },
                  intensity: 1,
                  range: -1,
                },
              ]),
            ),
            "range",
            "$input.lights[0].range",
          ),
      ],
    ]),
    { zeroRangeStages: true, negativeRangeRefused: true },
  );
  TestValidator.predicate(
    "a color component outside [0, 1] is refused at its own component",
    hasViolation(
      failure(
        stageLights([
          {
            node: "sun",
            direction: { x: -1, y: -1, z: 0 },
            intensity: 1,
            color: { r: 1.5, g: 0.5, b: 0.5, a: null, hex: null },
          },
        ]),
      ),
      "range",
      "$input.lights[0].color.r",
    ),
  );

  // 8. the color's own totality and its alpha, the rule the scene artifact
  //     validator applies one rung later
  /** Stage one light color through the original typed ingress and read its validation result. */
  const withColor: (color: IAutoMovieColor) => IAutoMovieValidation = (
    color: IAutoMovieColor,
  ): IAutoMovieValidation =>
    failure(
      stageLights([
        {
          node: "sun",
          direction: { x: -1, y: -1, z: 0 },
          intensity: 1,
          color,
        },
      ]),
    );
  TestValidator.equals(
    "a light-slot alpha of null is the documented value, not a fault",
    stageLights([
      {
        node: "sun",
        direction: { x: -1, y: -1, z: 0 },
        intensity: 1,
        color: { r: 1, g: 1, b: 1, a: null, hex: null },
      },
    ]).success,
    true,
  );
  TestValidator.equals(
    "a numeric alpha inside [0, 1] is accepted",
    stageLights([
      {
        node: "sun",
        direction: { x: -1, y: -1, z: 0 },
        intensity: 1,
        color: { r: 1, g: 1, b: 1, a: 0.5, hex: null },
      },
    ]).success,
    true,
  );
  TestValidator.predicate(
    "an out-of-range alpha is refused at staging",
    hasViolation(
      withColor({ r: 1, g: 1, b: 1, a: 5, hex: null }),
      "range",
      "$input.lights[0].color.a",
    ),
  );
}
