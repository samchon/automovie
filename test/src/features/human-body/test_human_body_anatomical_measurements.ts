import {
  admitHumanBodyAnatomicalMeasurements,
  type IAutoMovieHumanBodyAnatomicalMeasurements,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * A character target is distinct from a genuine scan, and the input gate
 * refuses impossible methods, empty parts, nonphysical scalars and mesh edits.
 */
export const test_human_body_anatomical_measurements = (): void => {
  const valid: IAutoMovieHumanBodyAnatomicalMeasurements = {
    age: { kind: "target", years: 25 },
    surface: {
      stature: { kind: "target", metres: 1.7 },
      mass: { kind: "target", kilograms: 60 },
      trunk: {
        waistGirth: {
          kind: "observed",
          metres: 0.75,
          method: "tape",
          acquisitionPosture: "standing",
          uncertaintyMetres: 0,
        },
      },
    },
    pelvis: {
      leftHip: {
        femur: { anteversion: { kind: "target", degrees: -5 } },
        gluteusMaximus: {
          muscleBellyVolume: {
            kind: "observed",
            millilitres: 557,
            modality: "ct",
            acquisitionPosture: "supine",
          },
        },
      },
    },
  };
  TestValidator.equals(
    "target and observed anatomy remain distinct",
    admitHumanBodyAnatomicalMeasurements(valid),
    valid,
  );
  TestValidator.predicate(
    "zero chronological age is a finite age, not a missing value",
    !throwsError(() =>
      admitHumanBodyAnatomicalMeasurements({
        age: { kind: "target", years: 0 },
      }),
    ),
  );
  const cases: [string, unknown][] = [
    ["empty root", {}],
    ["empty nested part", { pelvis: { leftHip: {} } }],
    ["direct sculpt", { surface: { positionsMetres: [0, 1, 2] } }],
    [
      "radiograph volume",
      {
        pelvis: {
          leftHip: {
            gluteusMaximus: {
              muscleBellyVolume: {
                kind: "observed",
                millilitres: 557,
                modality: "radiograph",
                acquisitionPosture: "standing",
              },
            },
          },
        },
      },
    ],
    [
      "caliper girth",
      {
        surface: {
          trunk: {
            waistGirth: {
              kind: "observed",
              metres: 0.75,
              method: "caliper",
              acquisitionPosture: "standing",
            },
          },
        },
      },
    ],
    [
      "projected circle is not a sphere-fitted head",
      {
        pelvis: {
          leftHip: {
            femur: {
              sphereFittedHeadRadius: {
                kind: "observed",
                millimetres: 22,
                modality: "radiograph",
                acquisitionPosture: "supine",
              },
            },
          },
        },
      },
    ],
    ["nonfinite age", { age: { kind: "target", years: Number.NaN } }],
    ["negative age", { age: { kind: "target", years: -1 } }],
    ["zero stature", { surface: { stature: { kind: "target", metres: 0 } } }],
    ["negative mass", { surface: { mass: { kind: "target", kilograms: -1 } } }],
    [
      "negative volume",
      {
        pelvis: {
          leftHip: {
            gluteusMaximus: {
              muscleBellyVolume: { kind: "target", millilitres: -1 },
            },
          },
        },
      },
    ],
    [
      "negative uncertainty",
      {
        surface: {
          trunk: {
            waistGirth: {
              kind: "observed",
              metres: 0.75,
              method: "tape",
              acquisitionPosture: "standing",
              uncertaintyMetres: -0.01,
            },
          },
        },
      },
    ],
  ];
  for (const [label, input] of cases)
    TestValidator.predicate(
      label,
      throwsError(() => admitHumanBodyAnatomicalMeasurements(input)),
    );
};
