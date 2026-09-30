import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

type Term = IAutoMovieHumanBodySimpleShapeTable["terms"][number];

/**
 * Macro sex, age and training development, followed by regional muscle response. Volpi et al. (doi:10.1097/01.mco.0000134362.76653.b2) discuss population muscle loss, Janssen et al. (doi:10.1152/jappl.2000.89.1.81) regional muscle distribution, and Roberts et al. 2020 (PMID:32218059) similar training hypertrophy by sex.
 *
 * The rows are authored MPFB-derived skin controls, not muscle or fat compartment measurements. Their age and sex sources and extrapolation limits are stated beside the relation they own.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_DEVELOPMENT: IAutoMovieHumanBodySimpleShapeTable["terms"] =
  [
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
  ];
