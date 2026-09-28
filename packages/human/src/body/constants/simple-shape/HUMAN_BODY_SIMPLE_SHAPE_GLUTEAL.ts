import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

/**
 * Authored gluteal ptosis, volume and pelvic tone relations. Gonzalez 2006 (doi:10.1007/s00266-005-0051-y) associated age and weight with ptosis, while Babuccu et al. 2004 (doi:10.1007/s00266-004-4010-9) found adult weight rather than age effects. These knots are not a universal causal law.
 *
 * The rows are authored MPFB-derived skin controls, not muscle or fat compartment measurements. Their age and sex sources and extrapolation limits are stated beside the relation they own.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_GLUTEAL: IAutoMovieHumanBodySimpleShapeTable["terms"] = [
    {
      // authored age/BMI relation; the source studies disagree on age effects
      channel: "buttocksPtosis",
      gain: 1,
      curves: [
        {
          parameter: "ageYears",
          points: [
            [25, 0],
            [40, 0.15],
            [60, 0.5],
            [80, 0.9],
            [90, 1],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [18, 0.7],
            [25, 1],
            [35, 1.4],
          ],
        },
      ],
    },
    {
      // authored lift from developed muscle, attenuated with age; gluteal
      // muscle and tissue loss vary by person and are not measured by this row
      channel: "buttocksPtosis",
      gain: -0.4,
      curves: [
        {
          parameter: "developedMuscle",
          points: [
            [0, 0],
            [1, 1],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [30, 1],
            [60, 0.6],
            [90, 0.35],
          ],
        },
      ],
    },
    {
      // gluteal muscle mass, both ways from the average: the muscle a body
      // carries shows as the buttock's projection
      channel: "buttocksVolume",
      gain: 0.5,
      curves: [
        {
          parameter: "developedMuscle",
          points: [
            [-1, -1],
            [1, 1],
          ],
        },
      ],
    },
    {
      // authored age decline in gluteal volume; ptosis is not a direct
      // measurement of muscle or fat volume for an individual
      channel: "buttocksVolume",
      gain: -0.4,
      curves: [
        {
          parameter: "ageYears",
          points: [
            [30, 0],
            [60, 0.45],
            [90, 1],
          ],
        },
      ],
    },
    {
      // the pelvic soft tissue's tone: raised by muscle, lost with age, the
      // lost tone lowering the gluteal mass as a whole (global tissue ptosis)
      channel: "pelvisTone",
      gain: 0.5,
      curves: [
        {
          parameter: "developedMuscle",
          points: [
            [-1, -1],
            [1, 1],
          ],
        },
      ],
    },
    {
      channel: "pelvisTone",
      gain: -0.6,
      curves: [
        {
          parameter: "ageYears",
          points: [
            [30, 0],
            [60, 0.5],
            [90, 1],
          ],
        },
      ],
    },
];
