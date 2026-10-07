import type { IAutoMovieColor, IAutoMovieStageLight } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { hasViolation, namedFacts } from "./predicates";
import type { IFilmStageLightBoundaryInputs } from "./IFilmStageLightBoundaryInputs";

/** Run the existing light numeric, color and discriminator boundary assertions in their original order. */
export function assertFilmStageLightBoundaries(input: IFilmStageLightBoundaryInputs): void {
  const { stageLights, failure } = input;
  // 7. BOUNDARIES
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
  const spotAt = (coneAngle: number) =>
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
    "the cone's open end (90) is legal",
    spotAt(90).success,
    true,
  );
  TestValidator.equals(
    "and both sides just past it are not",
    namedFacts([
      [
        "hasViolationFailureSpotAt",
        () => hasViolation(failure(spotAt(90.0001)), "range", "coneAngle"),
      ],
      [
        "hasViolationFailureSpotAt2",
        () => hasViolation(failure(spotAt(0)), "range", "coneAngle"),
      ],
      [
        "hasViolationFailureSpotAt3",
        () => hasViolation(failure(spotAt(Number.NaN)), "range", "coneAngle"),
      ],
    ]),
    {
      hasViolationFailureSpotAt: true,
      hasViolationFailureSpotAt2: true,
      hasViolationFailureSpotAt3: true,
    },
  );
  TestValidator.equals(
    "range 0 is infinite while a negative range is refused",
    namedFacts([
      [
        "zeroRangeStages",
        () =>
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
        () =>
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
    "a non-finite position is refused as a range fault, not a missing one",
    hasViolation(
      failure(
        stageLights([
          {
            node: "flame",
            type: "point",
            position: { x: 0, y: Number.POSITIVE_INFINITY, z: 0 },
            intensity: 1,
          },
        ]),
      ),
      "range",
      "$input.lights[0].position",
    ),
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
  const withColor = (color: unknown) =>
    failure(
      stageLights([
        {
          node: "sun",
          direction: { x: -1, y: -1, z: 0 },
          intensity: 1,
          color: color as IAutoMovieColor,
        },
      ]),
    );
  TestValidator.equals(
    "a color that is not an object reports instead of throwing",
    namedFacts([
      [
        "nullColorRefused",
        () => hasViolation(withColor(null), "type", "$input.lights[0].color"),
      ],
      [
        "arrayColorRefused",
        () =>
          hasViolation(withColor([1, 1, 1]), "type", "$input.lights[0].color"),
      ],
    ]),
    { nullColorRefused: true, arrayColorRefused: true },
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
    "and an alpha outside it is refused HERE, not one rung later at commitScene",
    hasViolation(
      withColor({ r: 1, g: 1, b: 1, a: 5, hex: null }),
      "range",
      "$input.lights[0].color.a",
    ),
  );
  TestValidator.predicate(
    "an unknown light discriminator is refused at its source",
    hasViolation(
      failure(
        stageLights([
          {
            node: "arc",
            type: "laser",
            intensity: 1,
          } as unknown as IAutoMovieStageLight,
        ]),
      ),
      "type",
      "$input.lights[0].type",
    ),
  );
}
