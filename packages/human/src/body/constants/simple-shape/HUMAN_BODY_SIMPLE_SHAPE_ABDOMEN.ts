import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

/**
 * Abdominal tone and navel-position appearance. The age, training and fat relations are visual skin controls, not a model of the abdominal wall's internal load or elasticity.
 *
 * These dimensionless rows set visible skin channel weights. They neither reconstruct tissue volumes nor establish safe contact in a combined pose.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_ABDOMEN: IAutoMovieHumanBodySimpleShapeTable["terms"] = [
    {
      // the abdominal wall's tone: raised by muscle
      channel: "stomachTone",
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
      // lost with age (diastasis and laxity)
      channel: "stomachTone",
      gain: -0.5,
      curves: [
        {
          parameter: "ageYears",
          points: [
            [30, 0],
            [60, 0.6],
            [90, 1],
          ],
        },
      ],
    },
    {
      // and with abdominal fat
      channel: "stomachTone",
      gain: -0.4,
      curves: [
        {
          parameter: "bodyMassIndex",
          points: [
            [25, 0],
            [32, 0.6],
            [40, 1],
          ],
        },
      ],
    },
    {
      // the navel lowers as abdominal fat grows
      channel: "stomachNavelDownUp",
      gain: -0.4,
      curves: [
        {
          parameter: "bodyMassIndex",
          points: [
            [25, 0],
            [35, 0.7],
            [45, 1],
          ],
        },
      ],
    },
];
