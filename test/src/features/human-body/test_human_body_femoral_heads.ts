import {
  type IAutoMovieHumanBodyBuild,
  createHumanBodyFemoralHeadsFromAnatomicalMeasurements,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Side-specific hip-head spheres consume physical CT/MRI radii without a
 * population prior or a user-authored 3D position.
 */
export const test_human_body_femoral_heads = (): void => {
  const transform = (x: number) => ({
    position: { x, y: 0.9, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  });
  const bones = (["leftUpperLeg", "rightUpperLeg"] as const).map(
    (bone, index) => ({
      bone,
      rest: transform(index ? 0.11 : -0.11),
      posed: transform(index ? 0.13 : -0.13),
    }),
  ) satisfies IAutoMovieHumanBodyBuild["bones"];
  const measurements = {
    leftLowerLimb: {
      thigh: {
        femur: {
          sphereFittedHeadRadius: {
            kind: "observed" as const,
            millimetres: 22,
            modality: "ct" as const,
            acquisitionPosture: "supine" as const,
          },
        },
      },
    },
    rightLowerLimb: {
      thigh: {
        femur: {
          sphereFittedHeadRadius: { kind: "target" as const, millimetres: 25 },
        },
      },
    },
  };
  const heads = createHumanBodyFemoralHeadsFromAnatomicalMeasurements({
    measurements,
    bones,
  });
  TestValidator.equals(
    "each direct radius keeps its side, unit and source",
    heads.map((head) => [
      head.bone,
      head.center.x,
      head.radiusMetres,
      head.source,
    ]),
    [
      ["leftUpperLeg", -0.13, 0.022, "observed"],
      ["rightUpperLeg", 0.13, 0.025, "target"],
    ],
  );
  TestValidator.equals(
    "CT acquisition remains attached to the observed head",
    heads[0].source === "observed" ? heads[0].observation : null,
    measurements.leftLowerLimb.thigh.femur.sphereFittedHeadRadius,
  );
  TestValidator.equals(
    "an absent radius produces no estimated bone",
    createHumanBodyFemoralHeadsFromAnatomicalMeasurements({
      measurements: { age: { kind: "target", years: 25 } },
      bones,
    }),
    [],
  );
  TestValidator.predicate(
    "a projected circle is not a 3D sphere-fit measurement",
    throwsError(() =>
      createHumanBodyFemoralHeadsFromAnatomicalMeasurements({
        measurements: {
          leftLowerLimb: {
            thigh: {
              femur: {
                sphereFittedHeadRadius: {
                  kind: "observed",
                  millimetres: 22,
                  modality: "radiograph",
                  acquisitionPosture: "supine",
                } as never,
              },
            },
          },
        },
        bones,
      }),
    ),
  );
  TestValidator.predicate(
    "a supplied radius still needs its posed joint",
    throwsError(() =>
      createHumanBodyFemoralHeadsFromAnatomicalMeasurements({
        measurements,
        bones: bones.slice(1),
      }),
    ),
  );
};
