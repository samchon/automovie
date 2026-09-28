/**
 * Age, sex, muscle and regional tissue changes before the survey fits.
 * These ordered rows are authored data of the simple body table, not a
 * second evaluator. Curves and source notes remain beside each row.
 */
import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

type Term = IAutoMovieHumanBodySimpleShapeTable["terms"][number];

/**
 * Ordered life-stage and tissue relations applied before population fits.
 *
 * The macro age nodes follow the MPFB source. The muscle row subtracts 0.3
 * from age 30 to 80, a linear six-percentage-point-per-decade authoring
 * approximation within the broad 3–8% muscle-loss range discussed by Volpi
 * et al. (doi:10.1097/01.mco.0000134362.76653.b2). The gluteal age/weight
 * relation is not settled: Gonzalez 2006 reported both associations in 87
 * surgical candidates (doi:10.1007/s00266-005-0051-y), whereas Babuccu et
 * al. 2004 reported weight rather than age for adult strata in 132 women
 * (doi:10.1007/s00266-004-4010-9). Its knots are authored, not a fitted
 * universal causal law. Gluteal and abdominal rows describe visible tissue
 * responses rather than reconstructing
 * each person's muscle and fat compartments. The simple-tier evaluator sums
 * these dimensionless channel gains in the table's declared order; no row
 * moves a vertex directly or certifies a physiological range.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_LIFECYCLE: IAutoMovieHumanBodySimpleShapeTable["terms"] = [
    {
      channel: "macroGender",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, -1],
            [1, 1],
          ],
        },
      ],
    },
    {
      channel: "macroAge",
      gain: 1,
      curves: [
        {
          parameter: "ageYears",
          points: [
            [11, -1],
            [25, 0],
            [90, 1],
          ],
        },
      ],
    },
    {
      channel: "macroMuscle",
      gain: 1,
      curves: [
        {
          parameter: "muscle",
          points: [
            [-1, -1],
            [2, 2],
          ],
        },
      ],
    },
    {
      // authored 30% loss from 30 to 80; not an individual sarcopenia forecast
      channel: "macroMuscle",
      gain: -0.3,
      curves: [
        {
          parameter: "ageYears",
          points: [
            [30, 0],
            [80, 1],
          ],
        },
      ],
    },
    ...(
      [
        ["upperarmMuscleLeft", 0.6],
        ["upperarmMuscleRight", 0.6],
        ["upperarmShoulderMuscleLeft", 0.6],
        ["upperarmShoulderMuscleRight", 0.6],
        ["lowerarmMuscleLeft", 0.6],
        ["lowerarmMuscleRight", 0.6],
        ["upperlegMuscleLeft", 0.67],
        ["upperlegMuscleRight", 0.67],
        ["lowerlegMuscleLeft", 0.67],
        ["lowerlegMuscleRight", 0.67],
        ["torsoMusclePectoral", 0.6],
        ["torsoMuscleDorsi", 0.6],
      ] as const
    ).map(
      // the regional muscle the macro does not carry to a bodybuilder's bulk,
      // gained in proportion to the muscle there: training grows both sexes'
      // muscle by a similar share (Roberts et al. 2020, a meta-analysis of
      // matched programmes), and a woman carries 40 percent less muscle than
      // a man in the upper body (arms and trunk) and 33 percent less in the
      // lower (Janssen et al. 2000, whole-body MRI of 468 adults)
      ([channel, woman]): Term => ({
        channel,
        gain: 0.7,
        curves: [
          {
            parameter: "developedMuscle",
            points: [
              [-1, -1],
              [1, 1],
              [2, 1.43],
            ],
          },
          {
            parameter: "sex",
            points: [
              [-1, woman],
              [1, 1],
            ],
          },
        ],
      }),
    ),
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
    {
      channel: "stomachOverhang",
      gain: 1,
      curves: [
        {
          parameter: "bodyMassIndex",
          points: [
            [25, 0],
            [30, 0.4],
            [35, 0.8],
            [40, 1],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [20, 0.8],
            [60, 1],
          ],
        },
      ],
    },
    {
      // android fat: the flanks, more on men and with age
      channel: "flankFat",
      gain: 1,
      curves: [
        {
          parameter: "bodyMassIndex",
          points: [
            [22, 0],
            [27, 0.5],
            [35, 1],
          ],
        },
        {
          parameter: "sex",
          points: [
            [-1, 0.6],
            [1, 1],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [25, 0.8],
            [65, 1],
          ],
        },
      ],
    },
    ...["outerThighFatLeft", "outerThighFatRight"].map(
      (channel): Term => ({
        // gynoid fat: the outer thighs, more on women, less with age
        channel,
        gain: 1,
        curves: [
          {
            parameter: "bodyMassIndex",
            points: [
              [22, 0],
              [28, 0.6],
              [35, 1],
            ],
          },
          {
            parameter: "sex",
            points: [
              [-1, 1],
              [1, 0.3],
            ],
          },
          {
            parameter: "ageYears",
            points: [
              [25, 1],
              [70, 0.6],
            ],
          },
        ],
      }),
    ),
];
