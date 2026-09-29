import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

/**
 * Breast-point height correction fitted on adult women in the ANSUR II study subset. It does not infer internal glandular anatomy or adolescent growth.
 *
 * ANSUR II is a 2012 US Army working database of 4,082 men and 1,986 women
 * with 93 direct measurements. The connected body's fit used a 300-person
 * study subset and authored interpolation beyond observed samples; neither
 * is a universal relation for children or unobserved populations. The table
 * assembly preserves these rows' original summation order.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_SURVEY_BREAST_POSITION: IAutoMovieHumanBodySimpleShapeTable["terms"] = [
    {
      // ANSUR II people: breastTransDownUp, women
      channel: "breastTransDownUp",
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
            [18, -0.594],
            [22, -0.257],
            [26, 0.083],
            [30, 0.411],
            [40, 0],
          ],
        },
      ],
    },
];
