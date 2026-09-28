import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

/**
 * Breast position, point, vertical volume and cup-size appearance. The sex, age and fat knots are authored exterior responses and do not infer glandular anatomy or pubertal development.
 *
 * These dimensionless rows set visible skin channel weights. They neither reconstruct tissue volumes nor establish safe contact in a combined pose.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_BREAST: IAutoMovieHumanBodySimpleShapeTable["terms"] = [
    {
      // the breast descends with age, most across menopause, and with body mass (Regnault grades; post-menopause and BMI are independent risk factors)
      channel: "breastTransDownUp",
      gain: -0.6,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [25, 0],
            [45, 0.3],
            [55, 0.7],
            [80, 1],
          ],
        },
      ],
    },
    {
      // heavier breasts descend further
      channel: "breastTransDownUp",
      gain: -0.3,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [22, 0],
            [30, 0.7],
            [40, 1],
          ],
        },
      ],
    },
    {
      // the lower pole fills as the gland involutes to fat
      channel: "breastVolumeVertDownUp",
      gain: -0.5,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [30, 0],
            [50, 0.4],
            [70, 0.9],
            [90, 1],
          ],
        },
      ],
    },
    {
      // and loses projection
      channel: "breastPoint",
      gain: -0.4,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [30, 0],
            [60, 0.7],
            [85, 1],
          ],
        },
      ],
    },
    {
      // breast volume tracks body fat (the breast is largely adipose)
      channel: "macroCupsize",
      gain: 0.5,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [18, -0.6],
            [22, 0],
            [30, 0.6],
            [40, 1],
          ],
        },
      ],
    },
    {
      // an adipose male chest (pseudogynecomastia) with body mass, held back by the pectoral muscle
      channel: "macroCupsize",
      gain: 0.4,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 0],
            [1, 1],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [26, 0],
            [32, 0.6],
            [40, 1],
          ],
        },
        {
          parameter: "developedMuscle",
          points: [
            [-1, 1],
            [0, 1],
            [1, 0.4],
          ],
        },
      ],
    },
];
