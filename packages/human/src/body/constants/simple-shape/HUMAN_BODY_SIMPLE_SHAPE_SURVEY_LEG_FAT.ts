import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

/**
 * Sex- and age-conditioned thigh and calf fat corrections fitted on the ANSUR II study subset. They adjust visible skin endpoints, not segmented adipose tissue.
 *
 * ANSUR II is a 2012 US Army working database of 4,082 men and 1,986 women
 * with 93 direct measurements. The connected body's fit used a 300-person
 * study subset and authored interpolation beyond observed samples; neither
 * is a universal relation for children or unobserved populations. The table
 * assembly preserves these rows' original summation order.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_SURVEY_LEG_FAT: IAutoMovieHumanBodySimpleShapeTable["terms"] =
  [
    {
      // ANSUR II people: upperlegFatLeft, women
      channel: "upperlegFatLeft",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [0, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, 0.023],
            [22, 0.084],
            [26, 0.068],
            [30, 0.015],
            [35, 0.036],
            [45, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: upperlegFatRight, women
      channel: "upperlegFatRight",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [0, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, 0.023],
            [22, 0.084],
            [26, 0.068],
            [30, 0.015],
            [35, 0.036],
            [45, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: lowerlegFatLeft, women
      channel: "lowerlegFatLeft",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [0, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, 0.006],
            [22, 0.099],
            [26, 0.155],
            [30, 0.119],
            [35, 0.052],
            [45, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: lowerlegFatRight, women
      channel: "lowerlegFatRight",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [0, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, 0.006],
            [22, 0.099],
            [26, 0.155],
            [30, 0.119],
            [35, 0.052],
            [45, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
  ];
